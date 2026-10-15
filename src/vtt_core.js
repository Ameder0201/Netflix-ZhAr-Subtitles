// Private in-memory VTT processing. The original cue metadata and text are retained verbatim.
var DSV11=(function(){
 function bytes(s){if(typeof s!=='string')return -1;var n=0;for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);if(c<128)n++;else if(c<2048)n+=2;else if(c>=0xd800&&c<=0xdbff){var d=s.charCodeAt(++i);if(!(d>=0xdc00&&d<=0xdfff))return -1;n+=4;}else if(c>=0xdc00&&c<=0xdfff)return -1;else n+=3;}return n;}
 function hash(s,seed){var x=seed;for(var i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619);}return (x>>>0).toString(16);}
 function id(s){return hash(s,2166136261)+'-'+hash(s,333555777)+'-'+s.length;}
 function parse(text){
  if(bytes(text)<=0||! /^(?:\uFEFF)?WEBVTT(?:[ \t\r\n]|$)/.test(text)||text.indexOf('\uFFFD')>=0)throw Error('Invalid VTT');
  var parts=text.split(/((?:\r?\n){2,})/),cues=[];
  parts.forEach(function(part,index){
   if(!part||/^\s*$/.test(part))return;
   var lines=part.split(/\r?\n/),first=lines[0];
   if(/^(?:\uFEFF)?WEBVTT(?:[ \t]|$)/.test(first)||/^(?:NOTE(?:[ \t]|$)|STYLE$|REGION$)/.test(first))return;
   var ti=lines[0].indexOf('-->')>=0?0:lines[1]&&lines[1].indexOf('-->')>=0?1:-1;
   if(ti<0)throw Error('Unrecognized block');
   if(!/^(?:\d{2,}:)?\d{2}:\d{2}\.\d{3}[ \t]+-->[ \t]+(?:\d{2,}:)?\d{2}:\d{2}\.\d{3}(?:[ \t].*)?$/.test(lines[ti]))throw Error('Invalid timing');
   var nl=part.indexOf('\r\n')>=0?'\r\n':'\n',head=lines.slice(0,ti+1).join(nl),original=lines.slice(ti+1).join(nl);
   var input=original.replace(/<[^<>]*>/g,'').replace(/&(amp|lt|gt|quot|apos|nbsp|lrm|rlm);/g,function(m,k){return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',lrm:'',rlm:''}[k];}).replace(/[\r\n]+/g,' ').trim();
   if(input.indexOf('\r')>=0||input.length>4000)throw Error('Cue budget');
   cues.push({part:index,head:head,original:original,input:input,nl:nl});
  });
  if(!cues.length||cues.length>2500)throw Error('Cue count budget');
  return {parts:parts,cues:cues};
 }
 function batches(cues){
  var groups=[],group=[],length=0;
  cues.forEach(function(c,i){if(!c.input)return;var size=encodeURIComponent(c.input).length+(group.length?3:0);
   if(size>6000)throw Error('Request budget');
   if(group.length&&(group.length>=50||length+size>6000)){groups.push(group);group=[];length=0;}
   group.push(i);length+=size;
  });
  if(group.length)groups.push(group);return groups;
 }
 function decode(body,count){
  if(typeof body!=='string'||body.length>131072)throw Error('Response budget');
  var data=JSON.parse(body),segments;
  if(Array.isArray(data)&&Array.isArray(data[0]))segments=data[0].map(function(x){if(!Array.isArray(x)||typeof x[0]!=='string')throw Error('Segment');return x[0];});
  else if(data&&Array.isArray(data.sentences))segments=data.sentences.map(function(x){if(typeof x.trans!=='string')throw Error('Segment');return x.trans;});
  else throw Error('Response format');
  var rows=segments.join('').split(/\r/);
  if(rows.length!==count||rows.some(function(x){return !x.trim()||x.indexOf('\uFFFD')>=0;}))throw Error('Translation count/text');return rows;
 }
 function render(parsed,translations,position){
  if(translations.length!==parsed.cues.length)throw Error('Translation count');
  var parts=parsed.parts.slice(),arabic=0,translated=0;
  parsed.cues.forEach(function(c,i){
   if(!c.input)return;
   var t=translations[i];if(typeof t!=='string'||!t.trim()||t.indexOf('\uFFFD')>=0)throw Error('Missing translation');
   if(/[\u0600-\u06ff]/.test(t))arabic++;
   if(/[\u3400-\u9fff]/.test(c.input)&&!/[\u0600-\u06ff]/.test(t))throw Error('Chinese cue without Arabic');
   // Escape provider text; never introduce markup, blank cue separators, or timing lines.
   t=t.replace(/[\r\n]+/g,' ').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
   var originalText=c.original.replace(/(?:\r?\n)+$/,''),trailing=c.original.slice(originalText.length);
   parts[c.part]=c.head+c.nl+(position==='Reverse'?t+c.nl+c.original:originalText+c.nl+t+trailing);translated++;
  });
  if(!arabic)throw Error('No Arabic');
  var text=parts.join(''),roundtrip=parse(text);
  if(roundtrip.cues.length!==parsed.cues.length||roundtrip.cues.some(function(c,i){return c.head!==parsed.cues[i].head;}))throw Error('Cue metadata changed');
  return {body:text,cueCount:parsed.cues.length,translatedCueCount:translated,arabicCueCount:arabic};
 }
 return {bytes:bytes,id:id,parse:parse,batches:batches,decode:decode,render:render};
})();
