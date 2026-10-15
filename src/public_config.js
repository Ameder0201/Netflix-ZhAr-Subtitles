// Native module arguments only; no BoxJS, remote configuration or persistence.
var DSPublicConfig21=(function(){
 var allowed=['Provider','SourceLanguage','Position','Pipeline','DeepLPlan','DeepLKey'];
 function invalid(){throw Error('PUBLIC_ARGUMENT_INVALID');}
 function resolve(raw){
  var values=Object.create(null);
  if(typeof raw!=='string'||!raw||raw.length>8192)invalid();
  if(raw.charAt(0)==='{'){
   var object;try{object=JSON.parse(raw);}catch(e){invalid();}
   if(!object||Array.isArray(object)||typeof object!=='object')invalid();
   Object.keys(object).forEach(function(k){if(allowed.indexOf(k)<0||typeof object[k]!=='string')invalid();values[k]=object[k];});
  }else{
   raw.split('&').forEach(function(pair){
    var at=pair.indexOf('=');if(at<1)invalid();var k,v;
    try{k=decodeURIComponent(pair.slice(0,at));v=decodeURIComponent(pair.slice(at+1));}catch(e){invalid();}
    if(allowed.indexOf(k)<0||Object.prototype.hasOwnProperty.call(values,k))invalid();values[k]=v;
   });
  }
  if(values.Provider!=='Google'&&values.Provider!=='DeepL')invalid();
  var config=DSConfig21.resolve({provider:values.Provider,sourceLanguage:values.SourceLanguage||'AUTO',
   position:values.Position||'zh-first',pipeline:values.Pipeline||'direct',deepl:{plan:values.DeepLPlan||'Free'}});
  var apiKey='';
  if(config.provider==='DeepL'){
   apiKey=values.DeepLKey||'';
   if(apiKey==='REPLACE_WITH_YOUR_KEY'||!/^[A-Za-z0-9._:-]{8,512}$/.test(apiKey))invalid();
  }
  return {config:config,apiKey:apiKey};
 }
 return {resolve:resolve};
})();
