var DSRender21=(function(){
 function clean(s){if(typeof s!=='string'||DSV11.bytes(s)<0||s.indexOf('\uFFFD')>=0)throw Error('BILINGUAL_TEXT_INVALID');return s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').replace(/[\r\n]+/g,' ').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
 function timing(head){var line=head.split(/\r?\n/).pop(),m=line.match(/^(\S+)[ \t]+-->[ \t]+(\S+)(.*)$/);if(!m)throw Error('BILINGUAL_RENDER_INVALID');return m;}
 function shortTime(t){return t.replace(/^00:(\d{2}:\d{2}\.\d{3})$/,'$1');}
 function timeKey(head){var t=timing(head);return shortTime(t[1])+'|'+shortTime(t[2]);}
 function shortHead(head,plain){
  var lines=head.split(/\r?\n/),m=timing(head),settings=m[3].trim();
  // Compact metadata retains IDs and every cue setting; plain layout only
  // removes optional identifiers and positioning/region settings on overflow.
  if(plain)settings=settings.split(/[ \t]+/).filter(function(s){return s&&!/^(?:line|position|size|align|region):/.test(s);}).join(' ');
  else settings=settings.replace(/[ \t]+/g,' ');
  return (plain?'':lines.slice(0,-1).join('\n')+(lines.length>1?'\n':''))+shortTime(m[1])+' --> '+shortTime(m[2])+(settings?' '+settings:'');
 }
 function compact(parsed,texts,plain){
  var byPart={};parsed.cues.forEach(function(c,i){byPart[c.part]=i;});
  var blocks=[];
  parsed.parts.forEach(function(part,n){
   if(n===0||!part||/^\s*$/.test(part))return;
   if(Object.prototype.hasOwnProperty.call(byPart,n)){
    var i=byPart[n],c=parsed.cues[i];blocks.push(shortHead(c.head,plain)+'\n'+texts[i]);
   }else if(!/^NOTE(?:[ \t\r\n]|$)/.test(part)&&!(plain&&/^(?:STYLE|REGION)(?:\r?\n|$)/.test(part))){blocks.push(part.replace(/\r\n/g,'\n'));}
  });
  return blocks.join('\n\n')+'\n\n';
 }
 function compileDetailed(source,zh,ar,position,count){
  var p=DSV11.parse('WEBVTT\n\n'+source),parts=p.parts.slice(),texts=[],zhBytes=0,arBytes=0;
  if(p.cues.length!==count||zh.length!==count||ar.length!==count)throw Error('BILINGUAL_COUNT_INVALID');
  p.cues.forEach(function(c,i){
   if(!c.input){texts[i]=c.original.replace(/\r\n/g,'\n');return;}
   var a=clean(zh[i]),b=clean(ar[i]);if(!a.trim()||!b.trim())throw Error('BILINGUAL_TEXT_INVALID');
   zhBytes+=DSV11.bytes(a);arBytes+=DSV11.bytes(b);texts[i]=position==='ar-first'?b+'\n'+a:a+'\n'+b;
   parts[c.part]=c.head+c.nl+(position==='ar-first'?b+c.nl+a:a+c.nl+b);
  });
  var sourceBytes=DSV11.bytes(source),out=parts.join('').slice(8),mode='OriginalLayout';
  var capacity={sourceBytes:sourceBytes,originalLayoutBytes:DSV11.bytes(out),compactBytes:null,standardBytes:null,zhBytes:zhBytes,arBytes:arBytes,cueCount:count};
  if(DSV11.bytes(out)>sourceBytes){out=compact(p,texts,false);mode='CompactMetadata';capacity.compactBytes=DSV11.bytes(out);}
  if(DSV11.bytes(out)>sourceBytes){out=compact(p,texts,true);mode='StandardLayout';capacity.standardBytes=DSV11.bytes(out);}
  var free=sourceBytes-DSV11.bytes(out);
  if(free<0){var error=Error('BILINGUAL_SEGMENT_OVERFLOW');error.capacity=capacity;throw error;}
  var payloadBytes=DSV11.bytes(out);
  if(free){var sep=/\n\n$/.test(out)?'':/\n$/.test(out)?'\n':'\n\n';if(free>=sep.length+7)out+=sep+'NOTE\n'+' '.repeat(free-sep.length-7)+'\n\n';else out+='\n'.repeat(free);}
  var q=DSV11.parse('WEBVTT\n\n'+out);
  if(DSV11.bytes(out)!==sourceBytes||q.cues.length!==count||q.cues.some(function(c,i){
   return timeKey(c.head)!==timeKey(p.cues[i].head)||(mode==='OriginalLayout'&&c.head!==p.cues[i].head)||c.original.replace(/\r\n/g,'\n').replace(/\n+$/,'')!==texts[i].replace(/\n+$/,'');
  }))throw Error('BILINGUAL_RENDER_INVALID');
  return {body:out,mode:mode,payloadBytes:payloadBytes,capacity:capacity};
 }
 function compile(source,zh,ar,position,count){return compileDetailed(source,zh,ar,position,count).body;}
 return {compile:compile,compileDetailed:compileDetailed};
})();
