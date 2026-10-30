"""Public DeepL compatibility build: fixed settings, literal per-device credential argument."""
import argparse
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parent.parent
REVISION='ipad-deepl-compat-1'
BASE='https://ameder0201.github.io/Netflix-ZhAr-Subtitles'


def generate():
    files=['vendor/t2cn.js','src/vtt_core.js','src/indexed_core.js','src/config_resolver.js',
           'src/providers/common.js','src/providers/deepl.js','src/translation_pipeline.js',
           'src/render_bilingual.js','src/deepl_compat_config.js']
    setup='''
var DEVICE_CONFIG,DEVICE_SECRET;
try{
 var selected=DSDeepLCompat21.resolve(typeof $argument==='undefined'?undefined:$argument);
 DEVICE_CONFIG=selected.config;DEVICE_SECRET=selected.apiKey;
 console.log('Netflix-ZhAr DEEPL_COMPAT_1 READY nativeArgumentType='+typeof $argument);
}catch(e){
 // Only allowlisted codes; never print arguments, error text, keys or subtitle URLs.
 var codes=['DEEPL_COMPAT_KEY_MISSING','DEEPL_COMPAT_ARGUMENT_INVALID','DEEPL_COMPAT_TEMPLATE_UNRESOLVED','DEEPL_COMPAT_PLAN_INVALID'];
 try{console.log('Netflix-ZhAr '+(codes.indexOf(e.message)>=0?e.message:'DEEPL_COMPAT_ARGUMENT_INVALID'));}catch(ignore){}
 $done({});return;
}
'''
    payload='// DeepL-only '+REVISION+'; no module templates, BoxJS or stored credentials.\n// Project: MIT; OpenCC: MIT AND Apache-2.0. See NOTICE.\n(function(){\n'
    payload+='\n'.join((ROOT/p).read_text() for p in files)+setup+(ROOT/'src/gateway_runtime.js').read_text()+'\n})();\n'
    result=subprocess.run(['node','--check'],input=payload,text=True,capture_output=True)
    if result.returncode:raise ValueError('DeepL compatibility syntax check failed')
    module=f'''#!name = Netflix 中阿双语 · DeepL 旧版兼容
#!desc = 固定AUTO/direct/中文在上；直接编辑Script行末DeepLKey占位值及DeepLPlan；无需模块参数模板；更新后检查密钥是否保留。
#!version = {REVISION} (v21-config-2)
[Script]
Netflix.ZhAr.DeepL.Compat = type=http-request, pattern=^https?:\\/\\/[^/]+\\.oca\\.nflxvideo\\.net\\/\\?o=\\d+&v=\\d+&e=\\d+&t=.+, requires-body=0, timeout=35, script-path={BASE}/scripts/Netflix.ZhAr.DeepL.{REVISION}.js, argument=DeepLPlan=Free&DeepLKey=REPLACE_WITH_YOUR_KEY
[MITM]
hostname = %APPEND% *.oca.nflxvideo.net
tcp-connection = true
'''
    return {f'docs/scripts/Netflix.ZhAr.DeepL.{REVISION}.js':payload.encode(),
            'docs/modules/Netflix.ZhAr.DeepL.Compat.srmodule':module.encode()}


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    for name,data in generate().items():
        p=ROOT/name
        if args.check:
            if not p.is_file() or p.read_bytes()!=data:raise SystemExit('Outdated DeepL compatibility artifact: '+name)
        else:
            p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
    print('DeepL compatibility artifacts verified.' if args.check else 'DeepL compatibility artifacts built; no private configuration read.')
