"""长视频配音：film.yaml 的每段旁白 → mp3 + 词级时间戳。

    python3 scripts/longform/voice.py pangxie

产出
  public/voice/<id>/seg-NN.mp3
  src/topics/<id>/voice.json   [{text, dur, words:[{t,s,e}]}]，构建脚本用它把镜头的 `at` 词换算成秒

为什么是 Python：Node 在部分沙箱里不能 spawn 子进程，edge-tts 的 Python 包可以直接拿到
WordBoundary 事件；这些时间戳就是镜头切点的来源。

旁白没改的段不重新合成（按 文本+声线 的哈希判断），改一句只重做那一段。
如遇代理环境变量里带冒号导致 aiohttp 报错，先 unset HTTP(S)_PROXY 再跑。
"""
import asyncio
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

import edge_tts
import yaml

ROOT = Path(__file__).resolve().parents[2]


def duration(mp3: Path, words: list) -> float:
    if shutil.which("ffprobe"):
        out = subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)]
        )
        return round(float(out), 3)
    # 没有 ffprobe：用最后一个词的结束时间加一点尾音
    return round(words[-1]["e"] + 0.3, 3) if words else 0.0


async def synth(text: str, voice: dict, mp3: Path) -> list:
    comm = edge_tts.Communicate(text, voice["name"], rate=voice["rate"], boundary="WordBoundary")
    words = []
    with open(mp3, "wb") as f:
        async for ch in comm.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                s = ch["offset"] / 1e7
                words.append({"t": ch["text"], "s": round(s, 3), "e": round(s + ch["duration"] / 1e7, 3)})
    return words


async def main(film_id: str) -> None:
    film = yaml.safe_load((ROOT / "src/topics" / film_id / "film.yaml").read_text("utf8"))
    out_dir = ROOT / "public/voice" / film_id
    out_dir.mkdir(parents=True, exist_ok=True)
    voice_json = ROOT / "src/topics" / film_id / "voice.json"
    old = json.loads(voice_json.read_text("utf8")) if voice_json.exists() else []
    result = []
    for i, seg in enumerate(film["segments"], 1):
        text = seg["narration"].strip()
        key = hashlib.sha1(json.dumps([text, film["voice"]], ensure_ascii=False).encode()).hexdigest()[:12]
        mp3 = out_dir / f"seg-{i:02d}.mp3"
        prev = old[i - 1] if i - 1 < len(old) else None
        if prev and prev.get("hash") == key and mp3.exists():
            result.append(prev)
            print(f"seg {i:02d} 未改动，跳过")
            continue
        words = await synth(text, film["voice"], mp3)
        result.append({"text": text, "dur": duration(mp3, words), "hash": key, "words": words})
        print(f"seg {i:02d} {result[-1]['dur']:.2f}s {len(words)} 词")
    for extra in sorted(out_dir.glob("seg-*.mp3"))[len(result):]:
        extra.unlink()
    voice_json.write_text(json.dumps(result, ensure_ascii=False, indent=1), "utf8")
    print(f"共 {sum(r['dur'] for r in result):.1f}s → {voice_json.relative_to(ROOT)}")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else "pangxie"))
