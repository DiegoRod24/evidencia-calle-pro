'use strict';
(()=>{
if(window.ONE_SHOT_MEDIA_BOOT_674)return;window.ONE_SHOT_MEDIA_BOOT_674=true;
const NativeWorker=window.Worker;
function WrappedWorker(url,opts){let u=String(url||'');if(u.includes('xlsx-media-worker-v600.js'))u='xlsx-media-worker-v600.js?v=674';return new NativeWorker(u,opts)}
WrappedWorker.prototype=NativeWorker.prototype;window.Worker=WrappedWorker;
function load(src,flag){if(window[flag])return;const s=document.createElement('script');s.src=src;s.defer=true;document.head.appendChild(s)}
load('editable-media-index-v674.js?v=674','ONE_SHOT_EDITABLE_MEDIA_INDEX_674');
load('media-resolver-v674.js?v=674','ONE_SHOT_MEDIA_RESOLVER_674');
console.info('[ONE SHOT CONTROL] media bootstrap v6.74 · indexador + resolver único');
})();
