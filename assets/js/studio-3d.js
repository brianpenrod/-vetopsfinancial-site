/* Preview-only enhancement: approved imagery remains the HTML foundation. */
const stage=document.querySelector('[data-vs-stage]');
if(stage){
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),small=matchMedia('(max-width: 640px)');
 const canvas=stage.querySelector('canvas'),controls=stage.querySelector('[data-vs-controls]');
 const play=stage.querySelector('[data-vs-play]'),reset=stage.querySelector('[data-vs-reset]'),staticButton=stage.querySelector('[data-vs-static]');
 const status=stage.querySelector('[data-vs-status]'),load=stage.querySelector('[data-vs-load]');
 let renderer=null,raf=0,last=0,t=0,visible=true,automatic=false,userPaused=false,mode='static',loading=false;
 let x=-.12,y=.3,lx=0,ly=0,drag=null;
 const controller=new AbortController();
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const cancel=()=>{cancelAnimationFrame(raf);raf=0;last=0;};
 const draw=()=>{if(mode!=='ready'||!renderer)return;try{renderer.draw(x,y,lx,ly);stage.dataset.rotationX=x.toFixed(4);stage.dataset.rotationY=y.toFixed(4);stage.dataset.frames=String(renderer.frames);}catch{fallback('3D is unavailable here. The approved image is shown.');}};
 const update=()=>{play.textContent=automatic?'Pause motion':'Play motion';play.setAttribute('aria-pressed',String(automatic));stage.dataset.automatic=String(automatic);};
 const tick=time=>{raf=0;if(mode!=='ready'||!automatic||!visible||document.hidden||motion.matches)return;
  if(!last||time-last>=32){const dt=last?Math.min((time-last)/1000,.05):0;last=time;t+=dt;
   if(!drag){y=.3+Math.sin(t*.32)*.12;x=-.12+Math.sin(t*.23)*.025;draw();}}
  if(mode==='ready')raf=requestAnimationFrame(tick);};
 const schedule=()=>{cancel();if(mode==='ready'&&automatic&&visible&&!document.hidden&&!motion.matches)raf=requestAnimationFrame(tick);};
 function fallback(message){cancel();resizeObserver?.disconnect();automatic=false;mode='static';stage.dataset.state='static';canvas.hidden=true;controls.hidden=true;load.hidden=false;load.textContent='Try interactive 3D';status.textContent=message;renderer?.dispose();renderer=null;update();}
 const stop=()=>{userPaused=true;automatic=false;cancel();update();};
 async function start(manual=false){
  if(loading||mode==='ready')return;loading=true;stage.dataset.state='loading';status.textContent='Loading the interactive emblem…';load.disabled=true;
  try{
   const {createRenderer}=await import('./vs-renderer.js');renderer=await createRenderer(canvas,controller.signal);
   mode='ready';stage.dataset.state='ready';canvas.hidden=false;controls.hidden=false;load.hidden=true;
   const resize=()=>{if(mode!=='ready')return;const r=stage.getBoundingClientRect();const dpr=Math.min(devicePixelRatio,small.matches?1.25:1.5);renderer.resize(r.width,r.height,dpr);stage.dataset.pixelRatio=String(dpr);draw();};
   resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);resize();
   automatic=!motion.matches&&!small.matches&&!navigator.connection?.saveData&&!userPaused;
   status.textContent=motion.matches?'Static 3D view. Use arrow keys or horizontal drag to explore.':'Drag horizontally to turn. Arrow keys also work.';
   stage.dataset.triangles=String(renderer.triangles);stage.dataset.meshBytes=String(renderer.bytes);update();schedule();
   if(manual)canvas.focus({preventScroll:true});
  }catch{fallback('3D is unavailable here. The approved image is shown.');}
  finally{loading=false;load.disabled=false;}
 }
 let resizeObserver=null;
 load.hidden=false;load.addEventListener('click',()=>start(true));
 play.addEventListener('click',()=>{if(motion.matches){status.textContent='Motion is off to respect your reduced-motion setting. Drag or use arrow keys to explore.';return;}
  automatic=!automatic;userPaused=!automatic;update();schedule();});
 reset.addEventListener('click',()=>{stop();x=-.12;y=.3;lx=ly=0;t=0;draw();status.textContent='View reset.';});
 staticButton.addEventListener('click',()=>{resizeObserver?.disconnect();fallback('Approved image shown.');load.focus({preventScroll:true});});
 canvas.addEventListener('pointerdown',event=>{if(event.button!==0||mode!=='ready')return;stop();drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,x,y,touch:event.pointerType==='touch',claimed:false};if(!drag.touch){canvas.setPointerCapture(event.pointerId);drag.claimed=true;}canvas.focus({preventScroll:true});});
 canvas.addEventListener('pointermove',event=>{if(mode!=='ready')return;const rect=canvas.getBoundingClientRect();
  if(drag&&drag.id===event.pointerId){const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
   if(drag.touch&&!drag.claimed){if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8){drag=null;return;}if(Math.abs(dx)<8)return;drag.claimed=true;canvas.setPointerCapture(event.pointerId);}
   y=clamp(drag.y+dx*.006,-.72,.9);x=clamp(drag.x+(drag.touch?0:dy*.004),-.32,.32);
  }else if(event.pointerType==='mouse'&&!motion.matches){lx=(event.clientX-rect.left)/rect.width*2-1;ly=1-(event.clientY-rect.top)/rect.height*2;}
  draw();
 });
 const finish=event=>{if(drag?.id===event.pointerId)drag=null;};
 ['pointerup','pointercancel','lostpointercapture'].forEach(name=>canvas.addEventListener(name,finish));
 canvas.addEventListener('keydown',event=>{const direction={ArrowLeft:[0,-.1],ArrowRight:[0,.1],ArrowUp:[-.07,0],ArrowDown:[.07,0]}[event.key];
  if(!direction&&event.key!=='Home'&&event.key!==' ')return;event.preventDefault();
  if(event.key===' '){play.click();return;}stop();if(event.key==='Home'){x=-.12;y=.3;}else{x=clamp(x+direction[0],-.32,.32);y=clamp(y+direction[1],-.72,.9);}draw();});
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();resizeObserver?.disconnect();fallback('3D paused because the graphics context was lost. The approved image is shown.');});
 motion.addEventListener('change',()=>{if(motion.matches){stop();status.textContent='Motion is off to respect your reduced-motion setting.';}draw();});
 small.addEventListener('change',()=>{if(small.matches)stop();});
 document.addEventListener('visibilitychange',schedule);
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;stage.dataset.visible=String(visible);schedule();},{threshold:.05}).observe(stage);
 window.addEventListener('pagehide',()=>{cancel();controller.abort();resizeObserver?.disconnect();renderer?.dispose();});
 if(!navigator.connection?.saveData)start();
 else status.textContent='Data saver is on. Load interactive 3D when you choose.';
}
