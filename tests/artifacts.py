"""Public-only build, links, license and sensitive-pattern checks."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/'tools'))
from build import generate,VERSION,REPOSITORY
from build_deepl_compat import generate as generate_deepl_compat

for name,data in generate().items():
    assert (ROOT/name).read_bytes()==data,name
for name,data in generate_deepl_compat().items():
    assert (ROOT/name).read_bytes()==data,name
manifest=json.loads((ROOT/'dist/manifest.json').read_text())
for name,expected in manifest['sha256'].items():assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==expected
assert hashlib.sha256((ROOT/'vendor/t2cn.js').read_bytes()).hexdigest()==json.loads((ROOT/'vendor/PROVENANCE.json').read_text())['sha256']
for name in ['LICENSE','NOTICE','vendor/LICENSE','vendor/Apache-2.0.txt','vendor/THIRD_PARTY_LICENSES.md']:assert (ROOT/name).is_file()
for p in (ROOT/'docs/assets').glob('*.svg'):ET.parse(p)
for provider in ['Google','DeepL']:
    text=(ROOT/f'modules/Netflix.ZhAr.{provider}.srmodule').read_text()
    assert 'requires-body=0' in text and 'type=http-request' in text and 'timeout=35' in text
    assert f'https://raw.githubusercontent.com/{REPOSITORY}/v{VERSION}/dist/Netflix.ZhAr.bundle.js' in text
    assert 'DeepLKey:REPLACE_WITH_YOUR_KEY' in text if provider=='DeepL' else 'DeepLKey' not in text
files=[p for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.parts and '__pycache__' not in p.parts]
for p in files:
    data=p.read_bytes()
    for pattern in [rb'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}:fx',rb'gh[pousr]_[A-Za-z0-9]{25,}',rb'github_pat_[A-Za-z0-9_]{20,}',rb'-----BEGIN (?:RSA |EC )?PRIVATE KEY-----',rb'/device/[A-Za-z0-9_-]{40,64}/',rb'172\.16\.13\.(?:30|225)',b'/'+b'Users/'+rb'[A-Za-z0-9_. -]+/']:
        if re.search(pattern,data):raise AssertionError('Sensitive data pattern in '+str(p.relative_to(ROOT)))
    assert p.suffix not in ['.db','.sqlite','.pem','.key','.secret']
print('PASS artifacts: deterministic build; versioned script URLs; both install modules; OpenCC hash/licenses; SVGs; no credential/private URL/database patterns.')
