const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const c={};
for(const name of ['config_resolver.js','public_config.js'])vm.runInNewContext(fs.readFileSync(path.join(root,'src',name),'utf8'),c);
const resolve=c.DSPublicConfig21.resolve;
let config=resolve('Provider=Google&SourceLanguage=AUTO&Position=zh-first&Pipeline=direct');
assert.equal(config.config.provider,'Google');assert.equal(config.apiKey,'');
config=resolve('Provider=DeepL&SourceLanguage=ZH-HANS&DeepLPlan=Pro&DeepLKey=TEST_ONLY_KEY');
assert.equal(config.config.deepl.plan,'Pro');assert.equal(config.config.sourceLanguage,'ZH-HANS');assert.equal(config.apiKey,'TEST_ONLY_KEY');
config=resolve(JSON.stringify({Provider:'DeepL',DeepLKey:'TEST_ONLY_KEY',Position:'ar-first',Pipeline:'pivot-zh'}));assert.equal(config.config.position,'ar-first');assert.equal(config.config.pipeline,'pivot-zh');
config=resolve('Provider=Google&DeepLKey=TEST_ONLY_KEY');assert.equal(config.apiKey,'');
for(const argument of ['',undefined,'Provider=DeepL','Provider=DeepL&DeepLKey=REPLACE_WITH_YOUR_KEY','Provider=Unknown','Provider=Google&Provider=DeepL','Provider=Google&SourceLanguage=INVALID','Provider=Google&Position=INVALID','Provider=Google&Pipeline=INVALID','Provider=DeepL&DeepLPlan=INVALID&DeepLKey=TEST_ONLY_KEY','Provider=DeepL&DeepLKey=TEST%0AONLY_KEY','Provider=DeepL&DeepLKey=TEST%26ONLY_KEY','Provider=Google&__proto__=pollution','Provider=Google&SourceLanguage=%zz','Provider=Google&x=y','[]','{"Provider":"Google","DeepLKey":{}}','{"Provider":"Google","__proto__":"bad"}'])assert.throws(()=>resolve(argument));
// Exercise the actual public bundle using module-rendered native arguments.
const bundle=fs.readFileSync(path.join(root,'dist/Netflix.ZhAr.bundle.js'),'utf8');
function renderArguments(provider){
 const text=fs.readFileSync(path.join(root,'modules',`Netflix.ZhAr.${provider}.srmodule`),'utf8');
 const defaults=Object.fromEntries(text.match(/^#!arguments = (.+)$/m)[1].split(',').map(p=>{const i=p.indexOf(':');return[p.slice(0,i),p.slice(i+1)];}));
 if(provider==='DeepL')defaults.DeepLKey='TEST_ONLY_KEY';
 return text.match(/, argument=(.+)$/m)[1].replace(/\{\{\{(\w+)\}\}\}/g,(_,k)=>defaults[k]);
}
function playback(provider,bad=false){
 const x={console:{log(){}},setTimeout:()=>1,clearTimeout(){}};let api=0,cdn=0,wire=[];
 for(const f of ['vtt_core.js','indexed_core.js'])vm.runInNewContext(fs.readFileSync(path.join(root,'src',f),'utf8'),x);
 const source=x.DSS19.fixture(),idx=x.DSS19.index(source,Buffer.byteLength(source)),row=idx.rows[0];
 const url='https://test.oca.nflxvideo.net/?o=1&v=2&e=3&t=PRIVATE_TEST_SIGNATURE';
 x.$argument=bad?'Provider=DeepL&DeepLKey=REPLACE_WITH_YOUR_KEY':renderArguments(provider);
 x.$request={url,method:'GET',headers:{Range:`bytes=${row.offset}-${row.offset+row.bytes-1}`}};
 x.$persistentStore={read(){throw Error('No storage')},write(){throw Error('No storage')}};x.$done=r=>wire.push(r);
 x.$httpClient={get:(req,cb)=>{
  if(req.url===url){cdn++;const [a,z]=req.headers.Range.match(/\d+/g).map(Number),end=Math.min(z,Buffer.byteLength(source)-1);cb(null,{status:206,headers:{'Content-Range':`bytes ${a}-${end}/${Buffer.byteLength(source)}`,'Content-Length':String(end-a+1)}},x.DSS19.slice(source,a,end+1));}
  else{
   assert.equal(provider,'Google');const u=new URL(req.url);assert.equal(u.hostname,'translate.googleapis.com');assert(!req.url.includes('TEST_ONLY_KEY'));api++;
   const p=u.searchParams,text=p.get('tl')==='zh-CN'?'中文测试':'مرحبا بك.';cb(null,{status:200,headers:{}},JSON.stringify([[[p.get('q').split('\r').map(()=>text).join('\r'),null,null]]]));
  }
 },post:(req,cb)=>{
  assert.equal(provider,'DeepL');assert.equal(req.url,'https://api-free.deepl.com/v2/translate');assert.equal(req.headers.Authorization,'DeepL-Auth-Key TEST_ONLY_KEY');assert(!req.url.includes('TEST_ONLY_KEY'));api++;
  const data=JSON.parse(req.body),text=data.target_lang==='ZH-HANS'?'中文测试':'مرحبا بك.';
  cb(null,{status:200,headers:{}},JSON.stringify({translations:data.text.map(()=>({text,detected_source_language:'ZH'}))}));
 }};
 vm.runInNewContext(bundle,x);assert.equal(wire.length,1);
 if(bad){assert(!wire[0].response);assert.equal(api,0);assert.equal(cdn,0);}
 else{assert.equal(api,2);assert.equal(cdn,3);assert.equal(wire[0].response.headers['X-DualSubs-Outcome'],'BILINGUAL');assert.equal(Buffer.byteLength(wire[0].response.body),row.bytes);assert(wire[0].response.body.includes('中文测试'));assert(wire[0].response.body.includes('مرحبا بك.'));}
}
playback('Google');playback('DeepL');playback('DeepL',true);
// The static page produces the same import scheme used by DualSubs.
const elements={};for(const id of ['install-google','install-deepl'])elements[id]={};
vm.runInNewContext(fs.readFileSync(path.join(root,'docs/app.js'),'utf8'),{document:{getElementById:id=>elements[id],querySelectorAll:()=>[]}});
for(const provider of ['Google','DeepL']){
 const link=elements['install-'+provider.toLowerCase()].href;
 assert(link.startsWith('shadowrocket://install?module='));
 const url=`https://ameder0201.github.io/Netflix-ZhAr-Subtitles/modules/Netflix.ZhAr.${provider}.srmodule`;
 assert.equal(decodeURIComponent(link.split('module=')[1]),url);
 const html=fs.readFileSync(path.join(root,'docs/index.html'),'utf8');
 assert(html.includes(`href="${link}"`),'No-JavaScript import fallback must match');
 assert(html.includes(`value="${url}"`),'Copy/manual URL must match import URL');
 assert.deepStrictEqual(fs.readFileSync(path.join(root,'docs/modules',`Netflix.ZhAr.${provider}.srmodule`)),fs.readFileSync(path.join(root,'modules',`Netflix.ZhAr.${provider}.srmodule`)));
}
console.log('PASS public adapter: validated native module args; missing/invalid key fails closed; public Google and DeepL bundles preserve exact206; no key in URL or device storage; JS/no-JS installation schemes match direct Pages files and copy URLs.');
