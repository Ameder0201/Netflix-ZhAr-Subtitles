// Segment-preserving UTF-8 string processing; no network or storage side effects.
var DSS19=(function(){
 function slice(s,start,end){
  var at=0,a=-1,z=-1;
  for(var i=0;i<s.length;){
   if(at===start)a=i;if(at===end){z=i;break;}
   var c=s.charCodeAt(i),n=c<128?1:c<2048?2:c>=0xd800&&c<=0xdbff?4:3;
   if(c>=0xdc00&&c<=0xdfff)throw Error('UTF8');
   if(n===4&&!(s.charCodeAt(i+1)>=0xdc00&&s.charCodeAt(i+1)<=0xdfff))throw Error('UTF8');
   if(at<start&&at+n>start||at<end&&at+n>end)throw Error('UTF8 boundary');
   at+=n;i+=n===4?2:1;
  }
  if(at===start&&a<0)a=s.length;if(at===end&&z<0)z=s.length;
  if(a<0||z<0)throw Error('Byte interval');return s.slice(a,z);
 }
 function index(prefix,total){
  if(typeof prefix!=='string'||! /^(?:\uFEFF)?WEBVTT(?:[ \t\r\n]|$)/.test(prefix)||!Number.isInteger(total)||total<1||total>524288)throw Error('Not subtitle');
  var m=prefix.match(/(?:^|\n)NOTE SegmentIndex\r?\n([\s\S]*?)\r?\nNOTE \/SegmentIndex(?:\r?\n|$)/);
  if(!m)throw Error('Missing index');
  var rows=m[1].split(/\r?\n/).map(function(line){
   var n=line.match(/^NOTE Segment=(\d+(?:\.\d+)?) (\d+)@(\d+) (\d+)$/);
   if(!n)throw Error('Index syntax');return {duration:Number(n[1]),bytes:Number(n[2]),offset:Number(n[3]),cueCount:Number(n[4])};
  });
  if(!rows.length||rows.length>30||rows[0].offset>8192)throw Error('Index budget');
  var count=0;
  rows.forEach(function(r,i){count+=r.cueCount;if(!Number.isInteger(r.bytes)||r.bytes<1||r.bytes>49152||!Number.isInteger(r.offset)||r.offset<88||!Number.isInteger(r.cueCount)||r.cueCount<1||r.cueCount>250||r.duration<=0||r.offset+r.bytes!==(i+1<rows.length?rows[i+1].offset:total))throw Error('Index boundary');});
  if(count>2500)throw Error('Cue budget');
  var header;
  try{header=slice(prefix,0,rows[0].offset);}catch(e){}
  if((!header||!/(?:\r?\n){2}$/.test(header))&&prefix.charAt(0)!=='\uFEFF')header=slice('\uFEFF'+prefix,0,rows[0].offset);
  if(header.indexOf('\uFFFD')>=0||header.indexOf('NOTE /SegmentIndex')<0||!/(?:\r?\n){2}$/.test(header))throw Error('Header boundary');
  return {header:header,headerId:DSV11.id(header),rows:rows,bytes:total};
 }
 function range(value,total){
  var m=String(value||'').match(/^bytes=(\d*)-(\d*)$/);if(!m||!m[1]&&!m[2])throw Error('Range syntax');
  var a=m[1]?Number(m[1]):Math.max(0,total-Number(m[2])),z=m[1]?(m[2]?Math.min(total-1,Number(m[2])):total-1):total-1;
  if(!Number.isSafeInteger(a)||!Number.isSafeInteger(z)||a>=total||z<a||!m[1]&&Number(m[2])<1)return null;
  return {start:a,end:z,bytes:z-a+1};
 }
 function compile(source,translations,position,expectedCount){
  var parsed=DSV11.parse('WEBVTT\n\n'+source),parts=parsed.parts.slice(),arabic=0,translated=0;
  if(parsed.cues.length!==expectedCount||translations.length!==expectedCount)throw Error('Count');
  parsed.cues.forEach(function(c,i){
   if(!c.input)return;var t=translations[i];
   if(typeof t!=='string'||!t.trim()||t.indexOf('\uFFFD')>=0||/[\u3400-\u9fff]/.test(t))throw Error('Translation');
   if(/[\u0600-\u06ff]/.test(t))arabic++;
   if(/[\u3400-\u9fff]/.test(c.input)&&!/[\u0600-\u06ff]/.test(t))throw Error('Arabic');
   t=t.replace(/[\r\n]+/g,' ').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
   var plain=c.original.replace(/<[^<>]*>/g,''),text=plain.replace(/(?:\r?\n)+$/,''),trailing=plain.slice(text.length);
   parts[c.part]=c.head+c.nl+(position==='Reverse'?t+c.nl+plain:text+c.nl+t+trailing);translated++;
  });
  var out=parts.join('').slice('WEBVTT\n\n'.length),free=DSV11.bytes(source)-DSV11.bytes(out);
  if(free<0)throw Error('Segment overflow');
  if(free){var sep=/\n\n$/.test(out)?'':/\n$/.test(out)?'\n':'\n\n';if(free>=sep.length+7)out+=sep+'NOTE\n'+' '.repeat(free-sep.length-7)+'\n\n';else out+='\n'.repeat(free);}
  var check=DSV11.parse('WEBVTT\n\n'+out);
  if(DSV11.bytes(out)!==DSV11.bytes(source)||check.cues.length!==parsed.cues.length||check.cues.some(function(c,i){return c.head!==parsed.cues[i].head||c.original.indexOf(parsed.cues[i].original.replace(/<[^<>]*>/g,'').replace(/(?:\r?\n)+$/,''))<0;}))throw Error('Render integrity');
  return {body:out,digest:DSV11.id(out),translatedCueCount:translated,arabicCueCount:arabic,paddingBytes:free};
 }
 function fixture(){
  var texts=['你好，欢迎回来。','请坐，我们现在开始。','今天的天气很好。'],chunks=[0,1].map(function(n){return texts.map(function(t,i){var sec=n*10+i*2;return String(n*3+i)+'\n00:00:'+String(sec).padStart(2,'0')+'.000 --> 00:00:'+String(sec+2).padStart(2,'0')+'.000\n'+'<c.public>'.repeat(16)+t+'</c>'.repeat(16)+'\n\n';}).join('');});
  var header='',old=-1;
  while(old!==DSV11.bytes(header)){old=DSV11.bytes(header);header='\uFEFFWEBVTT\n\nNOTE PUBLIC FIXTURE '+'.'.repeat(100)+'\n\nNOTE SegmentIndex\n'+chunks.map(function(c,i){return 'NOTE Segment=10 '+DSV11.bytes(c)+'@'+(old+(i?DSV11.bytes(chunks[0]):0))+' 3';}).join('\n')+'\nNOTE /SegmentIndex\n\n';}
  return header+chunks.join('');
 }
 return {slice:slice,index:index,range:range,compile:compile,fixture:fixture};
})();
