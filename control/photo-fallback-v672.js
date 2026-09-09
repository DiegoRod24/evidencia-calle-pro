'use strict';
(()=>{
// v6.74: este módulo queda como compatibilidad. La resolución de fotos se centraliza en media-resolver-v674.js.
if(window.ONE_SHOT_PHOTO_FALLBACK_COMPAT_674)return;window.ONE_SHOT_PHOTO_FALLBACK_COMPAT_674=true;
window.addEventListener('oneshot:photo-fallback-refresh',()=>{try{window.ONE_SHOT_MEDIA_RESOLVER?.resolve?.('compat-refresh')}catch(_){}});
console.info('[ONE SHOT CONTROL] photo fallback legado desactivado · usa resolver v6.74');
})();
