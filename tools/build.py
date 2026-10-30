"""Deterministic public build. Does not read Keychain or any private directory."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parent.parent
REPOSITORY='Ameder0201/Netflix-ZhAr-Subtitles'
VERSION='1.0.0'
CORE_VERSION='v21-config-2'
ASSET='Netflix.ZhAr.bundle.js'


def generate():
    files=['vendor/t2cn.js','src/vtt_core.js','src/indexed_core.js','src/config_resolver.js',
           'src/providers/common.js','src/providers/google.js','src/providers/deepl.js',
           'src/translation_pipeline.js','src/render_bilingual.js','src/public_config.js']
    intro=f'// Netflix-ZhAr-Subtitles {VERSION}; core {CORE_VERSION}\n// Project: MIT; bundled OpenCC: MIT AND Apache-2.0. See NOTICE and vendor licenses.\n(function(){{\n'
    setup='''
var DEVICE_CONFIG,DEVICE_SECRET;
try{
 var selected=DSPublicConfig21.resolve(typeof $argument==='undefined'?'':$argument);
 DEVICE_CONFIG=selected.config;DEVICE_SECRET=selected.apiKey;
}catch(ignore){
 try{console.log('Netflix-ZhAr PUBLIC_ARGUMENT_INVALID');}catch(logError){}
 $done({});return;
}
'''
    payload=intro+'\n'.join((ROOT/p).read_text() for p in files)+setup+(ROOT/'src/gateway_runtime.js').read_text()+'\n})();\n'
    syntax=subprocess.run(['node','--check'],input=payload,text=True,capture_output=True)
    if syntax.returncode:raise ValueError('Public bundle syntax check failed')
    if any(x in payload for x in ['$persistentStore','boxjs.com','18769/event','172.16.13.','DEVICE_SECRET="']):
        raise ValueError('Forbidden private/runtime dependency in public bundle')
    runtime=f'https://raw.githubusercontent.com/{REPOSITORY}/v{VERSION}/dist/{ASSET}'
    artifacts={f'dist/{ASSET}':payload.encode()}
    for provider in ('Google','DeepL'):
        arguments='SourceLanguage:AUTO,Position:zh-first,Pipeline:direct'
        wire='Provider='+provider+'&SourceLanguage={{{SourceLanguage}}}&Position={{{Position}}}&Pipeline={{{Pipeline}}}'
        desc='SourceLanguage：AUTO／ZH-HANS／ZH-HANT／EN 等；Position：zh-first／ar-first；Pipeline：direct／pivot-zh。'
        if provider=='DeepL':
            arguments+=',DeepLPlan:Free,DeepLKey:REPLACE_WITH_YOUR_KEY'
            wire+='&DeepLPlan={{{DeepLPlan}}}&DeepLKey={{{DeepLKey}}}'
            desc+='DeepLPlan：Free／Pro；DeepLKey：在设备编辑参数中填写自己的密钥，默认占位值不发请求。'
        module=f'''#!name = Netflix 中阿双语 · {provider}
#!desc = 完整简体中文＋阿拉伯语；原长分段与容量适配；{provider}；仅启用一份翻译模块。
#!version = {VERSION} ({CORE_VERSION})
#!arguments = {arguments}
#!arguments-desc = {desc}
[Script]
Netflix.ZhAr = type=http-request, pattern=^https?:\\/\\/[^/]+\\.oca\\.nflxvideo\\.net\\/\\?o=\\d+&v=\\d+&e=\\d+&t=.+, requires-body=0, timeout=35, script-path={runtime}, argument={wire}
[MITM]
hostname = %APPEND% *.oca.nflxvideo.net
tcp-connection = true
'''
        artifacts[f'modules/Netflix.ZhAr.{provider}.srmodule']=module.encode()
    hashes={p:hashlib.sha256(b).hexdigest() for p,b in artifacts.items()}
    artifacts['dist/manifest.json']=(json.dumps({'version':VERSION,'coreVersion':CORE_VERSION,'repository':REPOSITORY,'sha256':hashes},indent=2)+'\n').encode()
    # Pages serves these as plain files: no latest -> release -> asset redirects.
    # Keep release assets/manifest immutable; mirrors are byte-identical modules.
    for provider in ('Google','DeepL'):
        name=f'Netflix.ZhAr.{provider}.srmodule'
        artifacts[f'docs/modules/{name}']=artifacts[f'modules/{name}']
    return artifacts


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    for name,data in generate().items():
        p=ROOT/name
        if args.check:
            if not p.is_file() or p.read_bytes()!=data:raise SystemExit('Outdated public build: '+name)
        else:
            p.parent.mkdir(parents=True,exist_ok=True)
            p.write_bytes(data)
    print('Public artifacts verified.' if args.check else 'Public artifacts built; no private configuration read.')


if __name__=='__main__':main()
