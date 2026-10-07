import json, sys, collections
d = json.load(open(sys.argv[1]))
IGN = set(sys.argv[2].split(',')) if len(sys.argv) > 2 and sys.argv[2] else set()
# union page signatures per class key
P = collections.defaultdict(collections.Counter)
where = collections.defaultdict(set)
for pg, m in d['pages'].items():
    for k, sigs in m.items():
        for s, n in sigs.items():
            P[k][s] += n
        where[k].add(pg.split('?')[0].split('#')[0])

def diff(a, b):
    a = json.loads(a); b = json.loads(b)
    return {k: (a.get(k), b.get(k)) for k in set(a) | set(b) if a.get(k) != b.get(k) and k not in IGN}

report = collections.OrderedDict()
for g, anchors in d['ds'].items():
    for aid, m in anchors.items():
        rows = []
        for k, sigs in m.items():
            if k not in P: continue
            for s in sigs:
                if s in P[k]: continue
                # nearest page sig
                best = min(P[k], key=lambda ps: len(diff(s, ps)))
                dd = diff(s, best)
                if not dd: continue
                rows.append((k, dd, sorted(where[k])[:3]))
        if rows:
            report[g + '/' + aid] = rows
total = 0
for a, rows in report.items():
    # collapse by class
    seen = {}
    for k, dd, w in rows:
        key = k
        if key in seen and len(seen[key][0]) <= len(dd): continue
        seen[key] = (dd, w)
    print('\n##', a, len(seen))
    for k, (dd, w) in sorted(seen.items()):
        total += 1
        s = '; '.join(f'{p}: DS={v[0]} → PG={v[1]}' for p, v in sorted(dd.items()))
        print(f'  .{k}  [{",".join(w)}]  {s[:400]}')
print('\nTOTAL', total, file=sys.stderr)
