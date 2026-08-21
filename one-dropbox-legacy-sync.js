"use strict";

(() => {
  const CONFIG_KEY = "oneshotLegacyCloudSync_v2";
  const API_BASE = "https://one-shot-2.pages.dev";
  const MEDIA_KEYS = [
    "image","imageOriginal","originalImage","original","photo","photoData","dataUrl","imageData","base64Image","snapshot","captureImage",
    "rescuedImage","stampedImage","evidenceImage","watermarkedImage","markedImage","imageMarked"
  ];
  const ORIGINAL_PRIORITY = ["imageOriginal","originalImage","original","image","photo","photoData","dataUrl","imageData","base64Image","snapshot","captureImage"];
  const STAMPED_PRIORITY = ["rescuedImage","stampedImage","evidenceImage","watermarkedImage","markedImage","imageMarked","image"];
  const MEDIA_SET = new Set(MEDIA_KEYS);

  const Bridge = {
    running: false,
    key: "",
    diagnostics: [],
    selectedIds: new Set(),

    load(){ try{this.key=JSON.parse(localStorage.getItem(CONFIG_KEY)||"{}").syncKey||""}catch(_){} },
    save(key){this.key=String(key||"").trim();localStorage.setItem(CONFIG_KEY,JSON.stringify({syncKey:this.key}));},
    auth(){return this.key?{authorization:`Bearer ${this.key}`}:{}} ,
    esc(v){return String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));},
    gpsStatus(r,atCapture=null){if(!r?.gps||!Number.isFinite(Number(r.gps.latitude))||!Number.isFinite(Number(r.gps.longitude)))return"SIN_GPS";if(r.gpsStatus==="GPS_CORREGIDO")return"GPS_CORREGIDO";if(r.gpsStatus==="GPS_RECUPERADO")return"GPS_RECUPERADO";if(atCapture===false)return"GPS_RECUPERADO";const c=Date.parse(r.createdAt||""),g=Number(r.gpsCapturedAt||r.gps?.timestamp||0);return Number.isFinite(c)&&g&&Math.abs(g-c)>30000?"GPS_RECUPERADO":"GPS_CAPTURA";},

    metadata(r,diag=null){
      const out={};
      for(const[k,v]of Object.entries(r||{})){if(MEDIA_SET.has(k)||typeof v==="function")continue;out[k]=v;}
      out.sourceApp="evidencia-calle-pro";
      out.sourceVersion=typeof VERSION!=="undefined"?VERSION:"legacy";
      out.gpsStatus=this.gpsStatus(r);
      out.cloudSyncStatus="SYNCED";
      if(diag){
        out.legacyRecovery={
          version:"phase1-v1",
          status:diag.status,
          originalField:diag.original?.field||"",
          stampedField:diag.stamped?.field||"",
          originalWidth:diag.original?.width||0,
          originalHeight:diag.original?.height||0,
          originalBytes:diag.original?.bytes||0,
          stampedWidth:diag.stamped?.width||0,
          stampedHeight:diag.stamped?.height||0,
          stampedBytes:diag.stamped?.bytes||0,
          suspiciousDark:Boolean(diag.original?.suspiciousDark),
          analyzedAt:diag.analyzedAt
        };
      }
      return out;
    },

    async valueToDataUrl(value){
      if(!value)return"";
      if(typeof value==="string"){
        const s=value.trim();
        if(/^data:image\//i.test(s))return s;
        return"";
      }
      if(value instanceof Blob){
        return await new Promise((resolve,reject)=>{const rd=new FileReader();rd.onload=()=>resolve(String(rd.result||""));rd.onerror=reject;rd.readAsDataURL(value);});
      }
      if(typeof value==="object"){
        for(const key of ["dataUrl","image","src","value","data"]){
          if(value[key]&&value[key]!==value){const found=await this.valueToDataUrl(value[key]);if(found)return found;}
        }
      }
      return"";
    },

    async inspectDataUrl(dataUrl,field,role){
      if(!/^data:image\//i.test(String(dataUrl||"")))return null;
      const comma=dataUrl.indexOf(",");
      if(comma<0)return null;
      const head=dataUrl.slice(0,comma),body=dataUrl.slice(comma+1);
      let bytes=0;
      try{bytes=/;base64/i.test(head)?Math.floor(body.length*3/4):decodeURIComponent(body).length;}catch(_){return null;}
      if(bytes<512)return null;
      const info=await new Promise(resolve=>{
        const img=new Image();
        const timer=setTimeout(()=>resolve(null),4500);
        img.onload=()=>{clearTimeout(timer);resolve({width:img.naturalWidth||0,height:img.naturalHeight||0,img});};
        img.onerror=()=>{clearTimeout(timer);resolve(null);};
        img.src=dataUrl;
      });
      if(!info||info.width<32||info.height<32)return null;
      let suspiciousDark=false;
      try{
        const c=document.createElement("canvas"),w=24,h=24;c.width=w;c.height=h;
        const ctx=c.getContext("2d",{willReadFrequently:true});ctx.drawImage(info.img,0,0,w,h);
        const px=ctx.getImageData(0,0,w,h).data;let lum=0,opaque=0;
        for(let i=0;i<px.length;i+=4){if(px[i+3]<20)continue;opaque++;lum+=(px[i]+px[i+1]+px[i+2])/3;}
        suspiciousDark=opaque>0&&(lum/opaque)<4;
      }catch(_){}
      const priority=(role==="original"?ORIGINAL_PRIORITY:STAMPED_PRIORITY).indexOf(field);
      const pixels=info.width*info.height;
      const score=(priority<0?0:Math.max(0,150-priority*12))+Math.min(200,Math.log10(Math.max(10,pixels))*30)+Math.min(120,Math.log10(Math.max(10,bytes))*18)-(suspiciousDark?25:0);
      return{field,role,dataUrl,width:info.width,height:info.height,bytes,pixels,suspiciousDark,score};
    },

    collectFields(record){
      const out=[];
      for(const field of MEDIA_KEYS)if(record?.[field])out.push([field,record[field]]);
      for(const parentKey of ["media","evidenceMedia","photoMedia","legacyMedia","backup"]){
        const parent=record?.[parentKey];if(!parent||typeof parent!=="object")continue;
        for(const field of MEDIA_KEYS)if(parent[field])out.push([`${parentKey}.${field}`,parent[field]]);
      }
      return out;
    },

    baseField(path){return String(path||"").split(".").pop();},

    async analyzeRecord(record){
      const unique=new Map();
      for(const[field,value]of this.collectFields(record)){
        try{const dataUrl=await this.valueToDataUrl(value);if(dataUrl&&!unique.has(dataUrl))unique.set(dataUrl,{field,dataUrl});}catch(_){}
      }
      const originals=[],stamped=[];
      for(const item of unique.values()){
        const base=this.baseField(item.field);
        const o=await this.inspectDataUrl(item.dataUrl,item.field,"original");
        if(o&&(ORIGINAL_PRIORITY.includes(base)||base==="image"))originals.push(o);
        const s=await this.inspectDataUrl(item.dataUrl,item.field,"stamped");
        if(s&&(STAMPED_PRIORITY.includes(base)||base==="image"))stamped.push(s);
      }
      originals.sort((a,b)=>b.score-a.score);stamped.sort((a,b)=>b.score-a.score);
      const original=originals[0]||null,marked=stamped[0]||null;
      let status="BROKEN";
      if(original&&marked)status=original.field==="image"?"ORIGINAL_OK":"RECOVERED";
      else if(original)status=original.field==="image"?"ORIGINAL_OK":"RECOVERED";
      else if(marked)status="STAMPED_ONLY";
      const diag={
        id:record?.id||"",photoCode:record?.photoCode||record?.id||"Sin código",createdAt:record?.createdAt||"",gpsStatus:this.gpsStatus(record),status,
        original,stamped:marked,record,analyzedAt:new Date().toISOString(),candidateCount:unique.size
      };
      return diag;
    },

    async analyzeAll(){
      if(this.running)return;
      this.running=true;this.diagnostics=[];this.selectedIds.clear();
      const rows=[...(State.records||[])];const p=document.getElementById("legacyCloudProgress");
      try{
        for(let i=0;i<rows.length;i++){
          if(p)p.textContent=`Analizando ${i+1}/${rows.length} · buscando originales y copias legacy…`;
          this.diagnostics.push(await this.analyzeRecord(rows[i]));
          if(i%4===0)this.renderDiagnostics();
        }
      }finally{
        this.running=false;this.renderDiagnostics();this.paint();
        if(p)p.textContent=`Diagnóstico listo · ${rows.length} evidencias revisadas. Selecciona 5–10 para la prueba.`;
      }
    },

    summary(){
      return this.diagnostics.reduce((a,d)=>{a.total++;a[d.status]=(a[d.status]||0)+1;if(d.gpsStatus==="SIN_GPS")a.noGps++;return a;},{total:0,ORIGINAL_OK:0,RECOVERED:0,STAMPED_ONLY:0,BROKEN:0,noGps:0});
    },

    renderDiagnostics(){
      const box=document.getElementById("legacyDiagList"),sum=document.getElementById("legacyDiagSummary");if(!box||!sum)return;
      const s=this.summary();
      sum.innerHTML=`<span>🟢 ${s.ORIGINAL_OK} originales</span><span>🟡 ${s.RECOVERED} recuperadas</span><span>🟠 ${s.STAMPED_ONLY} solo marcada</span><span>🔴 ${s.BROKEN} dañadas</span><span>📍 ${s.noGps} sin GPS</span>`;
      box.innerHTML=this.diagnostics.slice(0,250).map(d=>{
        const best=d.original||d.stamped;const tone=d.status==="ORIGINAL_OK"?"ok":d.status==="RECOVERED"?"warn":d.status==="STAMPED_ONLY"?"orange":"bad";
        const label=d.status==="ORIGINAL_OK"?"ORIGINAL OK":d.status==="RECOVERED"?"RECUPERADA":d.status==="STAMPED_ONLY"?"SOLO MARCADA":"NO RECUPERABLE";
        const checked=this.selectedIds.has(d.id)?"checked":"";const disabled=d.status==="BROKEN"?"disabled":"";
        return `<article class="legacyDiagItem ${tone}"><label class="legacyDiagCheck"><input type="checkbox" data-legacy-select="${this.esc(d.id)}" ${checked} ${disabled}></label><div class="legacyDiagThumb">${best?`<img src="${best.dataUrl}" alt="">`:'<span>×</span>'}</div><div class="legacyDiagInfo"><b>${this.esc(d.photoCode)}</b><small>${this.esc(d.createdAt||"")} · ${this.esc(d.gpsStatus.replaceAll("_"," "))}</small><strong>${label}</strong><em>${best?`${best.width}×${best.height} · ${Math.round(best.bytes/1024)} KB · ${this.esc(best.field)}`:"Sin bytes de imagen válidos"}${best?.suspiciousDark?" · imagen muy oscura":""}</em></div></article>`;
      }).join("");
      box.querySelectorAll("[data-legacy-select]").forEach(el=>el.onchange=()=>{if(el.checked)this.selectedIds.add(el.dataset.legacySelect);else this.selectedIds.delete(el.dataset.legacySelect);this.paintSelected();});
      this.paintSelected();
    },

    paintSelected(){const el=document.getElementById("legacySelectedCount");if(el)el.textContent=`${this.selectedIds.size} seleccionadas para prueba`;},
    selectSample(limit=10){this.selectedIds.clear();for(const d of this.diagnostics){if(d.status!=="BROKEN"){this.selectedIds.add(d.id);if(this.selectedIds.size>=limit)break;}}this.renderDiagnostics();},

    file(dataUrl,name){const m=String(dataUrl||"").match(/^data:([^;,]+)?(;base64)?,(.*)$/s);if(!m)return null;const type=m[1]||"image/jpeg",raw=m[2]?atob(m[3]):decodeURIComponent(m[3]),a=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)a[i]=raw.charCodeAt(i);return new File([a],name,{type});},

    async syncDiagnostic(diag,force=true){
      const r=diag?.record;if(!r?.id||!this.key)return false;
      if(diag.status==="BROKEN")throw new Error("Evidencia sin imagen recuperable");
      if(!navigator.onLine){r.cloudSyncStatus="PENDING";await Store.save(r).catch(()=>{});return false;}
      if(!force&&r.cloudSyncStatus==="SYNCED"&&r.cloudSyncedLocalAt&&Date.parse(r.updatedAt||r.createdAt||0)<=Date.parse(r.cloudSyncedLocalAt||0))return true;
      const originalData=diag.original?.dataUrl||diag.stamped?.dataUrl||"";
      const stampedData=diag.stamped?.dataUrl||diag.original?.dataUrl||"";
      const original=this.file(originalData,"original.jpg"),stamped=this.file(stampedData,"evidencia.jpg");
      if(!original)throw new Error("No se pudo construir archivo original");
      r.cloudSyncStatus="SYNCING";await Store.save(r).catch(()=>{});
      try{
        const form=new FormData();form.set("metadata",JSON.stringify(this.metadata(r,diag)));form.set("original",original);if(stamped)form.set("stamped",stamped);
        const res=await fetch(`${API_BASE}/api/dropbox/upload`,{method:"POST",headers:this.auth(),body:form});const data=await res.json().catch(()=>({}));if(!res.ok||data.ok===false)throw new Error(data.message||`HTTP ${res.status}`);
        r.cloudSyncStatus="SYNCED";r.cloudSyncedLocalAt=new Date().toISOString();r.cloudSyncError="";r.cloud=data;
        r.legacyRecoveryStatus=diag.status;r.legacyRecoveryOriginalField=diag.original?.field||"";r.legacyRecoveryStampedField=diag.stamped?.field||"";
        await Store.save(r);return true;
      }catch(e){r.cloudSyncStatus="ERROR";r.cloudSyncError=e.message||String(e);await Store.save(r).catch(()=>{});throw e;}
    },

    async syncSelected(){
      if(this.running)return;if(!this.key)return this.open("Primero guarda la clave de sincronización.");if(!this.diagnostics.length)return this.analyzeAll();
      const selected=this.diagnostics.filter(d=>this.selectedIds.has(d.id));if(!selected.length)return this.setProgress("Selecciona entre 5 y 10 evidencias para la prueba.");
      if(selected.length>10)return this.setProgress("Para la primera prueba usa máximo 10 evidencias.");
      this.running=true;let ok=0,err=0;
      try{for(let i=0;i<selected.length;i++){this.setProgress(`Prueba ${i+1}/${selected.length} · OK ${ok} · error ${err}`);try{if(await this.syncDiagnostic(selected[i],true))ok++;}catch(_){err++;}}}
      finally{this.running=false;this.setProgress(`Prueba terminada · ${ok} sincronizadas · ${err} con error. Ahora revísalas en ONE SHOT 2.`);this.paint();}
    },

    async syncSafeAll(){
      if(!confirm("Esto sincronizará todas las evidencias recuperables. Recomendado solo después de validar la prueba de 5–10 en ONE SHOT 2. ¿Continuar?"))return;
      if(this.running)return;if(!this.key)return this.open("Primero guarda la clave de sincronización.");if(!this.diagnostics.length)await this.analyzeAll();
      const rows=this.diagnostics.filter(d=>d.status!=="BROKEN");this.running=true;let ok=0,err=0;
      try{for(let i=0;i<rows.length;i++){this.setProgress(`Migración segura ${i+1}/${rows.length} · OK ${ok} · error ${err}`);try{if(await this.syncDiagnostic(rows[i],false))ok++;}catch(_){err++;}}}
      finally{this.running=false;this.setProgress(`Migración terminada · ${ok} sincronizadas · ${err} con error · ${this.summary().BROKEN} no recuperables.`);this.paint();}
    },

    setProgress(text){const p=document.getElementById("legacyCloudProgress");if(p)p.textContent=text;},
    stats(){return(State.records||[]).reduce((a,r)=>{a.total++;const s=r.cloudSyncStatus||"PENDING";if(s==="SYNCED")a.synced++;else if(s==="ERROR")a.error++;else a.pending++;const g=this.gpsStatus(r);if(g==="SIN_GPS")a.noGps++;else a.withGps++;return a;},{total:0,synced:0,pending:0,error:0,noGps:0,withGps:0});},
    paint(){const s=this.stats(),b=document.getElementById("legacyCloudBtn");if(b)b.textContent=s.error?`☁ ${s.error} error`:s.pending?`☁ ${s.pending} pendientes`:`☁ ${s.synced} OK`;const st=document.getElementById("legacyCloudStats");if(st)st.textContent=`${s.total} registros · ${s.synced} sincronizados · ${s.pending} pendientes · ${s.noGps} sin GPS`;},

    open(msg=""){let m=document.getElementById("legacyCloudModal");if(!m)m=this.build();m.classList.add("open");m.querySelector("#legacyCloudKey").value=this.key||"";this.setProgress(msg||"Fase 1: primero diagnostica. No se subirá nada hasta que selecciones la muestra.");this.paint();if(this.diagnostics.length)this.renderDiagnostics();},
    build(){
      const m=document.createElement("div");m.id="legacyCloudModal";m.className="legacyCloudModal";
      m.innerHTML=`<div class="legacyCloudCard"><header><div><b>🛟 Fase 1 · Rescate seguro</b><small>Evidencia Calle Pro → ONE SHOT 2 · no borra nada del celular</small></div><button id="legacyCloudClose">×</button></header><div id="legacyCloudStats" class="legacyCloudStats"></div><label>Clave de sincronización<input id="legacyCloudKey" type="password" placeholder="ONE_SHOT_SYNC_KEY"></label><div class="legacyCloudActions"><button id="legacyCloudSave">Guardar clave</button><button id="legacyAnalyze" class="primary">1 · Analizar fotos</button><button id="legacySample">2 · Seleccionar 10 seguras</button><button id="legacySyncSelected" class="primary">3 · Sincronizar muestra</button><button id="legacySyncSafe">Migrar todas las recuperables</button></div><div id="legacyDiagSummary" class="legacyDiagSummary"></div><div id="legacySelectedCount" class="legacySelectedCount">0 seleccionadas para prueba</div><div id="legacyCloudProgress" class="legacyCloudProgress"></div><div id="legacyDiagList" class="legacyDiagList"></div><p class="legacyCloudNote"><b>Regla:</b> ORIGINAL OK y RECUPERADA son aptas. SOLO MARCADA se conserva pero queda señalada. NO RECUPERABLE no se sube automáticamente. Las fotos sin GPS se respaldan, pero siguen como evidencia incompleta.</p></div>`;
      document.body.appendChild(m);
      m.querySelector("#legacyCloudClose").onclick=()=>m.classList.remove("open");m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("open")});
      m.querySelector("#legacyCloudSave").onclick=()=>{this.save(m.querySelector("#legacyCloudKey").value);this.setProgress("Clave guardada solo en este dispositivo.");};
      m.querySelector("#legacyAnalyze").onclick=()=>this.analyzeAll();m.querySelector("#legacySample").onclick=()=>this.selectSample(10);m.querySelector("#legacySyncSelected").onclick=()=>this.syncSelected();m.querySelector("#legacySyncSafe").onclick=()=>this.syncSafeAll();
      return m;
    },

    install(){if(document.getElementById("legacyCloudBtn"))return;const b=document.createElement("button");b.id="legacyCloudBtn";b.className="chipButton legacyCloudBtn";b.title="Rescatar y sincronizar evidencias hacia ONE SHOT 2";b.textContent="🛟";b.onclick=()=>this.open();(document.querySelector(".topChips")||document.querySelector("header")||document.body).appendChild(b);this.paint();},
    patch(){if(typeof Evidence==="undefined"||Evidence.__legacyCloudPatched)return;Evidence.__legacyCloudPatched=true;const make=Evidence.make?.bind(Evidence);if(make)Evidence.make=(...args)=>{const r=make(...args);r.gpsStatus=this.gpsStatus(r,Boolean(args[1]));r.cloudSyncStatus="PENDING";r.sourceApp="evidencia-calle-pro";return r;};const finalize=Evidence.finalize?.bind(Evidence);if(finalize)Evidence.finalize=async r=>{const had=Boolean(r?.gps),result=await finalize(r);if(r){r.gpsStatus=had?"GPS_CAPTURA":(r.gps?"GPS_RECUPERADO":"SIN_GPS");r.cloudSyncStatus=r.cloudSyncStatus==="SYNCED"?"SYNCED":"PENDING";await Store.save(r).catch(()=>{});}this.paint();return result;};},
    init(){this.load();this.patch();this.install();setTimeout(()=>this.patch(),1200);}
  };

  window.OneShotLegacyCloud=Bridge;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>Bridge.init(),{once:true});else Bridge.init();
})();
