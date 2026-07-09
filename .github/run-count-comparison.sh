#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

node .github/count-entities.js

if [ ! -f model.json ]; then
  echo "model.json not found" >&2
  exit 1
fi

if [ ! -f moose-counts.json ]; then
  echo "moose-counts.json not found" >&2
  exit 1
fi

TSMORPH_COUNTS=".github/tsmorph-counts.json"
if [ ! -f "$TSMORPH_COUNTS" ]; then
  echo "$TSMORPH_COUNTS not found" >&2
  exit 1
fi

python3 - <<'PY'
import json, os, sys
from pathlib import Path

root = Path('.').resolve()
with open(root / '.github' / 'tsmorph-counts.json', 'r', encoding='utf-8') as f:
    tsmorph = json.load(f)
with open(root / 'moose-counts.json', 'r', encoding='utf-8') as f:
    famix = json.load(f)

keys = sorted(set(tsmorph) | set(famix))
missing_in_famix = [k for k in keys if k not in famix]
missing_in_tsmorph = [k for k in keys if k not in tsmorph]

print('Comparing ts-morph counts with Famix counts...')
print('ts-morph keys:', sorted(tsmorph))
print('famix keys:', sorted(famix))

if missing_in_famix:
    print('Missing in Famix counts:', missing_in_famix)
if missing_in_tsmorph:
    print('Missing in ts-morph counts:', missing_in_tsmorph)

for key in keys:
    if key not in tsmorph or key not in famix:
        continue
    if tsmorph[key] != famix[key]:
        print(f'{key}: ts-morph={tsmorph[key]} famix={famix[key]}')

if missing_in_famix or missing_in_tsmorph:
    sys.exit(1)

# Require that every ts-morph key exists in Famix and that the counts match exactly.
if any(tsmorph[key] != famix[key] for key in keys):
    print('Count mismatch detected.')
    sys.exit(1)

print('All counts match.')
PY
