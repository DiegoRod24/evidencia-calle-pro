'use strict';
(()=>{
const BUILD='one-shot-catalog-sync-v620';
const URL='https://jdupbwkbitkcwhnsslkk.supabase.co';
const KEY='sb_publishable_j8mj7pLl_Bt713wzmG0oKg_lKfphiO3';
const CACHE='oneShotSharedCatalogs_v620';
const api=path=>fetch(`${URL}/rest/v1/${path}`,{headers:{apikey:KEY,Authorization:'Bearer '+KEY}}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()});
function apply(c,source='remote'){
 if(!c)return;window.ONE_SHOT_SHARED_CATALOGS=c;window.ONE_SHOT_DATA=window.ONE_SHOT_DATA||{};
 window.ONE_SHOT_DATA.parties=(c.parties||[]).filter(x=>x.active!==false).map(x=>x.name);
 window.ONE_SHOT_DATA.candidates=(c.candidates||[]).filter(x=>x.active!==false).map(x=>({id:x.id,name:x.display_name||x.full_name,fullName:x.full_name,partyId:x.party_id,processId:x.process_id,officeId:x.office_id}));
 try{localStorage.setItem(CACHE,JSON.stringify({at:Date.now(),data:c}))}catch(_){}
 window.dispatchEvent(new CustomEvent('oneshot:catalogs',{detail:{...c,source}}));
 console.info('[ONE SHOT]',BUILD,source,window.ONE_SHOT_DATA.parties.length,'partidos');
}
function cached(){try{return JSON.parse(localStorage.getItem(CACHE)||'null')}catch(_){return null}}
async function sync(){const old=cached();if(old?.data)apply(old.data,'cache');if(!navigator.onLine)return;try{const [processes,parties,offices,candidates,providers,types]=await Promise.all([
 api('catalog_processes?select=*&active=eq.true&order=sort_order,name'),api('catalog_parties?select=*&active=eq.true&order=sort_order,name'),api('catalog_offices?select=*&active=eq.true&order=sort_order,name'),api('catalog_candidates?select=*&active=eq.true&order=sort_order,full_name'),api('catalog_providers?select=*&active=eq.true&order=legal_name'),api('catalog_evidence_types?select=*&active=eq.true&order=sort_order,name')]);apply({processes,parties,offices,candidates,providers,types},'remote')}catch(e){console.warn('[ONE SHOT CATALOG SYNC]',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,250),{once:true});else setTimeout(sync,250);
window.addEventListener('online',()=>setTimeout(sync,500));
})();
