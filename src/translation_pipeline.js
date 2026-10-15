var DSPipeline21=(function(){
 var converter;
 function simplified(text){if(!converter)converter=OpenCC.Converter({from:'t',to:'cn'});return converter(text);}
 function run(cues,c,ctx,cb){
  var original=cues.map(function(x){return x.input;}),zh,ar,detectedZh=[],detectedAr=[];
  function branch(input,source,target,done){
   var groups;try{groups=DSProviders21.groups(input,c,source,target);}catch(e){done('CUE_REQUEST_TOO_LARGE');return;}
   var result=input.map(function(){return '';}),detected=input.map(function(){return '';});
   function next(n){if(ctx.cancelled())return;if(n===groups.length){done(null,result,detected);return;}var ids=groups[n];DSProviders21[c.provider==='DeepL'?'deepl':'google'](ids.map(function(i){return input[i];}),source,target,c,ctx,function(e,r){if(e){done(e);return;}ids.forEach(function(i,j){result[i]=r.texts[j];detected[i]=r.detectedSources[j]||'';});next(n+1);});}next(0);
  }
  function arabic(){
   if(c.sourceLanguage==='AR'){ar=original.slice();finish();return;}
   var chinese=/^ZH(?:-|$)/.test(c.sourceLanguage),pivot=c.pipeline==='pivot-zh'||chinese;
   branch(pivot?zh:original,pivot?'ZH':c.sourceLanguage,'ar',function(e,t,d){if(e){cb(e);return;}ar=t;detectedAr=d;finish();});
  }
  function finish(){
   try{
    zh=zh.map(simplified);
    for(var i=0;i<original.length;i++)if(original[i]&&(!zh[i].trim()||!ar[i].trim()||zh[i].indexOf('\uFFFD')>=0||ar[i].indexOf('\uFFFD')>=0))throw Error('Text');
    var meaningful=original.filter(function(t){return t.replace(/[\d\s\W]/g,'').length>2||t.length>20;});
    if(meaningful.length&&original.some(function(t){return t.length>20;})&&!zh.some(function(t){return /[\u3400-\u9fff]/.test(t);}))throw Error('Chinese target');
    if(original.some(function(t){return /[\u3400-\u9fffA-Za-z\u3040-\u30ff]/.test(t)&&t.length>8;})&&!ar.some(function(t){return /[\u0600-\u06ff]/.test(t);}))throw Error('Arabic target');
    var conflict=0;original.forEach(function(t,i){if(t.length>=16&&detectedZh[i]&&detectedAr[i]&&detectedZh[i]!==detectedAr[i])conflict++;});
    cb(null,{zhTexts:zh,arTexts:ar,detectionConflicts:conflict});
   }catch(e){cb('BILINGUAL_TARGET_INVALID');}
  }
  if(/^ZH(?:-|$)/.test(c.sourceLanguage)){zh=original.map(function(t){return c.sourceLanguage==='ZH-HANS'||c.sourceLanguage==='ZH-CN'?t:simplified(t);});arabic();}
  else branch(original,c.sourceLanguage,'zh-Hans',function(e,t,d){if(e){cb(e);return;}zh=t.map(simplified);detectedZh=d;arabic();});
 }
 return {run:run,simplified:simplified};
})();
