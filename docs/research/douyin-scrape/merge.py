# -*- coding: utf-8 -*-
"""Merge douyin user-search data into one deduped CSV + summary.

Fixed re-scrapes (fix-batch*.json, fix2-*.json) have clean likes/fans and are
authoritative. Original batches (batch1-4.json) only contribute extra accounts;
their likes are known-corrupt (id/number concatenation), so dropped, while fans
(terminal position in the DOM text) are retained.
"""
import json, glob, os, csv, urllib.parse
from collections import Counter

base = os.path.dirname(os.path.abspath(__file__))
accounts = {}

def add(kw, rows, clean):
    for r in rows:
        sec = r.get("sec")
        if not sec:
            continue
        if sec not in accounts:
            rec = dict(r)
            if not clean:
                rec["likes"] = None  # corrupt in original batches
            rec["matched"] = [kw]
            accounts[sec] = rec
        else:
            accounts[sec]["matched"].append(kw)
            if clean:
                for k in ("nick", "id", "likes", "fans", "bio"):
                    if r.get(k) is not None:
                        accounts[sec][k] = r[k]

# 1) clean sources first
clean_files = sorted(glob.glob(os.path.join(base, "fix-batch*.json")))
for fp in clean_files:
    with open(fp, encoding="utf-8") as f:
        for kw, rows in json.load(f).items():
            add(kw, rows, True)

for fp in sorted(glob.glob(os.path.join(base, "fix2-*.json"))):
    kw = urllib.parse.unquote(os.path.basename(fp)[len("fix2-"):-len(".json")])
    with open(fp, encoding="utf-8") as f:
        add(kw, json.load(f), True)

# 2) original batches (supplement only)
for fp in sorted(glob.glob(os.path.join(base, "batch[1-4].json"))):
    with open(fp, encoding="utf-8") as f:
        for kw, rows in json.load(f).items():
            add(kw, rows, False)

rows = list(accounts.values())
for r in rows:
    r["matched"] = "|".join(sorted(set(r["matched"])))
rows.sort(key=lambda r: (r.get("fans") or 0), reverse=True)

csv_path = os.path.join(base, "douyin-accounts.csv")
cols = ["nick", "fans", "likes", "id", "matched", "bio", "sec"]
with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=cols)
    w.writeheader()
    for r in rows:
        w.writerow({k: r.get(k) for k in cols})

def tier(f):
    f = f or 0
    if f >= 1_000_000: return "100w+"
    if f >= 100_000: return "10w-100w"
    if f >= 10_000: return "1w-10w"
    return "<1w"

c = Counter(tier(r.get("fans")) for r in rows)
print("total unique accounts:", len(rows))
for t in ["100w+", "10w-100w", "1w-10w", "<1w"]:
    print(f"  {t}: {c[t]}")

# vertical (herb-focused) subset: name or bio contains herb keywords,
# excluding generic doctor/clinic accounts
HERB = ["本草", "中药", "草药", "百草", "识药", "采药", "药草"]
def is_vertical(r):
    blob = (r.get("nick") or "") + (r.get("bio") or "")
    return any(k in blob for k in HERB)

vert = [r for r in rows if is_vertical(r)]
vc = Counter(tier(r.get("fans")) for r in vert)
print("\nvertical (herb-focused) accounts:", len(vert))
for t in ["100w+", "10w-100w", "1w-10w", "<1w"]:
    print(f"  {t}: {vc[t]}")

print("\nVertical top 25:")
for r in vert[:25]:
    print(f"  {r.get('fans') or 0:>8} | {str(r.get('likes')):>9} | {r['nick'][:20]:<20} | {r['matched']}")
