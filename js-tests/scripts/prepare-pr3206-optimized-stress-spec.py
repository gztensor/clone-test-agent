"""Copy the original stress snapshot, freezing epochs until the new WASM is installed."""
import json
import sys

def prefix(pallet, item):
    # supplied by the saved JS benchmark from runtime metadata
    return keys[pallet + '.' + item]

source, destination, metadata = sys.argv[1:]
with open(metadata) as stream:
    keys = json.load(stream)
with open(source) as stream:
    spec = json.load(stream)
top = spec['genesis']['raw']['top']
for n in range(129):
    encoded = n.to_bytes(2, 'little').hex()
    for field, value, width in [('Tempo', 65535, 2), ('PendingEpochAt', 0, 8), ('BlocksSinceLastStep', 0, 8)]:
        top[prefix('SubtensorModule', field) + encoded] = '0x' + value.to_bytes(width, 'little').hex()
spec['name'] = 'PR3206 optimized Null epoch comparison'
with open(destination, 'w') as stream:
    json.dump(spec, stream, separators=(',', ':'))
print('Copied the original stress snapshot; froze epochs until runtime upgrade.')
