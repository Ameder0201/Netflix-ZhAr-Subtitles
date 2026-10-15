const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'../src');
const files=['../vendor/t2cn.js','vtt_core.js','indexed_core.js','config_resolver.js','providers/common.js','providers/google.js','providers/deepl.js','translation_pipeline.js','render_bilingual.js'];
const libs=files.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
function environment(options={}){
 let callbacks=[],calls=[],logs=[],clock=0;const c={console:{log:s=>logs.push(s)},setTimeout:(f,delay)=>{callbacks.push({f,delay,cancel:false});return callbacks.at(-1)},clearTimeout:t=>{if(t)t.cancel=true},Date:class extends Date {static now(){return clock;}}};
 c.$httpClient={get:(req,cb)=>respond(req,cb,'GET'),post:(req,cb)=>respond(req,cb,'POST')};
 function respond(req,cb,method){calls.push({req,method});clock+=options.elapsed||10;
  if(options.networkError){cb('network',null,'');return;}
  let target,inputs,detected=options.detected||'EN';
  if(method==='POST'){const p=JSON.parse(req.body);target=p.target_lang==='ZH-HANS'?'zh':'ar';inputs=p.text;assert(inputs.length<=50);assert(Buffer.byteLength(req.body)<=24576);assert(req.headers.Authorization.startsWith('DeepL-Auth-Key '));}
  else {const p=new URL(req.url).searchParams;target=p.get('tl')==='zh-CN'?'zh':'ar';inputs=p.get('q').split('\r');assert(inputs.length<=50);}
  const out=inputs.map((x,i)=>options.namesOnly?'007':target==='zh'?'欢迎回来，今天一切正常。':'مرحبا بك، كل شيء على ما يرام.');
  let status=options.status||200;if(options.retryOnce&&calls.length===1)status=429;
  let data=method==='POST'?{translations:out.map(text=>({text,detected_source_language:detected}))}:[[[out.join(options.badDelimiter?'':'\r'),null,null]]];
  if(options.wrongCount&&method==='POST')data.translations.pop();
  cb(null,{status,headers:{'Retry-After':options.retryAfter||'0'}},JSON.stringify(data));
 }
 vm.runInNewContext(libs,c);return {c,calls,logs,flush(){let i=0;while(callbacks.length&&i++<50){const t=callbacks.shift();if(!t.cancel){clock+=t.delay;t.f();}}assert(i<50);},get clock(){return clock}};
}
let e=environment();assert.equal(e.c.DSConfig21.resolve().pipeline,'direct');assert.throws(()=>e.c.DSConfig21.resolve({retry:{maxRetries:2}}));assert.throws(()=>e.c.DSConfig21.resolve({provider:'DeepLX'}));
assert.equal(e.c.DSPipeline21.simplified('漢語與臺灣的電腦軟體'),'汉语与台湾的电脑软体');
function pipeline(source,config={},options={}){const e=environment(options),cfg=e.c.DSConfig21.resolve(config),cues=source.map(input=>({input}));let result,error,done=0;const ctx={deadline:28000,calls:0,apiKey:'TEST_ONLY_KEY',cancelled:()=>false};e.c.DSPipeline21.run(cues,cfg,ctx,(a,b)=>{error=a;result=b;done++;});e.flush();assert.equal(done,1);assert(!e.logs.join('').includes('TEST_ONLY_KEY'));return{...e,config:cfg,result,error,ctx};}
let p=pipeline(['Welcome back to this wonderful evening.'],{provider:'DeepL',sourceLanguage:'EN'});assert(!p.error);assert.equal(p.calls.length,2);assert.equal(JSON.parse(p.calls[0].req.body).source_lang,'EN');assert.deepEqual(JSON.parse(p.calls[0].req.body).text,JSON.parse(p.calls[1].req.body).text);
p=pipeline(['Welcome back to this wonderful evening.'],{provider:'DeepL',sourceLanguage:'EN',pipeline:'pivot-zh'});assert(!p.error);assert.equal(JSON.parse(p.calls[1].req.body).source_lang,'ZH');assert.deepEqual(JSON.parse(p.calls[1].req.body).text,Array.from(p.result.zhTexts));
p=pipeline(['你好，欢迎回来。'],{sourceLanguage:'ZH-HANS'});assert(!p.error);assert.equal(p.calls.length,1);assert.equal(p.result.zhTexts[0],'你好，欢迎回来。');
p=pipeline(['歡迎回來，臺灣的漢語課。'],{sourceLanguage:'ZH-HANT',provider:'DeepL'});assert(!p.error);assert.equal(p.result.zhTexts[0],'欢迎回来，台湾的汉语课。');assert.equal(JSON.parse(p.calls[0].req.body).text[0],p.result.zhTexts[0]);
p=pipeline(['مرحبا بك في هذا اليوم الجميل.'],{sourceLanguage:'AR',provider:'DeepL'});assert(!p.error);assert.equal(p.calls.length,1);assert.equal(p.result.arTexts[0],'مرحبا بك في هذا اليوم الجميل.');
p=pipeline(['日本語の字幕を中国語とアラビア語に翻訳します。'],{sourceLanguage:'AUTO',provider:'DeepL'});assert(!p.error);assert(!('source_lang' in JSON.parse(p.calls[0].req.body)));assert.deepEqual(JSON.parse(p.calls[0].req.body).text,JSON.parse(p.calls[1].req.body).text);
p=pipeline(Array(128).fill('欢迎回来。'),{sourceLanguage:'ZH-HANS',provider:'DeepL'});assert(!p.error);assert.deepEqual(p.calls.map(x=>JSON.parse(x.req.body).text.length),[50,50,28]);
for(const status of [400,403,456]){p=pipeline(['你好。'],{sourceLanguage:'ZH-HANS',provider:'DeepL'},{status});assert(p.error);assert.equal(p.calls.length,1);}
p=pipeline(['你好。'],{sourceLanguage:'ZH-HANS',provider:'DeepL'},{retryOnce:true});assert(!p.error);assert.equal(p.calls.length,2);
p=pipeline(['你好。'],{sourceLanguage:'ZH-HANS',provider:'DeepL'},{status:429,retryAfter:'60'});assert(p.error);assert.equal(p.calls.length,1);
p=pipeline(['你好。'],{sourceLanguage:'ZH-HANS',provider:'DeepL'},{networkError:true});assert(p.error);assert.equal(p.calls.length,1);
p=pipeline(['你好。'],{sourceLanguage:'ZH-HANS',provider:'DeepL'},{wrongCount:true});assert(p.error);assert.equal(p.calls.length,1);
p=pipeline(['An input with sufficient length to classify.'],{provider:'DeepL',deepl:{plan:'Pro'}},{elapsed:26000});assert(p.error);assert.equal(p.calls.length,1);
e=environment();let source='1\r\n00:00:01.000 --> 00:00:02.000 align:start\r\n'+('<c.a>'.repeat(70))+'English original sentence.'+'</c>'.repeat(70)+'\r\n\r\n';let body=e.c.DSRender21.compile(source,['欢迎回来。'],['مرحبا بك.'],'zh-first',1);assert.equal(Buffer.byteLength(body),Buffer.byteLength(source));assert(!body.includes('English original'));assert(body.includes('align:start'));assert(body.includes('欢迎'));assert.throws(()=>e.c.DSRender21.compile('1\n00:00:01.000 --> 00:00:02.000\na\n\n',['中文'.repeat(20)],['العربية'.repeat(20)],'zh-first',1),/OVERFLOW/);
body=e.c.DSRender21.compile(source,['<中文>&\n测试'],['مرحبا\n\nبك'],'ar-first',1);assert(body.includes('&lt;中文&gt;&amp; 测试'));assert.equal(e.c.DSV11.parse('WEBVTT\n\n'+body).cues.length,1);
// Full gateway fallback with no Native persistence access and no Mac requests.
function gateway(status=200,overflow=false){let e=environment({status}),u='https://test.oca.nflxvideo.net/?o=1&v=2&e=3&t=PRIVATE',v=e.c.DSS19.fixture();if(overflow)v=v.replace(/<c.public>/g,'').replace(/<\/c>/g,'');const m=e.c.DSS19.index(e.c.DSS19.fixture(),Buffer.byteLength(e.c.DSS19.fixture()));const row=m.rows[0];
 // Production fixture contains ample padding; source failures separately tested.
 let wire=[],cdnCalls=0,orig=e.c.$httpClient.get;e.c.DEVICE_CONFIG={sourceLanguage:'ZH-HANS',provider:'DeepL'};e.c.DEVICE_SECRET='TEST_ONLY_KEY';e.c.$persistentStore={read(){throw Error('No storage')},write(){throw Error('No storage')}};e.c.$request={url:u,method:'GET',headers:{Range:`bytes=${row.offset}-${row.offset+row.bytes-1}`}};e.c.$done=r=>wire.push(r);
 e.c.$httpClient.get=(req,cb)=>{if(req.url===u){cdnCalls++;let [a,b]=req.headers.Range.match(/\d+/g).map(Number);b=Math.min(b,Buffer.byteLength(v)-1);cb(null,{status:206,headers:{'Content-Range':`bytes ${a}-${b}/${Buffer.byteLength(v)}`,'Content-Length':String(b-a+1)}},e.c.DSS19.slice(v,a,b+1));}else orig(req,cb);};
 vm.runInNewContext(fs.readFileSync(path.join(root,'gateway_runtime.js'),'utf8'),e.c);e.flush();assert.equal(wire.length,1);assert(!JSON.stringify(wire).includes('TEST_ONLY_KEY'));return{wire:wire[0],e,row,source:v,cdnCalls};}
