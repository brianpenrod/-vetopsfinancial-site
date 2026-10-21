import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {clampReveal,interpolateReveal,ease,componentInfo} from './model-state.js';
import {createWatermark} from './watermark.js';
import {rotationRates,advancePhase,approachSpeed} from './motion.js';
import {lightStudio,finishMetal} from './studio-lighting.js';
import {openingAt,OPENING_DURATION,componentReveal} from './presentation.js';
import {buildShowroom} from './showroom.js';

const $=id=>document.getElementById(id);
const stage=$('stage'),loading=$('loading'),poster=$('poster'),range=$('reveal-range');
const partButtons=[...document.querySelectorAll('[data-part]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion=reduced.matches||$('reduce-motion').checked;
$('reduce-motion').checked=reduceMotion;
let renderer,scene,camera,orbit,model,groups=[],meshList=[],selected=null,reveal=0,revealTween=null,cameraTween=null,ready=false,inView=true,needsRender=true;
let watermark,lighting,rotors=[],motionRunning=!reduceMotion,motionSpeed=1,motionVelocity=0,motionPhase=0,lastFrame=null,opening=null;
let homeDirection=new THREE.Vector3(-.53,.23,.82).normalize(),fullBox=new THREE.Box3(),homeBox=new THREE.Box3();
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const defaultDetail={label:'THE COMPLETE ASSEMBLY',title:'See how it comes together.',copy:'Reveal the layers, then choose a component to bring its construction into focus.'};

const filmDialog=$('film-dialog');
let showroom,journey=Number(document.body.dataset.journey||0),journeyDirty=false,simpleView=false;
document.addEventListener('studio:journey',e=>{if(Math.abs(journey-e.detail.value)>.0005){journey=e.detail.value;journeyDirty=true;}});
document.addEventListener('studio:film',e=>showroom?.setFilm(e.detail));
document.addEventListener('studio:website',e=>showroom?.setWebsite(e.detail));
document.addEventListener('studio:simple',e=>{simpleView=e.detail;needsRender=true;lastFrame=null;});

function fallback(message){
  opening=null;$('opening-progress').hidden=true;
  ready=false;document.body.dataset.sceneFailed='true';$('simple-view').textContent='Retry 3D';document.body.classList.remove('scene-ready');document.body.classList.add('simple');stage.dataset.state='fallback';poster.hidden=false;loading.hidden=false;loading.replaceChildren();
  const text=document.createElement('span');text.textContent=message;loading.append(text);
  const retry=document.createElement('button');retry.textContent='Try 3D again';retry.onclick=()=>{location.href=location.pathname;};loading.append(retry);
  for(const el of [...partButtons,$('reset'),$('reveal'),range,$('clear'),$('motion-toggle'),$('motion-speed'),$('replay-opening')])el.disabled=true;
  $('view-controls').hidden=true;$('gesture').textContent='The film and project contact remain available below.';
  renderer?.domElement.setAttribute('hidden','');
}
function resize(){if(!renderer)return;const w=stage.clientWidth,h=stage.clientHeight;renderer.setPixelRatio(Math.min(devicePixelRatio||1,w<600?1.4:1.75));renderer.setSize(w,h,false);watermark?.resize(w,h);camera.aspect=w/h;camera.setViewOffset(w,h,w>700?-w*.205:0,0,w,h);camera.updateProjectionMatrix();needsRender=true;if(ready&&!opening){if(journey>1.01)journeyDirty=true;else fitSelection(false);}}
function categoryOf(object){for(let p=object;p;p=p.parent)if(p.userData.category)return p.userData.category;return null;}
function applyReveal(value){
  reveal=clampReveal(value);
  for(const group of groups){const local=componentReveal(reveal,group.userData.category);group.position.lerpVectors(group.userData.startPosition,group.userData.endPosition,local);group.quaternion.slerpQuaternions(group.userData.startQuaternion,group.userData.endQuaternion,local);}
  model?.updateMatrixWorld(true);range.value=String(Math.round(reveal*100));$('reveal-value').textContent=`${Math.round(reveal*100)}%`;
  range.setAttribute('aria-valuetext',`${Math.round(reveal*100)} percent revealed`);
  updatePoseLabel();
  $('reveal').innerHTML=reveal>.5?'Reassemble <span aria-hidden="true">↙</span>':'Reveal assembly <span aria-hidden="true">↗</span>';
  stage.dataset.reveal=reveal.toFixed(3);needsRender=true;
}
function animateReveal(target,after){
  if(reduceMotion){applyReveal(target);after?.();return;}
  revealTween={from:reveal,to:target,elapsed:0,duration:2100,after};
}
function cameraFit(box,direction=homeDirection){
  const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  const dir=direction;
  // Project box corners onto the camera plane, avoiding overly distant fit for a long model.
  const right=new THREE.Vector3().crossVectors(camera.up,dir).normalize();
  const up=new THREE.Vector3().crossVectors(dir,right).normalize();
  let halfW=0,halfH=0,depth=0;
  for(const x of [-.5,.5])for(const y of [-.5,.5])for(const z of [-.5,.5]){
    const p=new THREE.Vector3(size.x*x,size.y*y,size.z*z);halfW=Math.max(halfW,Math.abs(p.dot(right)));halfH=Math.max(halfH,Math.abs(p.dot(up)));depth=Math.max(depth,Math.abs(p.dot(dir)));
  }
  const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  const distance=Math.max(halfH/tan,halfW/(tan*camera.aspect*(stage.clientWidth>700?.57:.95)))*1.17+depth*.65;
  const position=center.clone().addScaledVector(dir,Math.max(distance * .86,2.0));
  return {position,center};
}
function fitBox(box,animate=true,direction=homeDirection){
  if(box.isEmpty())return;
  const {position,center}=cameraFit(box,direction);
  orbit.minDistance=2;orbit.maxDistance=40;
  if(!animate||reduceMotion){camera.position.copy(position);orbit.target.copy(center);orbit.update();needsRender=true;cameraTween=null;return;}
  cameraTween={from:camera.position.clone(),to:position,targetFrom:orbit.target.clone(),targetTo:center,elapsed:0,duration:900};
}
function fitSelection(animate=true){
  if(!selected){fitBox(reveal>.1?fullBox:homeBox,animate);return;}
  const box=new THREE.Box3();for(const group of groups)if(group.userData.category===selected)box.expandByObject(group);
  fitBox(box,animate);
}
function updatePoseLabel(){
  $('pose-label').textContent=selected?componentInfo[selected].title:(reveal<.005?'Assembled':reveal>.995?'Exploded':'Revealing the assembly');
}
function highlight(category){
  selected=category;stage.dataset.selected=category||'all';updatePoseLabel();
  for(const button of partButtons)button.setAttribute('aria-pressed',String(button.dataset.part===category));
  const info=category?componentInfo[category]:defaultDetail;
  $('detail-label').textContent=info.label;$('detail-title').textContent=info.title;$('detail-copy').textContent=info.copy;
  for(const mesh of meshList){const active=!category||categoryOf(mesh)===category;for(const m of (Array.isArray(mesh.material)?mesh.material:[mesh.material])){m.color.copy(m.userData.baseColor);m.roughness=m.userData.baseRoughness;m.envMapIntensity=1;m.emissive.set(active&&category?0x735326:0x000000);m.emissiveIntensity=active&&category?.045:0;if(category&&!active){m.color.multiplyScalar(.36);m.envMapIntensity=.3;m.roughness=Math.max(.5,m.roughness);}}}
  needsRender=true;
}
function inspect(category){
  if(!ready)return;takeControl();highlight(category);
  
  if(reveal<.97){fitBox(fullBox);animateReveal(1,()=>fitSelection());}else fitSelection();
}
function takeControl(){
  journeyDirty=false;
  if(!opening)return;
  opening=null;stage.dataset.opening='interrupted';$('opening-progress').hidden=true;
  $('replay-opening').textContent='Replay opening';$('experience-status').textContent='Your view. Your pace.';
  lighting?.setOpeningLevel(1);updatePoseLabel();
}
function finishOpening(){
  opening=null;stage.dataset.opening='complete';$('opening-progress').hidden=true;
  $('replay-opening').textContent='Replay opening';$('experience-status').textContent='Choose a component. Explore the details.';
  lighting.setOpeningLevel(1);updatePoseLabel();
}
function startOpening(){
  if(!ready)return;
  revealTween=null;cameraTween=null;highlight(null);motionPhase=0;motionVelocity=0;applyMotion();
  motionRunning=!reduceMotion;updateMotion();
  if(reduceMotion){applyReveal(1);fitBox(fullBox,false);finishOpening();return;}
  opening={elapsed:0};stage.dataset.opening='playing';$('opening-progress').hidden=false;
  $('replay-opening').textContent='Skip opening';$('experience-status').textContent='A study in form and motion.';
  applyReveal(0);lastFrame=null;
}
function updateOpening(dt){
  opening.elapsed+=dt;const shot=openingAt(opening.elapsed);
  applyReveal(shot.reveal);
  const entry=cameraFit(homeBox,new THREE.Vector3(-.75,.36,.56).normalize());
  const home=cameraFit(homeBox),wide=cameraFit(fullBox);
  const framing=ease(Math.pow(shot.reveal,.7));
  camera.position.lerpVectors(entry.position,home.position,shot.arrival).lerp(wide.position,framing);
  orbit.target.lerpVectors(home.center,wide.center,framing);
  $('pose-label').textContent=shot.chapter;
  $('opening-progress').style.setProperty('--progress',String(Math.min(1,opening.elapsed/OPENING_DURATION)));
  lighting.setOpeningLevel(shot.arrival);needsRender=true;
  if(shot.done)finishOpening();
}
$('replay-opening').onclick=()=>{if(opening){applyReveal(1);fitBox(fullBox,true);finishOpening();}else startOpening();};
function updateMotion(){
  $('motion-toggle').textContent=motionRunning?'Pause motion':'Start motion';
  $('motion-toggle').setAttribute('aria-pressed',String(motionRunning));
  stage.dataset.motion=motionRunning?'running':'paused';
}
function applyMotion(){for(const {rotor,rate} of rotors)rotor.rotation.x=motionPhase*rate;stage.dataset.motionPhase=motionPhase.toFixed(3);needsRender=true;}
$('motion-toggle').onclick=()=>{takeControl();motionRunning=!motionRunning;motionVelocity=0;lastFrame=null;updateMotion();};
$('motion-speed').oninput=e=>{takeControl();motionSpeed=Number(e.target.value);$('motion-value').textContent=`${motionSpeed}×`;};
function setReducedMotion(value){reduceMotion=value;$('reduce-motion').checked=value;if(value){takeControl();motionRunning=false;motionVelocity=0;if(revealTween){const t=revealTween;revealTween=null;applyReveal(t.to);t.after?.();}if(cameraTween){camera.position.copy(cameraTween.to);orbit.target.copy(cameraTween.targetTo);cameraTween=null;}updateMotion();needsRender=true;}}
$('reduce-motion').onchange=e=>setReducedMotion(e.target.checked);
reduced.addEventListener('change',()=>setReducedMotion(reduced.matches));
function reset(){if(!ready)return;takeControl();motionRunning=false;motionVelocity=0;motionPhase=0;applyMotion();updateMotion();highlight(null);revealTween=null;animateReveal(0);fitBox(homeBox,true,homeDirection);}
for(const button of partButtons)button.addEventListener('click',()=>inspect(button.dataset.part));
$('clear').addEventListener('click',()=>{takeControl();highlight(null);fitBox(reveal>.1?fullBox:homeBox);});
$('reset').addEventListener('click',reset);
$('reveal').addEventListener('click',()=>{takeControl();highlight(null);const target=reveal>.5?0:1;fitBox(target?fullBox:homeBox);animateReveal(target);});
range.addEventListener('input',()=>{if(!ready)return;takeControl();revealTween=null;applyReveal(Number(range.value)/100);if(!selected)fitBox(fullBox,false);});
function rotate(angle){if(!ready)return;takeControl();cameraTween=null;const offset=camera.position.clone().sub(orbit.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),angle);camera.position.copy(orbit.target).add(offset);orbit.update();needsRender=true;}
$('rotate-left').onclick=()=>rotate(-.14);$('rotate-right').onclick=()=>rotate(.14);
function zoom(factor){if(!ready)return;takeControl();cameraTween=null;const d=camera.position.clone().sub(orbit.target);d.multiplyScalar(factor).clampLength(orbit.minDistance,orbit.maxDistance);camera.position.copy(orbit.target).add(d);orbit.update();needsRender=true;}
$('zoom-in').onclick=()=>zoom(.85);$('zoom-out').onclick=()=>zoom(1.18);

async function init(){
  try{
    if(new URLSearchParams(location.search).has('fallback')){fallback('The 3D view is unavailable. You can still watch the film.');return;}
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
    renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Interactive transmission. Use Left and Right arrows to rotate, plus and minus to zoom, Home to reset. Component controls follow below.');
    stage.prepend(renderer.domElement);
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback('The 3D view was interrupted. You can still watch the film.');});
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(34,1,.05,150);watermark=createWatermark();
    orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.dampingFactor=.09;orbit.enablePan=false;orbit.enableZoom=false;
    orbit.minPolarAngle=.35;orbit.maxPolarAngle=Math.PI*.76;orbit.minAzimuthAngle=-1.4;orbit.maxAzimuthAngle=.55;orbit.rotateSpeed=.5;
    orbit.touches.ONE=null;orbit.touches.TWO=null;renderer.domElement.style.touchAction='pan-y';
    if(matchMedia('(pointer:coarse)').matches)$('gesture').textContent='Use the arrow controls to rotate · Tap a part to inspect';
    orbit.addEventListener('change',()=>{needsRender=true;});orbit.addEventListener('start',()=>{takeControl();cameraTween=null;});
    lighting=lightStudio(renderer,scene);
    const draco=new DRACOLoader();draco.setDecoderPath('/assets/after-hours/assets/vendor/three/examples/jsm/libs/draco/gltf/');
    const loader=new GLTFLoader().setDRACOLoader(draco);
    const url=new URLSearchParams(location.search).has('missing-model')?'/assets/after-hours/assets/studio-live/missing.glb':'/assets/after-hours/assets/studio-live/transmission.glb';
    const gltf=await loader.loadAsync(url);draco.dispose();model=gltf.scene;scene.add(model);
    model.traverse(o=>{
      if(o.userData.category&&o.userData.explodePosition){o.userData.startPosition=o.position.clone();o.userData.startQuaternion=o.quaternion.clone();o.userData.endPosition=new THREE.Vector3().fromArray(o.userData.explodePosition);o.userData.endQuaternion=new THREE.Quaternion().fromArray(o.userData.explodeQuaternion);groups.push(o);}
      if(o.isMesh){meshList.push(o);o.material=Array.isArray(o.material)?o.material.map(m=>finishMetal(m.clone())):finishMetal(o.material.clone());}
    });
    if(!groups.length||!meshList.length)throw new Error('The assembly is empty.');
    for(const group of groups){
      const rate=rotationRates[group.name];if(rate===undefined)continue;
      const rotor=new THREE.Group();rotor.name=`${group.name}_rotor`;
      // Main assemblies turn about the shaft axis. Each planet turns about its own center.
      const isPlanet=/^gears_(08|09|10|11|12|13)$/.test(group.name);
      if(!isPlanet)rotor.position.set(0,-group.userData.startPosition.y,-group.userData.startPosition.z);
      const children=[...group.children];group.add(rotor);
      for(const child of children){rotor.add(child);child.position.sub(rotor.position);}
      rotors.push({rotor,rate});
    }
    applyReveal(0);homeBox.setFromObject(model);applyReveal(1);fullBox.setFromObject(model);applyReveal(0);
    showroom=buildShowroom(scene,fullBox,()=>{needsRender=true;});showroom.setFilm(document.body.dataset.selectedFilm||'watch');showroom.setWebsite(document.body.dataset.selectedWebsite||'carats');document.body.classList.add('scene-ready');stage.dataset.state='ready';stage.dataset.selected='all';ready=true;poster.hidden=true;loading.hidden=true;
    for(const el of [...partButtons,$('reset'),$('reveal'),range,$('clear'),$('motion-toggle'),$('motion-speed'),$('replay-opening')])el.disabled=false;
    updateMotion();
    $('view-controls').hidden=false;resize();fitBox(homeBox,false);startOpening();if(journey>.01)journeyDirty=true;
    const ro=new ResizeObserver(resize);ro.observe(stage);
    new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)needsRender=true;},{threshold:.01}).observe(stage);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)needsRender=true;});
    renderer.domElement.addEventListener('keydown',e=>{if(journey>1.5)return;if(['ArrowLeft','ArrowRight','+','=','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')rotate(-.14);else if(e.key==='ArrowRight')rotate(.14);else if(e.key==='Home')reset();else zoom(e.key==='-'?1.18:.85);}});
    let down=null;
    renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
    renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(meshList,false)[0];if(hit&&journey<1.5)inspect(categoryOf(hit.object));else{const screen=raycaster.intersectObjects(showroom.screens,false)[0];if(screen)document.dispatchEvent(new CustomEvent('studio:screen',{detail:screen.object.userData}));}});
    function frame(now){
      requestAnimationFrame(frame);
      if(!ready||document.hidden||!inView||filmDialog.open||simpleView||document.body.classList.contains('simple')){lastFrame=null;return;}
      const dt=lastFrame===null?0:Math.min(.05,(now-lastFrame)/1000);lastFrame=now;
      if(motionRunning&&journey<1.75){motionVelocity=approachSpeed(motionVelocity,motionSpeed,dt);motionPhase=advancePhase(motionPhase,dt,motionVelocity,true);applyMotion();}
      if(journeyDirty){orbit.enabled=journey<1.5;renderer.domElement.setAttribute('aria-label',journey<1.5?'Interactive transmission. Arrow keys rotate, plus and minus zoom, Home resets.':'Studio exhibition. Choose a film or website using the project selectors.');takeControl();highlight(null);revealTween=null;cameraTween=null;applyReveal(1);const index=Math.min(3,Math.floor(journey)),t=journey-index;const getPose=i=>i<2?cameraFit(fullBox):showroom.pose(i,camera.aspect,stage.clientWidth<=700);const a=getPose(index),b=getPose(index+1);const mix=reduceMotion?(t<.5?0:1):t;camera.position.lerpVectors(a.position,b.position,mix);orbit.target.lerpVectors(a.center,b.center,mix);needsRender=true;journeyDirty=false;}
      if(opening)updateOpening(dt);
      if(revealTween){const t=revealTween;t.elapsed+=dt*1000;applyReveal(interpolateReveal(t.from,t.to,t.elapsed,t.duration));if(t.elapsed>=t.duration){revealTween=null;t.after?.();}}
      if(cameraTween){const t=cameraTween;t.elapsed+=dt*1000;const p=ease(t.elapsed/t.duration);camera.position.lerpVectors(t.from,t.to,p);orbit.target.lerpVectors(t.targetFrom,t.targetTo,p);needsRender=true;if(p>=1)cameraTween=null;}
      if(orbit.update())needsRender=true;
      if(needsRender){renderer.render(scene,camera);stage.dataset.triangles=String(renderer.info.render.triangles);stage.dataset.drawCalls=String(renderer.info.render.calls);if(journey<1.5||journey>3.5)watermark.render(renderer);needsRender=false;}
    }
    requestAnimationFrame(frame);
  }catch(error){console.error('Transmission viewer:',error);fallback('The model could not load. Watch the film or try the 3D view again.');}
}
init();


