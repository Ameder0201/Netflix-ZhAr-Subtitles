DSProviders21.deepl=function(texts,source,target,c,ctx,callback,depth,retry){
 depth=depth||0;retry=retry||0;if(!DSProviders21.usable(ctx)){callback('TRANSLATION_DEADLINE');return;}
 var p={text:texts,target_lang:target==='zh-Hans'?'ZH-HANS':'AR'};if(source!=='AUTO')p.source_lang=source.indexOf('ZH')===0?'ZH':source;
 var data=JSON.stringify(p);if(texts.length>50||DSV11.bytes(data)>24576){callback('DEEPL_REQUEST_BUDGET');return;}
 var endpoint=c.deepl.plan==='Free'?'https://api-free.deepl.com/v2/translate':'https://api.deepl.com/v2/translate';
 if(typeof ctx.apiKey!=='string'||!ctx.apiKey.trim()||/[\r\n]/.test(ctx.apiKey)){callback('DEEPL_KEY_MISSING');return;}
 ctx.calls++;
 try{$httpClient.post({url:endpoint,headers:{'Content-Type':'application/json',Authorization:'DeepL-Auth-Key '+ctx.apiKey},body:data,timeout:Math.min(8,DSProviders21.remaining(ctx)/1000)},function(e,r,b){
  if(ctx.cancelled())return;var status=Number(r&&(r.status||r.statusCode));
  if(!e&&status===413&&texts.length>1&&depth<4){var m=Math.floor(texts.length/2);DSProviders21.deepl(texts.slice(0,m),source,target,c,ctx,function(err,a){if(err){callback(err);return;}DSProviders21.deepl(texts.slice(m),source,target,c,ctx,function(err,z){callback(err,err?null:{texts:a.texts.concat(z.texts),detectedSources:a.detectedSources.concat(z.detectedSources),provider:'DeepL'});},depth+1,0);},depth+1,0);return;}
  if(e||status!==200){
   if(!e&&(status===429||status===529||status>=500)&&retry<c.retry.maxRetries){var delay=DSProviders21.retryDelay(r,c);if(delay+1000<DSProviders21.remaining(ctx)){setTimeout(function(){DSProviders21.deepl(texts,source,target,c,ctx,callback,depth,retry+1);},delay);return;}}
   callback(e?'DEEPL_NETWORK_UNKNOWN':status===403?'DEEPL_AUTH_FAILED':status===456?'DEEPL_QUOTA_EXCEEDED':status===400?'DEEPL_PARAMETER_INVALID':status===429?'DEEPL_RATE_LIMITED':'DEEPL_REQUEST_FAILED');return;
  }
  try{if(typeof b!=='string'||DSV11.bytes(b)>131072)throw Error('Budget');var a=JSON.parse(b).translations;if(!Array.isArray(a)||a.length!==texts.length)throw Error('Count');var rows=DSProviders21.validate(a.map(function(x){return x&&x.text;}),texts.length);callback(null,{texts:rows,detectedSources:a.map(function(x){return typeof x.detected_source_language==='string'?x.detected_source_language.toUpperCase():'';}),provider:'DeepL'});}
  catch(e2){callback('DEEPL_RESPONSE_INVALID');}
 });}catch(e){callback('DEEPL_REQUEST_FAILED');}
};
