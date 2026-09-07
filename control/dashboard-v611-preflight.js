'use strict';
(()=>{
if(window.__OS_CONTROL_611)return;window.__OS_CONTROL_611=true;
const nativeFetch=window.fetch.bind(window);
window.fetch=(input,init)=>{
  let url=typeof input==='string'?input:input?.url;
  if(url&&/\/rest\/v1\/control_evidences\?/.test(url)&&/[?&]range=\d+-\d+/.test(url)){
    url=url.replace(/([?&])range=(\d+)-(\d+)/,(m,sep,a,b)=>`${sep}limit=${(+b)-(+a)+1}&offset=${a}`);
    if(typeof input==='string')input=url;else input=new Request(url,input);
  }
  return nativeFetch(input,init);
};
function lazyThumbs(){document.querySelectorAll('#reviewList img:not([loading])').forEach(img=>{img.loading='lazy';img.decoding='async'})}
const mo=new MutationObserver(lazyThumbs);
function boot(){const host=document.getElementById('reviewList');if(host)mo.observe(host,{childList:true,subtree:true});lazyThumbs();console.info('[ONE SHOT CONTROL] preflight-v6.11')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
