const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'../src');
const libs=['../vendor/t2cn.js','vtt_core.js','indexed_core.js','config_resolver.js','providers/common.js','providers/google.js','providers/deepl.js','translation_pipeline.js','render_bilingual.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
const runtime=fs.readFileSync(path.join(root,'gateway_runtime.js'),'utf8');
function run(n,overflow=false){
 const timers=[],logs=[],wire=[];let cdn=0,provider=0;
 const c={console:{log:s=>logs.push(s)},setTimeout:(f,n)=>{const t={f,n};timers.push(t);return t;},clearTimeout:t=>{if(t)t.cancel=true;},Date:class extends Date{static now(){return 0;}}};
 vm.runInNewContext(libs,c);
 function stamp(s){return '00:'+String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')+'.001';}
 const chunks=[0,1].map(k=>Array.from({length:180},(_,i)=>`optional-identifier-${k}-${i}\r\n${stamp(k*180+i)} --> ${stamp(k*180+i+1)} line:90% position:50% size:80% align:center\r\n中文欢迎\r\n\r\n`).join(''));
 let header='',old=-1;
 for(let i=0;i<20&&old!==Buffer.byteLength(header);i++){
  old=Buffer.byteLength(header);
  header='\uFEFFWEBVTT\n\nNOTE SegmentIndex\n'+chunks.map((s,k)=>`NOTE Segment=180 ${Buffer.byteLength(s)}@${old+(k?Buffer.byteLength(chunks[0]):0)} 180`).join('\n')+'\nNOTE /SegmentIndex\n\n';
 }
 const resource=header+chunks.join(''),idx=c.DSS19.index(resource.slice(0,8192),Buffer.byteLength(resource)),row=idx.rows[n];
 const url='https://test.oca.nflxvideo.net/?o=1&v=131&e=3&t=PRIVATE_TEST_SIGNATURE';
 c.DEVICE_CONFIG={provider:'DeepL',sourceLanguage:'AUTO',pipeline:'direct'};c.DEVICE_SECRET='TEST_PRIVATE_KEY';
 c.$request={url,method:'GET',headers:{Range:`bytes=${row.offset}-${row.offset+row.bytes-1}`}};
 c.$done=r=>wire.push(r);c.$persistentStore={read(){throw Error('Storage forbidden')},write(){throw Error('Storage forbidden')}};
 c.$httpClient={get:(req,cb)=>{
  assert.equal(req.url,url);assert.equal(req.headers['X-DualSubs-Probe'],'v21-config-2');cdn++;
  const [a,z]=req.headers.Range.match(/\d+/g).map(Number),end=Math.min(z,Buffer.byteLength(resource)-1);
  cb(null,{status:206,headers:{'Content-Range':`bytes ${a}-${end}/${Buffer.byteLength(resource)}`,'Content-Length':String(end-a+1)}},c.DSS19.slice(resource,a,end+1));
 },post:(req,cb)=>{
  assert.equal(req.url,'https://api-free.deepl.com/v2/translate');provider++;
  const body=JSON.parse(req.body),text=body.target_lang==='ZH-HANS'?'中文欢迎':overflow?'أ'.repeat(150):'مرحبا بكم في هذا اليوم الجميل.';
  cb(null,{status:200,headers:{}},JSON.stringify({translations:body.text.map(()=>({text,detected_source_language:'ZH'}))}));
 }};
 vm.runInNewContext(runtime,c);
 timers.forEach(t=>{if(!t.cancel)t.f();});assert.equal(wire.length,1);
 const response=wire[0].response;assert.equal(response.status,206);assert.equal(response.headers['Content-Range'],`bytes ${row.offset}-${row.offset+row.bytes-1}/${Buffer.byteLength(resource)}`);
 assert.equal(Buffer.byteLength(response.body),row.bytes);assert.equal(Number(response.headers['Content-Length']),row.bytes);assert.equal(cdn,3);assert.equal(provider,8);
 assert(!JSON.stringify(logs).includes('TEST_PRIVATE_KEY'));assert(!JSON.stringify(logs).includes('PRIVATE_TEST_SIGNATURE'));
 if(overflow){
  assert.equal(response.headers['X-DualSubs-Outcome'],'BILINGUAL_SEGMENT_OVERFLOW');assert.equal(response.body,chunks[n]);
  assert(Number(response.headers['X-DualSubs-Render-Required-Bytes'])>row.bytes);assert.equal(Number(response.headers['X-DualSubs-Render-Source-Bytes']),row.bytes);
 }else{
  assert.equal(response.headers['X-DualSubs-Outcome'],'BILINGUAL');assert.equal(response.headers['X-DualSubs-Render-Mode'],'StandardLayout');
  const rendered=c.DSV11.parse('WEBVTT\n\n'+response.body),original=c.DSV11.parse('WEBVTT\n\n'+chunks[n]);assert.equal(rendered.cues.length,180);
  rendered.cues.forEach((cue,i)=>{assert(cue.original.includes('中文欢迎\nمرحبا بكم في هذا اليوم الجميل.'));assert.equal(cue.head,original.cues[i].head.split('\r\n').pop().replace(/^00:/,'').replace(/ --> 00:/,' --> ').replace(/ line:.*/,''));});
  // Reconstructed resource still has unchanged header/index/next segment offsets.
  const rebuilt=header+chunks.map((s,k)=>k===n?response.body:s).join('');assert.equal(Buffer.byteLength(rebuilt),Buffer.byteLength(resource));
  assert.equal(c.DSS19.slice(rebuilt,idx.rows[1-n].offset,idx.rows[1-n].offset+idx.rows[1-n].bytes),chunks[1-n]);
 }
}
run(0);run(1);run(0,true);
console.log('PASS gateway capacity: AUTO direct DeepL; two indexed 180-cue segments; compact bilingual exact206 and unchanged adjacent offsets; full text/times; no Mac/storage; unchanged original fallback with numeric capacity evidence.');
