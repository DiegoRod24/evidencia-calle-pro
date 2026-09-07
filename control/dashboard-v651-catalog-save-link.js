'use strict';
(()=>{
const BUILD='control-v6.51-catalog-save-link';
let CFG=null;
const $=id=>document.getElementById(id),norm=v=>String(v??'').trim();
async function config(){if(CFG)return CFG;const src=[...document.scripts].map(s=>s.src).find(s=>/\/control\/app\.js/.test(s))||'app.js';const text=await fetch(src,{cache:'no-store'}).then(r=>r.text()),u=(text.match(/SUPA_URL='([^']+)'/)||[])[1],k=(text.match(/SUPA_KEY='([^']+)'/)||[])[1];if(!u||!k)throw new Error('Configuración central no disponible');return CFG={url:u,key:k}}
async function api(path,opts={}){const c=await config();return fetch(`${c.url}/rest/v1/${path}`,{...opts,headers:{apikey:c.key,Authorization:'Bearer '+c.key,'Content-Type':'application/json',...(opts.headers||{})}})}
const operator=()=>norm(localStorage.getItem('oneShotControlOperator'))||'Operador CONTROL';
async function linkIds(s){if(!s.code)return;const patch={party_id:s.partyId||null,provider_id:s.providerId||null,updated_at:new Date().toISOString()};const q=await api(`control_evidences?code=eq.${encodeURIComponent(s.code)}`,{method:'PATCH',body:JSON.stringify(patch),headers:{Prefer:'return=minimal'}});if(!q.ok)throw new Error(`No se pudieron vincular IDs (${q.status})`);if(s.partyId){await api(`control_evidence_parties?evidence_code=eq.${encodeURIComponent(s.code)}&is_primary=eq.true`,{method:'DELETE',headers:{Prefer:'return=minimal'}});await api('control_evidence_parties',{method:'POST',body:JSON.stringify({evidence_code:s.code,party_id:s.partyId,is_primary:true,created_by:operator()}),headers:{Prefer:'resolution=merge-duplicates,return=minimal'}})}
}
function bind(){const modal=$('geoAuditModal'),save=$('gaSave');if(!modal?.classList.contains('open')||!save||save.dataset.v651)return;const base=save.onclick;if(typeof base!=='function')return;save.dataset.v651='1';save.onclick=async function(e){const party=document.querySelector('#gaPartyGrid .gaParty.on'),provider=$('gaProvider')?.selectedOptions?.[0],snapshot={code:norm($('gaTitle')?.textContent),partyId:norm(party?.dataset.id),providerId:norm(provider?.dataset.id)};let result;try{result=base.call(this,e);if(result&&typeof result.then==='function')await result;await linkIds(snapshot);console.info('[ONE SHOT CONTROL]',BUILD,'IDs vinculados',snapshot.code)}catch(err){console.warn('[ONE SHOT CONTROL v651]',err)}return result}}
function boot(){setInterval(bind,250);console.info('[ONE SHOT CONTROL]',BUILD)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
