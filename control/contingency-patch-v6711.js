'use strict';
(()=>{
if(window.ONE_SHOT_CONTINGENCY_PATCH_6711)return;window.ONE_SHOT_CONTINGENCY_PATCH_6711=true;
const previous=window.fetch.bind(window);
window.fetch=async function(input,init={}){
  try{return await previous(input,init)}catch(err){
    const raw=typeof input==='string'?input:input?.url||'';let u;
    try{u=new URL(raw,location.href)}catch(_){throw err}
    const method=String(init.method||(typeof input!=='string'&&input?.method)||'GET').toUpperCase();
    if(window.ONE_SHOT_CONTINGENCY_ACTIVE&&method==='PATCH'&&u.hostname==='jdupbwkbitkcwhnsslkk.supabase.co'&&u.pathname.endsWith('/rest/v1/control_evidences')){
      console.warn('[ONE SHOT CONTROL] PATCH conservado en cola local; respuesta 204 reparada',err);
      return new Response(null,{status:204,headers:{'X-One-Shot-Fallback':'contingency-patch-v6711'}});
    }
    throw err;
  }
};
})();