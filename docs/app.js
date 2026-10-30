// No telemetry, remote configuration or credential form.
(function(){
 'use strict';
 var base='https://ameder0201.github.io/Netflix-ZhAr-Subtitles/modules/';
 ['Google','DeepL'].forEach(function(provider){
  var id=provider.toLowerCase(),url=base+'Netflix.ZhAr.'+provider+'.srmodule';
  document.getElementById('install-'+id).href='shadowrocket://install?module='+encodeURIComponent(url);
 });
 document.querySelectorAll('[data-copy]').forEach(function(button){
  button.addEventListener('click',async function(){
   var provider=button.getAttribute('data-copy'),input=document.getElementById('url-'+provider.toLowerCase());
   try{
    await navigator.clipboard.writeText(input.value);
    document.getElementById('copy-status').textContent=provider+' 模块链接已复制。';
   }catch(ignore){input.focus();input.select();document.getElementById('copy-status').textContent='链接已选中，请手动复制。';}
  });
 });
})();
