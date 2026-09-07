'use strict';
(()=>{
if(window.ONE_SHOT_ENHANCEMENTS_V662)return;
window.ONE_SHOT_ENHANCEMENTS_V662=true;
const $=id=>document.getElementById(id);
let loaded=false,started=Date.now();
function coreReady(){return !!document.querySelector('#map .nm-tiles') && !/Iniciando/i.test($('syncBadge')?.textContent||'')}
function setNotice(t,tone='info'){const n=$('bootNotice');if(!n)return;if(!t){n.hidden=true;return}n.hidden=false;n.textContent=t;n.dataset.tone=tone}
function loadAudit(){if(loaded)return;loaded=true;const s=document.createElement('script');s.src='dashboard-v660-audit-engine.js?v=662-lazy';s.async=true;s.onload=()=>{console.info('[ONE SHOT CONTROL] auditoría avanzada cargada en segundo plano');if(/Preparando mejoras/i.test($('bootNotice')?.textContent||''))setNotice('')};s.onerror=()=>{loaded=false;console.warn('[ONE SHOT CONTROL] no se pudo cargar auditoría avanzada');setNotice('Mapa operativo · la auditoría avanzada no cargó. Recarga para reintentar.','warn')};document.body.appendChild(s)}
function tick(){if(coreReady()){setNotice('Preparando mejoras de auditoría…','info');setTimeout(loadAudit,80);return}if(Date.now()-started>5000){const badge=$('syncBadge');if(badge&&/Iniciando/i.test(badge.textContent||'')){badge.textContent='● Error núcleo';badge.style.color='#fca5a5'};setNotice('El núcleo del mapa no inició. Pulsa “Cargar central” o recarga la página. Las mejoras avanzadas no bloquearán el arranque.','error');return}setTimeout(tick,120)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(tick,40),{once:true});else setTimeout(tick,40);
})();
