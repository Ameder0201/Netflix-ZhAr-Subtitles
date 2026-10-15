(function(){
 var url=String($request.url||''),method=String($request.method||'GET').toUpperCase(),version='v21-config-2',stopped=false,timer,committed=false,start=Date.now();
 var fixture=false,originalSegment=null,originalOffset=0,renderCapacity=null;
 function done(r){if(!stopped){stopped=true;if(timer)clearTimeout(timer);$done(r||{});}}
 function header(h,n){var keys=Object.keys(h||{});for(var i=0;i<keys.length;i++)if(keys[i].toLowerCase()===n)return String(h[keys[i]]);return '';}
 function fallback(code){
  if(stopped)return;
  if(cfg&&cfg.logLevel!=='OFF')try{console.log('DualSubs '+version+' '+code+(renderCapacity?' '+JSON.stringify(renderCapacity):''));}catch(e){}
  if(originalSegment&&rng){try{var b=DSS19.slice(originalSegment,rng.start-originalOffset,rng.end-originalOffset+1),extra={'X-DualSubs-Outcome':code};if(renderCapacity){extra['X-DualSubs-Render-Required-Bytes']=renderCapacity.standardBytes;extra['X-DualSubs-Render-Source-Bytes']=renderCapacity.sourceBytes;}send(b,206,'bytes '+rng.start+'-'+rng.end+'/'+idx.bytes,'Original',extra);return;}catch(e){}}
  done({});
 }
 function fail(code){fallback(code||'SUBTITLE_UNAVAILABLE');}
 function pass(){done({});}
 var cfg,idx,rng,ctx;
 function send(text,status,contentRange,cache,extra){
  var h={'Content-Type':'text/vtt; charset=utf-8','Cache-Control':'no-store','Accept-Ranges':'bytes','Content-Length':String(DSV11.bytes(text)),'X-DualSubs-Standalone':version,'X-DualSubs-Cache':cache||'Header','X-DualSubs-Translation-Calls':String(ctx?ctx.calls:0),'X-DualSubs-Provider':cfg.provider,'X-DualSubs-Config-Revision':String(cfg.configRevision)};
  if(contentRange)h['Content-Range']=contentRange;
  Object.keys(extra||{}).forEach(function(k){h[k]=String(extra[k]);});
  done({response:{status:status,headers:h,body:text}});
 }
 function sourceGet(a,z,cb){
  if(stopped)return;
  if(fixture){var text=DSS19.fixture();try{cb(null,{status:206,headers:{'Content-Range':'bytes '+a+'-'+z+'/'+DSV11.bytes(text),'Content-Length':String(z-a+1)}},DSS19.slice(text,a,z+1));}catch(e){cb('fixture-range');}return;}
  var h={};Object.keys($request.headers||{}).forEach(function(k){if(!/^(range|accept-encoding|content-length|host|connection|if-.+)$/i.test(k))h[k]=$request.headers[k];});
  h.Range='bytes='+a+'-'+z;h['Accept-Encoding']='identity';h['X-DualSubs-Probe']=version;
  try{$httpClient.get({url:url,headers:h,timeout:5},function(e,r,b){if(!stopped)cb(e,r,b);});}catch(e){cb('source-request');}
 }
 function completePart(e,r,b,row){
  return !e&&r&&Number(r.status||r.statusCode)===206&&header(r.headers,'content-range')==='bytes '+row.offset+'-'+(row.offset+row.bytes-1)+'/'+idx.bytes&&header(r.headers,'content-length')===String(row.bytes)&&typeof b==='string'&&b.indexOf('\uFFFD')<0&&DSV11.bytes(b)===row.bytes;
 }
 function segment(n,cb){
  var row=idx.rows[n];
  sourceGet(row.offset,row.offset+row.bytes-1,function(e,r,source){
   if(!completePart(e,r,source,row)){cb('SUBTITLE_SOURCE_RANGE');return;}
   originalSegment=source;originalOffset=row.offset;
   var parsed;try{parsed=DSV11.parse('WEBVTT\n\n'+source);if(parsed.cues.length!==row.cueCount)throw Error('Count');}catch(e2){cb('SUBTITLE_SOURCE_FORMAT');return;}
   DSPipeline21.run(parsed.cues,cfg,ctx,function(e,result){if(e){cb(e);return;}try{var rendered=DSRender21.compileDetailed(source,result.zhTexts,result.arTexts,cfg.position,row.cueCount);if(result.detectionConflicts&&cfg.logLevel!=='OFF')try{console.log('DualSubs '+version+' SOURCE_DETECTION_CONFLICT');}catch(ignore){}cb(null,rendered.body,'Bilingual',rendered);}catch(err){renderCapacity=err.capacity||null;cb(err.message==='BILINGUAL_SEGMENT_OVERFLOW'?'BILINGUAL_SEGMENT_OVERFLOW':'BILINGUAL_RENDER_INVALID');}});
  });
 }
 function deliver(){
  try{rng=DSS19.range(header($request.headers,'range'),idx.bytes);}catch(e){pass();return;}
  if(!rng){done({response:{status:416,headers:{'Content-Range':'bytes */'+idx.bytes,'Accept-Ranges':'bytes','Content-Length':'0'},body:''}});return;}
  var cr='bytes '+rng.start+'-'+rng.end+'/'+idx.bytes;
  if(rng.end<idx.rows[0].offset){try{send(DSS19.slice(idx.header,rng.start,rng.end+1),206,cr,'Header');}catch(e){pass();}return;}
  var n=idx.rows.findIndex(function(row){return rng.start>=row.offset&&rng.end<row.offset+row.bytes;});
  // Configuration v21 supports the observed Netflix header/indexed-segment requests only.
  // Unsupported ranges remain original in this uncached display prototype.
  if(n<0){pass();return;}
  committed=true;
  segment(n,function(error,b,cache,rendered){if(error){fail(error);return;}try{send(DSS19.slice(b,rng.start-idx.rows[n].offset,rng.end-idx.rows[n].offset+1),206,cr,cache,{'X-DualSubs-Segment':n,'X-DualSubs-Source-Cues':idx.rows[n].cueCount,'X-DualSubs-Outcome':'BILINGUAL','X-DualSubs-Render-Mode':rendered.mode,'X-DualSubs-Render-Source-Bytes':rendered.capacity.sourceBytes,'X-DualSubs-Render-Payload-Bytes':rendered.payloadBytes});}catch(e){fallback('UTF8_RANGE_BOUNDARY');}});
 }
 function prepareIndex(){
  function parsePrefix(e,r,b){
   try{
    if(e||!r||Number(r.status||r.statusCode)!==206||typeof b!=='string')throw Error('Prefix');
    var m=header(r.headers,'content-range').match(/^bytes 0-(\d+)\/(\d+)$/);if(!m||Number(m[1])>8191)throw Error('Range');
    idx=DSS19.index(b,Number(m[2]));
    deliver();
   }catch(e2){pass();}
  }
  if(fixture){var text=DSS19.fixture();parsePrefix(null,{status:206,headers:{'Content-Range':'bytes 0-'+(DSV11.bytes(text)-1)+'/'+DSV11.bytes(text)}},text);return;}
  sourceGet(0,127,function(e,r,b){
   if(e||!r||typeof b!=='string'||! /^(?:\uFEFF)?WEBVTT(?:[ \t\r\n]|$)/.test(b)){pass();return;}
   var m=header(r.headers,'content-range').match(/^bytes 0-(\d+)\/(\d+)$/);
   if(Number(r.status||r.statusCode)!==206||!m||Number(m[1])>127||Number(m[2])>524288){pass();return;}
   sourceGet(0,Math.min(8191,Number(m[2])-1),parsePrefix);
  });
 }
 try{
  if(!fixture&&(!/^https?:\/\/[^/]+\.oca\.nflxvideo\.net\/\?o=\d+&v=\d+&e=\d+&t=.+/.test(url)||header($request.headers,'x-dualsubs-probe'))){done({});return;}
  var requested=header($request.headers,'range'),candidate=requested.match(/^bytes=(\d+)-(\d+)$/);
  if(method!=='GET'||!candidate||Number(candidate[2])-Number(candidate[1])+1>49152||Number(candidate[2])>=524288){done({});return;}
  cfg=DSConfig21.resolve(DEVICE_CONFIG);
  ctx={apiKey:DEVICE_SECRET,deadline:start+28000,calls:0,cancelled:function(){return stopped;}};

  timer=setTimeout(function(){fallback('TRANSLATION_DEADLINE');},28000);
  prepareIndex();
 }catch(e){pass();}
})();
