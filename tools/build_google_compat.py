"""Explicit Google compatibility entry: no native argument dependency or key."""
import argparse
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parent.parent
REVISION='ipad-compat-1'


def generate():
    files=['vendor/t2cn.js','src/vtt_core.js','src/indexed_core.js','src/config_resolver.js',
           'src/providers/common.js','src/providers/google.js','src/providers/deepl.js',
           'src/translation_pipeline.js','src/render_bilingual.js']
    intro='// Google-only '+REVISION+'; fixed AUTO / direct / zh-first. No native arguments or secrets.\n(function(){\n'
    setup='''
var DEVICE_CONFIG={provider:'Google',sourceLanguage:'AUTO',pipeline:'direct',position:'zh-first'},DEVICE_SECRET='';
// Record only argument shape, never values, URLs, subtitles or credentials.
try{
 var nativeArg=typeof $argument==='undefined'?undefined:$argument;
 console.log('Netflix-ZhAr IPAD_COMPAT_1 READY nativeArgumentType='+typeof nativeArg+
  ' unresolvedTemplate='+(typeof nativeArg==='string'&&nativeArg.indexOf('{{{')>=0?'yes':'no'));
}catch(ignore){}
'''
    payload=intro+'\n'.join((ROOT/p).read_text() for p in files)+setup+(ROOT/'src/gateway_runtime.js').read_text()+'\n})();\n'
    check=subprocess.run(['node','--check'],input=payload,text=True,capture_output=True)
    if check.returncode:raise ValueError('Compatibility script syntax check failed')
    script='https://ameder0201.github.io/Netflix-ZhAr-Subtitles/scripts/Netflix.ZhAr.Google.ipad-compat-1.js'
    module=f'''#!name = Netflix 中阿双语 · Google 旧版兼容
#!desc = 旧版Shadowrocket固定Google/AUTO/direct/中文在上；无需模块参数或密钥；只启用这一份Netflix翻译模块。
#!version = {REVISION} (v21-config-2)
[Script]
Netflix.ZhAr.Google.Compat = type=http-request, pattern=^https?:\\/\\/[^/]+\\.oca\\.nflxvideo\\.net\\/\\?o=\\d+&v=\\d+&e=\\d+&t=.+, requires-body=0, timeout=35, script-path={script}
[MITM]
hostname = %APPEND% *.oca.nflxvideo.net
tcp-connection = true
'''
    return {'docs/scripts/Netflix.ZhAr.Google.ipad-compat-1.js':payload.encode(),
            'docs/modules/Netflix.ZhAr.Google.Compat.srmodule':module.encode()}


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    for name,data in generate().items():
        p=ROOT/name
        if args.check:
            if not p.is_file() or p.read_bytes()!=data:raise SystemExit('Outdated compatibility artifact: '+name)
        else:
            p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
    print('Fixed Google compatibility assets verified.' if args.check else 'Fixed Google compatibility assets built; no private configuration read.')
