const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const code=read('docs/scripts/Netflix.ZhAr.DeepL.ipad-deepl-compat-1.js');
const moduleText=read('docs/modules/Netflix.ZhAr.DeepL.Compat.srmodule');
assert(!moduleText.includes('#!arguments'));assert(!moduleText.includes('{{{'));
assert(moduleText.includes('argument=DeepLPlan=Free&DeepLKey=REPLACE_WITH_YOUR_KEY'));
assert(moduleText.includes('requires-body=0'));assert(!code.includes('$persistentStore'));
assert(!code.includes('translate.googleapis.com'));assert(!code.includes('DSPublicConfig21'));
const key='TEST_ONLY_DEEPL_KEY',arg=moduleText.match(/, argument=(.+)$/m)[1].replace('REPLACE_WITH_YOUR_KEY',key);
function playback(argument,{plan='Free',error,status=200,expectedKey=key}={}){
 const logs=[],wire=[];let cdn=0,api=0;
 const c={console:{log:s=>logs.push(s)},setTimeout:()=>1,clearTimeout(){}};
 for(const file of ['vtt_core.js','indexed_core.js'])vm.runInNewContext(read('src/'+file),c);
 const source=c.DSS19.fixture(),idx=c.DSS19.index(source,Buffer.byteLength(source)),row=idx.rows[0];
 const url='https://test.oca.nflxvideo.net/?o=1&v=1&e=1&t=PRIVATE_TEST_SIGNATURE';
 if(argument!==undefined)c.$argument=argument;
 c.$request={url,method:'GET',headers:{Range:`bytes=${row.offset}-${row.offset+row.bytes-1}`}};
 c.$done=r=>wire.push(r);
 c.$persistentStore={read(){throw Error('No storage')},write(){throw Error('No storage')}};
 c.$httpClient={get:(req,cb)=>{
  assert.equal(req.url,url,'Only source CDN GETs permitted');cdn++;
  const [a,z]=req.headers.Range.match(/\d+/g).map(Number),end=Math.min(z,Buffer.byteLength(source)-1);
  cb(null,{status:206,headers:{'Content-Range':`bytes ${a}-${end}/${Buffer.byteLength(source)}`,
   'Content-Length':String(end-a+1)}},c.DSS19.slice(source,a,end+1));
 },post:(req,cb)=>{
  api++;assert.equal(req.url,plan==='Free'?'https://api-free.deepl.com/v2/translate':'https://api.deepl.com/v2/translate');
  assert.equal(req.headers.Authorization,'DeepL-Auth-Key '+expectedKey);assert(!req.url.includes(expectedKey));
  const data=JSON.parse(req.body);assert(!req.body.includes(key));assert(!('source_lang' in data));
  const text=data.target_lang==='ZH-HANS'?'中文测试':'مرحبا بك.';
  cb(null,{status,headers:{}},JSON.stringify({translations:data.text.map(()=>({text,detected_source_language:'EN'}))}));
 }};
 vm.runInNewContext(code,c);assert.equal(wire.length,1);
 if(error){assert(!wire[0].response);assert.equal(cdn,0);assert.equal(api,0);assert(logs.includes('Netflix-ZhAr '+error));}
 else{
  assert.equal(cdn,3);assert.equal(wire[0].response.status,206);
  assert.equal(Buffer.byteLength(wire[0].response.body),row.bytes);
  assert.equal(wire[0].response.headers['Content-Range'],`bytes ${row.offset}-${row.offset+row.bytes-1}/${Buffer.byteLength(source)}`);
  if(status===200){assert.equal(api,2);assert.equal(wire[0].response.headers['X-DualSubs-Outcome'],'BILINGUAL');assert(wire[0].response.body.includes('中文测试\nمرحبا بك.'));}
  else{assert.equal(api,1);assert.equal(wire[0].response.headers['X-DualSubs-Outcome'],status===403?'DEEPL_AUTH_FAILED':'DEEPL_QUOTA_EXCEEDED');assert.equal(wire[0].response.body,c.DSS19.slice(source,row.offset,row.offset+row.bytes));}
 }
 assert(!logs.join('').includes(key));assert(!logs.join('').includes('PRIVATE_TEST_SIGNATURE'));
 assert(!JSON.stringify(wire).includes(key));
}
playback(arg);
playback(arg.replace('Free','Pro'),{plan:'Pro'});
playback('DeepLKey='+key);
playback('DeepLPlan=Free&DeepLKey='+encodeURIComponent(key+':fx'),{expectedKey:key+':fx'});
playback(JSON.stringify({DeepLKey:key,DeepLPlan:'Free'}));
playback({DeepLKey:key,DeepLPlan:'Pro'},{plan:'Pro'});
playback(arg,{status:403});playback(arg,{status:456});
for(const argument of [undefined,'','DeepLPlan=Free','DeepLKey=REPLACE_WITH_YOUR_KEY'])
 playback(argument,{error:'DEEPL_COMPAT_KEY_MISSING'});
for(const argument of ['DeepLKey={{{DeepLKey}}}',{DeepLKey:key,DeepLPlan:'{{{DeepLPlan}}}'}])
 playback(argument,{error:'DEEPL_COMPAT_TEMPLATE_UNRESOLVED'});
playback('DeepLKey='+key+'&DeepLPlan=Unknown',{error:'DEEPL_COMPAT_PLAN_INVALID'});
for(const argument of [1,[],null,'[]','DeepLKey='+key+'&DeepLKey='+key,
 'DeepLKey=TEST%0AONLY_KEY','DeepLKey='+key+'&Provider=Google','DeepLKey=%zz',
 JSON.stringify({DeepLKey:key,__proto_field__:'bad'}),{DeepLKey:{secret:key}},'x'.repeat(4097)])
 playback(argument,{error:argument===null?'DEEPL_COMPAT_KEY_MISSING':'DEEPL_COMPAT_ARGUMENT_INVALID'});
const html=read('docs/compat/index.html'),link=html.match(/id="install-deepl-compat" href="([^"]+)"/)[1];
assert.equal(decodeURIComponent(link.split('module=')[1]),'https://ameder0201.github.io/Netflix-ZhAr-Subtitles/modules/Netflix.ZhAr.DeepL.Compat.srmodule');
assert(html.includes('ipad-deepl-compat-1'));assert(!html.includes('<script'));
console.log('PASS DeepL compat: literal/JSON/object arguments, Free/Pro, encoded key; exact bilingual206; invalid/missing/template codes; auth/quota original fallback; no Google/storage/key logging; install link.');
