"use strict";
(()=>{
const BUILD="one-shot-v5.9.7-party-fallback";
const PARTIES=["ALIANZA PARA EL PROGRESO","FUERZA POPULAR","PARTIDO MORADO","SOMOS PERÚ","RENOVACIÓN POPULAR","ACCIÓN POPULAR","AVANZA PAÍS","FE EN EL PERÚ","FRENTE DE LA ESPERANZA 2021","PARTIDO POPULAR CRISTIANO","PODEMOS PERÚ","PERÚ LIBRE","JUNTOS POR EL PERÚ","AHORA NACIÓN","PAÍS PARA TODOS","FUERZA MODERNA","BATALLA PERÚ","PERÚ PRIMERO","PRIN","PERÚ ACCIÓN","INTEGRIDAD DEMOCRÁTICA","COOPERACIÓN POPULAR","TODO CON EL PUEBLO","PUEBLO CONSCIENTE","ADP"];
window.ONE_SHOT_DATA=window.ONE_SHOT_DATA||{parties:[],candidates:[]};
const seen=new Set((window.ONE_SHOT_DATA.parties||[]).map(x=>String(x).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase()));
for(const p of PARTIES){const k=p.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase();if(!seen.has(k)){window.ONE_SHOT_DATA.parties.push(p);seen.add(k)}}
try{localStorage.setItem("oneshotPartyFallbackBuild",BUILD)}catch(_){}
console.info("[ONE SHOT]",BUILD,window.ONE_SHOT_DATA.parties.length,"partidos fallback");
})();