let g=gateway();assert.equal(g.wire.response.status,206);assert.equal(g.wire.response.headers['X-DualSubs-Outcome'],'BILINGUAL');assert.equal(Buffer.byteLength(g.wire.response.body),g.row.bytes);
g=gateway(403);assert.equal(g.wire.response.status,206);assert.equal(g.wire.response.headers['X-DualSubs-Outcome'],'DEEPL_AUTH_FAILED');assert.equal(g.wire.response.body,e.c.DSS19.slice(g.source,g.row.offset,g.row.offset+g.row.bytes));
// Provider boundary recovery and exact one-byte rendering limit.
p=pipeline(['你好。','欢迎。','谢谢。'],{sourceLanguage:'ZH-HANS'},{badDelimiter:true});assert(!p.error);assert(p.calls.length>1);assert(p.calls.length<=7);
p=pipeline(['你好。','欢迎。'],{sourceLanguage:'ZH-HANS',provider:'DeepL'},{status:413});assert(p.error);assert.equal(p.calls.length,2);
e=environment();const config=e.c.DSConfig21.resolve({provider:'DeepL'});let limitError;e.c.DSProviders21.deepl(['test'],'EN','ar',config,{apiKey:'TEST_ONLY_KEY',deadline:28000,calls:16,cancelled:()=>false},err=>limitError=err);assert(limitError);assert.equal(e.calls.length,0);
const exact='1\n00:00:01.000 --> 00:00:02.000\n中文\nالعربية\n\n';
assert.equal(Buffer.byteLength(e.c.DSRender21.compile(exact,['中文'],['العربية'],'zh-first',1)),Buffer.byteLength(exact));
const squeezed=e.c.DSRender21.compileDetailed(exact,['中文'],['العربية!'],'zh-first',1);
assert.equal(squeezed.mode,'CompactMetadata');assert.equal(Buffer.byteLength(squeezed.body),Buffer.byteLength(exact));assert(squeezed.body.includes('العربية!'));
assert.throws(()=>e.c.DSRender21.compile(exact,['中文'],['العربية'.repeat(100)],'zh-first',1),/OVERFLOW/);
// A media body sharing the CDN regex must never reach translation.
e=environment();let mediaCalls=0,mediaDone=0;e.c.DEVICE_CONFIG={};e.c.DEVICE_SECRET='';e.c.$request={url:'https://public.oca.nflxvideo.net/?o=1&v=2&e=3&t=PUBLIC',method:'GET',headers:{Range:'bytes=0-127'}};e.c.$done=r=>{assert(!r.response);mediaDone++;};e.c.$httpClient.get=(req,cb)=>{mediaCalls++;cb(null,{status:206,headers:{'Content-Range':'bytes 0-127/400000'}},'PUBLIC MEDIA BODY');};vm.runInNewContext(fs.readFileSync(path.join(root,'gateway_runtime.js'),'utf8'),e.c);e.flush();assert.equal(mediaCalls,1);assert.equal(mediaDone,1);
console.log('PASS runtime: config defaults/no BoxJS; direct and pivot inputs; Chinese/Traditional/Arabic/Japanese/AUTO; 128 cues -> 50+50+28; endpoint and quota/auth/retry/deadline; plain arrays and target checks; exact206 and original fallback; no Native persistence or Mac runtime dependency.');
