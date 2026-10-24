# -*- coding: utf-8 -*-
"""Build the curated same-production-method (AI workflow) account table.

Combines user-search results (ai-batch*.json) with homepage detail
(ai-profiles/*.json), classifies confirmed AI-workflow accounts, and emits
douyin-sametype.csv.
"""
import json, glob, os, csv, re

base = os.path.dirname(os.path.abspath(__file__))

# gather all user-search rows
search = {}  # nick -> row
for fp in glob.glob(os.path.join(base, "ai-batch*.json")):
    with open(fp, encoding="utf-8") as f:
        d = json.load(f)
    for kw, rows in d.items():
        for r in rows:
            search.setdefault(r["nick"], r)

# gather homepage profiles
profiles = {}
for fp in glob.glob(os.path.join(base, "ai-profiles", "*.json")):
    with open(fp, encoding="utf-8") as f:
        p = json.load(f)
    profiles[p["nick"]] = p

# curated classification: nick -> (group, note)
T2 = "Tier2 图文+AI配音"
T3 = "Tier3 中药AI动画/故事"
curated = {
    # Tier 2 - generic knowledge / bedtime, AI image-text + TTS
    "第一国学": (T2, "AI动画/图文批量讲国学民俗，6920部，日更"),
    "睡前历史说": (T2, "AI图文+配音，30-48分钟睡前人物志"),
    "睡前历史人物说": (T2, "睡前历史矩阵"),
    "睡前历史人物故事(每天更新)": (T2, "睡前历史矩阵"),
    "睡前历史": (T2, "睡前历史矩阵"),
    "睡前历史解说": (T2, "睡前历史矩阵"),
    "千秋说书": (T2, "史料故事化创作"),
    "睡前历史故事汇": (T2, "睡前历史矩阵"),
    "听会历史就睡觉": (T2, "历史有声/睡前"),
    "睡前讲历史": (T2, "睡前历史小课堂"),
    "睡前历史汇": (T2, "睡前历史矩阵"),
    "小 S 聊中医": (T2, "AI制作(aixslzy)，集数化系列，中医论述型"),
    # Tier 3 - herb-vertical AI
    "学中药百科": (T3, "AI图文，听故事识中药/药食"),
    "百草风月集": (T3, "3D国风动画，把药讲成情感故事"),
    "100个中药小故事": (T3, "AI古风图，一味药一个故事"),
    "草本动漫馆": (T3, "国风动画识药"),
    "药有趣": (T3, "动画讲药，小体量"),
    "药你听我说": (T3, "动画说中药，小体量"),
    "本草小精灵": (T3, "原创3D治愈动画，刚起步"),
    "AI本草中药说": (T3, "照录《本草纲目》性味，形态最像我们（反例：仅71粉）"),
    "中药故事": (T3, "呆萌动画人物，0粉新号"),
}

out = []
for nick, (group, note) in curated.items():
    row = search.get(nick, {"nick": nick})
    prof = profiles.get(nick)
    fans = row.get("fans")
    likes = row.get("likes")
    works = None
    top_videos = ""
    if prof:
        st = prof.get("stats", {})
        works = st.get("works")
        if fans is None and st.get("fans_txt"):
            fans = st.get("fans_txt")
        vids = prof.get("videos", [])
        top = sorted(vids, key=lambda v: (v.get("likes") or 0), reverse=True)[:3]
        top_videos = " ; ".join(f"{v['title'][:40]}({v['likes']})" for v in top)
    out.append({
        "group": group, "nick": nick, "fans": fans,
        "total_likes": likes, "works": works,
        "bio": (row.get("bio") or "").replace("\n", " ")[:160],
        "note": note, "top_videos": top_videos[:400],
        "sec": row.get("sec"),
    })

def fnum(x):
    if isinstance(x, (int, float)): return x
    return -1
out.sort(key=lambda r: (r["group"], -fnum(r["fans"])))

csv_path = os.path.join(base, "douyin-sametype.csv")
cols = ["group", "nick", "fans", "works", "total_likes", "note", "bio", "top_videos", "sec"]
with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=cols)
    w.writeheader()
    for r in out:
        w.writerow({k: r.get(k) for k in cols})

print("curated same-type accounts:", len(out))
for g in (T2, T3):
    grp = [r for r in out if r["group"] == g]
    print(f"\n{g} ({len(grp)}):")
    for r in grp:
        print(f"  {str(r['fans']):>8} | works {str(r['works']):>5} | {r['nick'][:22]}")
