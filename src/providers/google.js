DSProviders21.google=function(texts,source,target,c,ctx,callback,depth,retry){
 depth=depth||0;retry=retry||0;if(!DSProviders21.usable(ctx)){callback('TRANSLATION_DEADLINE');return;}
 var sl=source==='AUTO'?'auto':source.indexOf('ZH')===0?'zh-CN':source.toLowerCase(),tl=target==='zh-Hans'?'zh-CN':'ar';ctx.calls++;
 try{$httpClient.get({url:'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl='+sl+'&tl='+tl+'&q='+encodeURIComponent(texts.join('\r')),headers:{Accept:'application/json'},timeout:Math.min(6,DSProviders21.remaining(ctx)/1000)},function(e,r,b){
  if(ctx.cancelled())return;var status=Number(r&&(r.status||r.statusCode));
  if(e||status!==200){
   if(!e&&(status===429||status===529||status>=500)&&retry<c.retry.maxRetries){var delay=DSProviders21.retryDelay(r,c);if(delay+1000<DSProviders21.remaining(ctx)){setTimeout(function(){DSProviders21.google(texts,source,target,c,ctx,callback,depth,retry+1);},delay);return;}}
   callback('GOOGLE_REQUEST_FAILED');return;
  }
  var rows;
  try{if(typeof b!=='string'||DSV11.bytes(b)>131072)throw Error('Budget');rows=DSProviders21.validate(DSV11.decode(b,texts.length),texts.length);}
  catch(err){if(texts.length>1&&depth<4){var m=Math.floor(texts.length/2);DSProviders21.google(texts.slice(0,m),source,target,c,ctx,function(err,a){if(err){callback(err);return;}DSProviders21.google(texts.slice(m),source,target,c,ctx,function(err,z){callback(err,err?null:{texts:a.texts.concat(z.texts),detectedSources:[],provider:'Google'});},depth+1,0);},depth+1,0);return;}callback('GOOGLE_RESPONSE_INVALID');return;}
  callback(null,{texts:rows,detectedSources:[],provider:'Google'});
 });}catch(e){callback('GOOGLE_REQUEST_FAILED');}
};
