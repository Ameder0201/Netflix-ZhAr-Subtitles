var DSProviders21=(function(){
 function remaining(ctx){return ctx.deadline-Date.now()-3000;}
 function usable(ctx){return !ctx.cancelled()&&remaining(ctx)>200&&ctx.calls<16;}
 function bytes(s){return DSV11.bytes(s);}
 function validate(rows,n){if(!Array.isArray(rows)||rows.length!==n||rows.some(function(s){return typeof s!=='string'||!s.trim()||bytes(s)<0||s.indexOf('\uFFFD')>=0;}))throw Error('PROVIDER_RESPONSE_INVALID');return rows;}
 function groups(texts,c,source,target){
  var out=[],g=[];
  function fits(a){if(a.length>50)return false;if(c.provider==='Google')return encodeURIComponent(a.join('\r')).length<=6000;var p={text:a,target_lang:target==='zh-Hans'?'ZH-HANS':'AR'};if(source!=='AUTO')p.source_lang=source.indexOf('ZH')===0?'ZH':source;return bytes(JSON.stringify(p))<=24576;}
  texts.forEach(function(t,i){if(!t)return;var next=g.concat(i);if(!fits(next.map(function(j){return texts[j];}))){if(!g.length)throw Error('CUE_REQUEST_TOO_LARGE');out.push(g);g=[i];if(!fits([t]))throw Error('CUE_REQUEST_TOO_LARGE');}else g=next;});if(g.length)out.push(g);return out;
 }
 function retryDelay(r,c){var h=r&&r.headers||{},v='';Object.keys(h).forEach(function(k){if(k.toLowerCase()==='retry-after')v=String(h[k]);});var ms=0;if(v){ms=/^\d+(?:\.\d+)?$/.test(v)?Number(v)*1000:Math.max(0,Date.parse(v)-Date.now());if(!Number.isFinite(ms))ms=0;}return Math.max(ms,c.retry.baseDelayMs)+Math.floor(Math.random()*100);}
 return {remaining:remaining,usable:usable,validate:validate,groups:groups,retryDelay:retryDelay};
})();
