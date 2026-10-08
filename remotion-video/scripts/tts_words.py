# 词级时间戳的 TTS。
#
# 为什么不用 `edge-tts --write-subtitles`：那个 SRT 是**句级**的——它把连续的
# WordBoundary 攒成一条，直到句读才断开（实测第一条就是 8.3 秒一整句）。
# 句级对齐只能做到"读到哪句哪句亮"，而这一系列要的是"读到哪个字哪个字朱红"：
# 竖排原文上一个字一个字地红过去，是它跟别的读书账号最不一样的地方。
#
# 所以这里直接消费 edge-tts 的 WordBoundary 事件流——每个事件带 offset 与 duration，
# 单位是 100 纳秒。同一趟就把音频写出来，不另跑一遍对齐。
#
#   python tts_words.py <job.json> <voice>
#
# job.json 是 [{ "index": 1, "text": "...", "media": "...mp3", "words": "...json" }, ...]
# 一次进程处理全部段落：Node 那边一次 spawn，而不是每段一次。
import asyncio
import json
import os
import sys

import edge_tts

# 这台机器出网走代理，而 edge-tts 自己不会去读环境变量——不显式传，
# 它会在 TLS 握手处超时，报成一个看起来像"这个音色不存在"的错误。
PROXY = os.environ.get("https_proxy") or os.environ.get("HTTPS_PROXY") or None

TICKS_PER_SECOND = 10_000_000


async def synth_once(text, voice, media_path):
    """合成一段，返回 (词表, 音频字节数)。"""
    # boundary 默认是 "SentenceBoundary"——7.2.8 起改成句级了，实测一段 8 个字的
    # 古文只会回一条 29 秒的整句边界，一个字都落不下来。必须显式要词级。
    communicate = edge_tts.Communicate(text, voice, proxy=PROXY, boundary="WordBoundary")
    words = []
    audio_bytes = 0
    with open(media_path, "wb") as sink:
        async for chunk in communicate.stream():
            kind = chunk.get("type")
            if kind == "audio":
                data = chunk.get("data") or b""
                sink.write(data)
                audio_bytes += len(data)
            elif kind == "WordBoundary":
                start = chunk["offset"] / TICKS_PER_SECOND
                words.append(
                    {
                        "text": chunk["text"],
                        "start": round(start, 3),
                        "end": round(start + chunk["duration"] / TICKS_PER_SECOND, 3),
                    }
                )
    return words, audio_bytes


async def synth(job, voice, attempts=3):
    last = None
    for attempt in range(1, attempts + 1):
        try:
            words, size = await synth_once(job["text"], voice, job["media"])
            # 音频写成了、一个边界也没有，说明这一趟流是空的。宁可直接失败，
            # 也不要写出一份"时长为零"的产物让下游把整片排成 0 秒。
            if size < 1000 or not words:
                raise RuntimeError(f"empty synthesis (audio={size}B, words={len(words)})")
            with open(job["words"], "w", encoding="utf-8") as sink:
                json.dump(words, sink, ensure_ascii=False, indent=1)
            return words, size
        except Exception as error:  # noqa: BLE001 — 代理抖动与真错误都走这里，重试再看
            last = error
            if attempt < attempts:
                await asyncio.sleep(2 * attempt)
    raise RuntimeError(f"segment {job['index']}: {last}")


async def main():
    job_path, voice = sys.argv[1], sys.argv[2]
    with open(job_path, encoding="utf-8") as handle:
        jobs = json.load(handle)
    for job in jobs:
        words, size = await synth(job, voice)
        span = words[-1]["end"] - words[0]["start"] if words else 0.0
        chars = len([c for c in job["text"] if not c.isspace()])
        rate = chars / span if span > 0 else 0
        print(
            f"  seg-{job['index']:02d}  {len(words):>3} boundaries  "
            f"{span:5.1f}s  {rate:4.1f} chars/s  {size // 1024:>4}KB",
            flush=True,
        )


if __name__ == "__main__":
    asyncio.run(main())
