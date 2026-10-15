var DSConfig21=(function(){
 var defaults={schemaVersion:1,profileId:'appletv-main',configRevision:1,sourceLanguage:'AUTO',displayLanguages:['zh-Hans','ar'],pipeline:'direct',position:'zh-first',provider:'Google',deepl:{plan:'Free'},retry:{maxRetries:1,baseDelayMs:500,exponential:true},failurePolicy:'original-subtitles',logLevel:'WARN'};
 var languages=['AUTO','ZH','ZH-HANS','ZH-CN','ZH-HANT','ZH-TW','ZH-HK','AR','EN','JA','KO','FR','DE','ES','IT','RU','PT','TR','ID','TH'];
 function resolve(value){
  if(value==null)value={};if(typeof value!=='object'||Array.isArray(value))throw Error('CONFIG_INVALID');
  Object.keys(value).forEach(function(k){if(!Object.prototype.hasOwnProperty.call(defaults,k))throw Error('CONFIG_UNKNOWN_FIELD');});
  var c=Object.assign({},defaults,value);c.deepl=Object.assign({},defaults.deepl,value.deepl||{});c.retry=Object.assign({},defaults.retry,value.retry||{});
  if(c.schemaVersion!==1||!/^[-a-z0-9]{1,40}$/.test(c.profileId)||!Number.isInteger(c.configRevision)||c.configRevision<1||languages.indexOf(c.sourceLanguage)<0||JSON.stringify(c.displayLanguages)!=='["zh-Hans","ar"]'||['direct','pivot-zh'].indexOf(c.pipeline)<0||['zh-first','ar-first'].indexOf(c.position)<0||['Google','DeepL'].indexOf(c.provider)<0||['Free','Pro'].indexOf(c.deepl.plan)<0||c.failurePolicy!=='original-subtitles'||['OFF','ERROR','WARN','INFO'].indexOf(c.logLevel)<0)throw Error('CONFIG_INVALID');
  if(Object.keys(c.deepl).some(function(k){return k!=='plan';})||Object.keys(c.retry).some(function(k){return ['maxRetries','baseDelayMs','exponential'].indexOf(k)<0;})||!Number.isInteger(c.retry.maxRetries)||c.retry.maxRetries<0||c.retry.maxRetries>1||!Number.isInteger(c.retry.baseDelayMs)||c.retry.baseDelayMs<250||c.retry.baseDelayMs>1500||typeof c.retry.exponential!=='boolean')throw Error('CONFIG_BUDGET_INVALID');
  return c;
 }
 return {resolve:resolve,languages:languages};
})();
