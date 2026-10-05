"""Patch exported clone chronology without JavaScript's 512 MiB string limit."""
import json
import sys

source, destination, normalization = sys.argv[1:]
with open(source) as stream:
    spec = json.load(stream)
with open(normalization) as stream:
    resets = json.load(stream)
top = spec['genesis']['raw']['top']
remove = [key for key in top if any(key.startswith(prefix) for prefix in resets['removePrefixes'])]
for key in remove:
    del top[key]
for key, value in resets['pairs']:
    top[key] = value
spec['name'] = 'PR3206 emission stress clone'
spec['chainType'] = 'Local'
with open(destination, 'w') as stream:
    json.dump(spec, stream, separators=(',', ':'))
print(f"PASS exported chronology reset {len(resets['pairs'])}; old hashes removed {len(remove)}; output {destination}")
