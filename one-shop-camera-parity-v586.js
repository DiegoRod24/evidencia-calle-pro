"use strict";
/* ONE SHOP v5.8.6 · Preview = Evidencia */
(function(){
  if(window.ONE_SHOP_CAMERA_PARITY_586)return;
  window.ONE_SHOP_CAMERA_PARITY_586=true;
  const BUILD='one-shop-v5.8.6-preview-parity-01';

  const normAngle=value=>{
    let n=Number(value);if(!Number.isFinite(n))n=0;
    n=((n%360)+360)%360;
    return [0,90,180,270].reduce((a,b)=>Math.abs(b-n)<Math.abs(a-n)?b:a,0);
  };
  const physicalAngle=()=>typeof Sensors?.screenAngle==='function'?Sensors.screenAngle():normAngle(screen.orientation?.angle??window.orientation??0);

  function drawRotated(source,sw,sh,deg){
    const out=document.createElement('canvas'),ctx=out.getContext('2d',{alpha:false});
    if(Math.abs(deg)===90){
      out.width=sh;out.height=sw;
      ctx.save();
      if(deg===90){ctx.translate(out.width,0);ctx.rotate(Math.PI/2);}
      else{ctx.translate(0,out.height);ctx.rotate(-Math.PI/2);}
      ctx.drawImage(source,0,0,sw,sh);ctx.restore();
    }else if(deg===180){
      out.width=sw;out.height=sh;ctx.save();ctx.translate(out.width,out.height);ctx.rotate(Math.PI);ctx.drawImage(source,0,0,sw,sh);ctx.restore();
    }else{
      out.width=sw;out.height=sh;ctx.drawImage(source,0,0,sw,sh);
    }
    return out;
  }

  try{
    Camera.captureFrame=async function(orientationKey=State.smartOrientation||'portrait'){
      const v=$('video'),c=$('captureCanvas'),ctx=c.getContext('2d',{alpha:false});
      if(State.cameraStatus!=='active'||!v.videoWidth||!v.videoHeight)return null;

      // Espera un frame presentado: la evidencia sale del mismo stream que ve el operador.
      try{await new Promise(resolve=>{if(typeof v.requestVideoFrameCallback==='function')v.requestVideoFrameCallback(()=>resolve());else requestAnimationFrame(()=>resolve());setTimeout(resolve,180);});}catch(_){}

      const key=String(orientationKey||'portrait');
      const targetLandscape=key.startsWith('landscape');
      const quality=State.settings.quality==='medium'?.86:.94;
      const digital=Math.max(1,Number(State.digitalZoomScale||1));
      const cameraFacing=Camera.detectFacing(),front=cameraFacing==='front';
      const sourceW=v.videoWidth,sourceH=v.videoHeight;
      const sourceLandscape=sourceW>=sourceH;
      const angle=physicalAngle();

      // Regla principal: si el frame del VIDEO ya tiene la misma orientación que la
      // posición física elegida, NO se rota. Evita la doble rotación EXIF/ImageCapture.
      let rotateDeg=0;
      if(targetLandscape!==sourceLandscape){
        if(angle===90)rotateDeg=90;
        else if(angle===270)rotateDeg=-90;
        else rotateDeg=key==='landscape-left'?-90:90;
      }

      const normalized=drawRotated(v,sourceW,sourceH,rotateDeg);
      const stage=$('cameraStage'),rect=stage?.getBoundingClientRect?.();
      let targetAspect=targetLandscape?16/9:9/16;
      if(rect&&rect.width>30&&rect.height>30){
        const visualAspect=rect.width/rect.height;
        if((visualAspect>=1)===targetLandscape)targetAspect=visualAspect;
      }

      let sx=0,sy=0,sw=normalized.width,sh=normalized.height;
      if(digital>1.001){sw/=digital;sh/=digital;sx=(normalized.width-sw)/2;sy=(normalized.height-sh)/2;}
      const currentAspect=sw/sh;
      if(currentAspect>targetAspect){const nw=sh*targetAspect;sx+=(sw-nw)/2;sw=nw;}
      else if(currentAspect<targetAspect){const nh=sw/targetAspect;sy+=(sh-nh)/2;sh=nh;}

      const longSide=Math.min(2560,Math.max(normalized.width,normalized.height));
      if(targetLandscape){c.width=longSide;c.height=Math.max(1,Math.round(longSide/targetAspect));}
      else{c.height=longSide;c.width=Math.max(1,Math.round(longSide*targetAspect));}
      ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,c.width,c.height);
      ctx.drawImage(normalized,sx,sy,sw,sh,0,0,c.width,c.height);

      return{
        dataUrl:c.toDataURL('image/jpeg',quality),width:c.width,height:c.height,aspect:c.width/c.height,
        orientationKey:key,orientationSide:key==='landscape-left'?'left':key==='landscape-right'?'right':'',
        orientationMode:State.settings.orientationMode||'auto',capturePipeline:'video-preview-parity-v586',
        cameraFacing,previewMirrored:front,frontCorrectionApplied:0,sourceFrameWidth:sourceW,sourceFrameHeight:sourceH,
        rotationApplied:rotateDeg,screenAngle:angle
      };
    };
  }catch(e){console.warn('ONE SHOP camera parity',e);}

  // Registro de diagnóstico por evidencia para poder auditar cualquier equipo problemático.
  try{
    const baseMake=Evidence.make.bind(Evidence);
    Evidence.make=function(frame,gps,meta,captured){
      const r=baseMake(frame,gps,meta,captured);
      r.capturePipeline=frame?.capturePipeline||r.capturePipeline;
      r.captureRotationApplied=Number(frame?.rotationApplied||0);
      r.captureScreenAngle=Number(frame?.screenAngle??physicalAngle());
      r.previewParityBuild=BUILD;
      return r;
    };
  }catch(_){}

  try{localStorage.setItem('oneshotRuntimeBuild',BUILD);}catch(_){}
  console.info('[ONE SHOP] v5.8.6 Preview = Evidencia activo');
})();