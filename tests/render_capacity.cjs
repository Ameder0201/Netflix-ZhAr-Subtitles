const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'../src'),c={};
for(const f of ['vtt_core.js','render_bilingual.js'])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const R=c.DSRender21,V=c.DSV11;
function key(head){const m=head.split(/\r?\n/).pop().match(/^(\S+)\s+-->\s+(\S+)/);return m.slice(1).map(t=>Math.round(t.split(':').reduce((sum,n)=>sum*60+Number(n),0)*1000)).join('|');}
function validate(source,result,zh,ar,order='zh-first'){
 assert.equal(Buffer.byteLength(result.body),Buffer.byteLength(source));
 const before=V.parse('WEBVTT\n\n'+source),after=V.parse('WEBVTT\n\n'+result.body);
 assert.equal(before.cues.length,after.cues.length);
 before.cues.forEach((b,i)=>{
  assert.equal(key(after.cues[i].head),key(b.head));
  const expected=order==='ar-first'?ar[i]+'\n'+zh[i]:zh[i]+'\n'+ar[i];
  assert.equal(after.cues[i].original.replace(/\r\n/g,'\n').replace(/\n+$/,''),expected);
 });
}
// Healthy output continues to preserve its complete ID/timing/settings head.
let source='cue-one\n00:00:01.001 --> 00:00:02.345 align:start\n'+'<c.a>'.repeat(40)+'中文'+'</c>'.repeat(40)+'\n\n';
let result=R.compileDetailed(source,['中文'],['مرحبا بك.'],'zh-first',1);
assert.equal(result.mode,'OriginalLayout');validate(source,result,['中文'],['مرحبا بك.']);assert(result.body.startsWith('cue-one\n00:00:01.001 --> 00:00:02.345 align:start'));
// Previously overflowing plain subtitles now fit using equivalent time syntax.
source='cue-one\n00:00:01.001 --> 00:00:02.345 align:start\n中文\n\n';
result=R.compileDetailed(source,['中文'],['ب'],'zh-first',1);
assert.equal(result.mode,'CompactMetadata');validate(source,result,['中文'],['ب']);assert(result.body.includes('cue-one\n00:01.001 --> 00:02.345 align:start'));
// Dense positioning metadata can fund full Arabic without dropping text/times.
source='optional-long-cue-identifier\r\n00:00:01.001 --> 00:00:02.345 line:90% position:50% size:80% align:center\r\n中文\r\n\r\n';
const arabic='مرحبا بكم في هذا اليوم الجميل.';
result=R.compileDetailed(source,['中文'],[arabic],'zh-first',1);
assert.equal(result.mode,'StandardLayout');validate(source,result,['中文'],[arabic]);assert(!result.body.includes('position:'));assert(!result.body.includes('optional-long'));
// Preserve hour >= 1, full timing precision, vertical setting and reverse order.
source='long-identifier-for-capacity\n01:00:01.001 --> 01:00:02.345 line:90% position:50% size:80% align:center vertical:rl\n中文\n\n';
result=R.compileDetailed(source,['中文'],[arabic],'ar-first',1);
assert.equal(result.mode,'StandardLayout');validate(source,result,['中文'],[arabic],'ar-first');assert(result.body.includes('01:00:01.001 --> 01:00:02.345 vertical:rl'));
// A single NOTE comment frees space while IDs and cue settings remain intact.
source='NOTE harmless comment '+'.'.repeat(100)+'\r\n\r\ncue-css-id\r\n00:00:01.001 --> 00:00:02.345 align:start\r\n中文\r\n\r\n';
result=R.compileDetailed(source,['中文'],[arabic],'zh-first',1);assert.equal(result.mode,'CompactMetadata');validate(source,result,['中文'],[arabic]);assert(result.body.includes('cue-css-id'));assert(!result.body.includes('harmless comment'));
// Multiple cues retain their text and times with one exact-sized output segment.
source=Array.from({length:180},(_,i)=>`optional-identifier-${i}\n00:${String(Math.floor(i/60)).padStart(2,'0')}:${String(i%60).padStart(2,'0')}.001 --> 00:${String(Math.floor((i+1)/60)).padStart(2,'0')}:${String((i+1)%60).padStart(2,'0')}.001 line:90% position:50% size:80% align:center\n中文\n\n`).join('');
const zh=Array(180).fill('中文'),ar=Array(180).fill(arabic);result=R.compileDetailed(source,zh,ar,'zh-first',180);assert.equal(result.mode,'StandardLayout');validate(source,result,zh,ar);
// Escaping remains text-safe after compaction and no HTML or cue injection occurs.
source='optional-long-id\n00:00:01.001 --> 00:00:02.345 line:90% position:50% size:80% align:center\n中文\n\n';
result=R.compileDetailed(source,['<中文>&'],['مرحبا\n\nبك'],'zh-first',1);validate(source,result,['&lt;中文&gt;&amp;'],['مرحبا بك']);
// Mathematically impossible output stays a measurable error; never truncation.
source='00:01.001 --> 00:02.345\n中文\n\n';
let error;try{R.compileDetailed(source,['中文'],['أ'.repeat(500)],'zh-first',1);}catch(e){error=e;}
assert.equal(error.message,'BILINGUAL_SEGMENT_OVERFLOW');assert(error.capacity.standardBytes>error.capacity.sourceBytes);assert.equal(error.capacity.arBytes,1000);assert.equal(error.capacity.cueCount,1);assert(!JSON.stringify(error.capacity).includes('中文'));
assert.throws(()=>R.compile(source,['中文'],[],'zh-first',1),/COUNT/);
console.log('PASS render capacity: healthy heads unchanged; exact original UTF-8 size; full Chinese/Arabic and millisecond timing; compact metadata and standard layout; 180 cues; hours/vertical/reverse/entity handling; measurable impossible-fit fallback.');
