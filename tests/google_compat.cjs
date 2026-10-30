const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),code=fs.readFileSync(path.join(root,'docs/scripts/Netflix.ZhAr.Google.ipad-compat-1.js'),'utf8');
const moduleText=fs.readFileSync(path.join(root,'docs/modules/Netflix.ZhAr.Google.Compat.srmodule'),'utf8');
assert(!moduleText.includes('argument='));assert(!moduleText.includes('#!arguments'));
assert(!code.includes('DSPublicConfig21'));assert(!code.includes('$persistentStore'));
const installPage=fs.readFileSync(path.join(root,'docs/compat/index.html'),'utf8');
const installLink=installPage.match(/id="install-compat" href="([^"]+)"/)[1];
assert(installLink.startsWith('shadowrocket://install?module='));
const fixedUrl='https://ameder0201.github.io/Netflix-ZhAr-Subtitles/modules/Netflix.ZhAr.Google.Compat.srmodule';
assert.equal(decodeURIComponent(installLink.split('module=')[1]),fixedUrl);
assert(installPage.includes('href="'+fixedUrl+'"'));
assert(installPage.includes('ipad-compat-1'));assert(!installPage.includes('<script'));
assert(fs.readFileSync(path.join(root,'docs/index.html'),'utf8').includes('href="compat/"'));
for(const [argument,template] of [[undefined,'no'],['Provider=Google&SourceLanguage={{{SourceLanguage}}}','yes'],[{DeepLKey:'TEST_PRIVATE_KEY'},'no']]){
 const logs=[],wire=[];let cdn=0,translate=0;
 const c={console:{log:s=>logs.push(s)},setTimeout:()=>1,clearTimeout(){}};
 for(const name of ['vtt_core.js','indexed_core.js'])vm.runInNewContext(fs.readFileSync(path.join(root,'src',name),'utf8'),c);
 const source=c.DSS19.fixture(),idx=c.DSS19.index(source,Buffer.byteLength(source)),row=idx.rows[0],url='https://test.oca.nflxvideo.net/?o=1&v=1&e=1&t=PRIVATE_TEST_SIGNATURE';
 if(argument!==undefined)c.$argument=argument;
 c.$request={url,method:'GET',headers:{Range:`bytes=${row.offset}-${row.offset+row.bytes-1}`}};
 c.$done=r=>wire.push(r);c.$persistentStore={read(){throw Error('Forbidden')},write(){throw Error('Forbidden')}};
 c.$httpClient={get:(req,cb)=>{
  if(req.url===url){cdn++;const [a,z]=req.headers.Range.match(/\d+/g).map(Number),end=Math.min(z,Buffer.byteLength(source)-1);cb(null,{status:206,headers:{'Content-Range':`bytes ${a}-${end}/${Buffer.byteLength(source)}`,'Content-Length':String(end-a+1)}},c.DSS19.slice(source,a,end+1));}
  else{const u=new URL(req.url);assert.equal(u.hostname,'translate.googleapis.com');assert(!req.url.includes('TEST_PRIVATE_KEY'));translate++;
   const p=u.searchParams,text=p.get('tl')==='zh-CN'?'中文测试':'مرحبا بك.';cb(null,{status:200,headers:{}},JSON.stringify([[[p.get('q').split('\r').map(()=>text).join('\r'),null,null]]]));}
 },post(){throw Error('No DeepL or local collector calls')}};
 vm.runInNewContext(code,c);
 assert.equal(wire.length,1);assert.equal(cdn,3);assert.equal(translate,2);
 assert.equal(wire[0].response.headers['X-DualSubs-Outcome'],'BILINGUAL');assert.equal(Buffer.byteLength(wire[0].response.body),row.bytes);
 assert(wire[0].response.body.includes('中文测试\nمرحبا بك.'));
 assert(logs[0].includes('IPAD_COMPAT_1 READY'));assert(logs[0].includes('nativeArgumentType='+typeof argument));assert(logs[0].includes('unresolvedTemplate='+template));
 assert(!logs.join('').includes('TEST_PRIVATE_KEY'));assert(!logs.join('').includes('PRIVATE_TEST_SIGNATURE'));assert(!logs.join('').includes('{{{SourceLanguage}}}'));
}
console.log('PASS Google compat: native argument absent / unexpanded / object all bypassed; full Google bilingual exact206; no DeepL/storage/collector calls; diagnostic logs contain shape only.');
