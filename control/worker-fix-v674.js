'use strict';
(()=>{
if(window.ONE_SHOT_WORKER_FIX_674)return;window.ONE_SHOT_WORKER_FIX_674=true;
const NativeWorker=window.Worker;
function WrappedWorker(url,opts){let u=String(url||'');if(u.includes('xlsx-media-worker-v600.js')){u='xlsx-media-worker-v600.js?v=674';}return new NativeWorker(u,opts)}
WrappedWorker.prototype=NativeWorker.prototype;
window.Worker=WrappedWorker;
console.info('[ONE SHOT CONTROL] worker fix v6.74 activo');
})();
