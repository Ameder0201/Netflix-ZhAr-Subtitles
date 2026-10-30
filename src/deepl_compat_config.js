// Old-client entry: fixed translation settings, literal key/plan only; no module templates.
var DSDeepLCompat21=(function(){
 function fail(code){throw Error(code);}
 function resolve(raw){
  var values=Object.create(null),object;
  if(raw==null||raw==='')fail('DEEPL_COMPAT_KEY_MISSING');
  if(typeof raw==='string'){
   if(raw.length>4096)fail('DEEPL_COMPAT_ARGUMENT_INVALID');
   raw=raw.trim();
   if(raw.charAt(0)==='{'){
    try{object=JSON.parse(raw);}catch(e){fail('DEEPL_COMPAT_ARGUMENT_INVALID');}
   }else{
    raw.split('&').forEach(function(pair){
     var at=pair.indexOf('='),k,v;
     if(at<1)fail('DEEPL_COMPAT_ARGUMENT_INVALID');
     try{k=decodeURIComponent(pair.slice(0,at));v=decodeURIComponent(pair.slice(at+1));}
     catch(e){fail('DEEPL_COMPAT_ARGUMENT_INVALID');}
     if(Object.prototype.hasOwnProperty.call(values,k))fail('DEEPL_COMPAT_ARGUMENT_INVALID');
     values[k]=v;
    });
   }
  }else if(typeof raw==='object')object=raw;
  else fail('DEEPL_COMPAT_ARGUMENT_INVALID');
  if(object!==undefined){
   if(!object||Array.isArray(object))fail('DEEPL_COMPAT_ARGUMENT_INVALID');
   Object.keys(object).forEach(function(k){values[k]=object[k];});
  }
  Object.keys(values).forEach(function(k){
   if(['DeepLKey','DeepLPlan'].indexOf(k)<0||typeof values[k]!=='string')fail('DEEPL_COMPAT_ARGUMENT_INVALID');
   if(values[k].indexOf('{{')>=0)fail('DEEPL_COMPAT_TEMPLATE_UNRESOLVED');
  });
  var key=values.DeepLKey||'',plan=values.DeepLPlan===undefined?'Free':values.DeepLPlan;
  if(!key||key==='REPLACE_WITH_YOUR_KEY')fail('DEEPL_COMPAT_KEY_MISSING');
  if(!/^[A-Za-z0-9._:-]{8,512}$/.test(key))fail('DEEPL_COMPAT_ARGUMENT_INVALID');
  if(plan!=='Free'&&plan!=='Pro')fail('DEEPL_COMPAT_PLAN_INVALID');
  return {config:DSConfig21.resolve({provider:'DeepL',sourceLanguage:'AUTO',pipeline:'direct',
   position:'zh-first',deepl:{plan:plan}}),apiKey:key};
 }
 return {resolve:resolve};
})();
