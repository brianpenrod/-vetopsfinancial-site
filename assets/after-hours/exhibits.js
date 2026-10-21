import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {exhibits,displayAsset,collectionMotionAllowed} from './exhibit-data.js';
import {advanceWatch,watchAngle,watchCanRun} from './collection-motion.js';
import {createJewelLighting,addFacetGlints} from './jewel-lighting.js';

// Only stripped web derivatives are loaded; source scenes stay outside the server root.
export function buildExhibits(scene,invalidate,renderer) {
 const jewels=createJewelLighting(renderer);
 const root=new THREE.Group();root.name='VetOps watermarked collection';scene.add(root);
 const brass=new THREE.MeshStandardMaterial({color:0xb19458,metalness:.82,roughness:.3});
 const dark=new THREE.MeshStandardMaterial({color:0x10191b,metalness:.5,roughness:.35});
 const glow=new THREE.MeshBasicMaterial({color:0xffd59b,toneMapped:false});
 const screens=[],items=new Map(),decoder=new DRACOLoader().setDecoderPath('/assets/after-hours/assets/vendor/three/examples/jsm/libs/draco/gltf/');
 const loader=new GLTFLoader().setDRACOLoader(decoder);
 function box(parent,size,position,material){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.position.set(...position);parent.add(m);return m;}
 function label(text,w){const c=document.createElement('canvas');c.width=1024;c.height=128;const x=c.getContext('2d');x.fillStyle='#10191b';x.fillRect(0,0,1024,128);x.fillStyle='#d0b47a';x.textAlign='center';x.font='28px Arial';x.fillText(text,512,56);x.font='19px Arial';x.fillText('© 2026 VETOPS FINANCIAL LLC · ALL RIGHTS RESERVED',512,96);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;return new THREE.Mesh(new THREE.PlaneGeometry(w,.25),new THREE.MeshBasicMaterial({map,toneMapped:false}));}
 function wood(material){material.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWood;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWood=position;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWood;').replace('#include <color_fragment>',`#include <color_fragment>
 float p=vWood.x*125.0+sin(vWood.z*5.0)*3.0+sin(vWood.x*11.0+vWood.z*3.0);
 float grain=sin(p)*(1.0-smoothstep(.7,3.0,fwidth(p)));
 diffuseColor.rgb*=.98+grain*.022;
 `);};material.customProgramCacheKey=()=> 'collection-wood-v1';}
 const loads=exhibits.map(async spec=>{
  const holder=new THREE.Group();holder.position.set(...spec.position);holder.rotation.y=spec.angle;root.add(holder);
  const pivot=new THREE.Group();holder.add(pivot);const baseY=-1.38;
  if(spec.id!=='plaque'){
   box(holder,[2.5,.15,1.65],[0,baseY,0],dark);box(holder,[2.52,.025,1.67],[0,baseY+.09,0],brass);
   const height=spec.position[1]+baseY-.12;box(holder,[.85,height,.8],[0,baseY-.12-height/2,0],dark);box(holder,[1.4,.06,1.2],[0,-spec.position[1]+.04,0],brass);
  }else {box(holder,[2.65,2.8,.12],[0,0,-.5],dark);box(holder,[2.68,.025,.15],[0,1.4,-.45],brass);}
  const plate=label('VETOPS STUDIO / '+spec.name.toUpperCase(),2.3);plate.position.set(0,-1.55,.82);holder.add(plate);
  box(holder,[2.2,.018,.04],[0,baseY+.12,.69],glow);
  const fallback=new THREE.Mesh(new THREE.PlaneGeometry(spec.width,spec.height),new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load(displayAsset(spec.id),invalidate),toneMapped:false}));fallback.material.map.colorSpace=THREE.SRGBColorSpace;fallback.userData.exhibit=spec.id;holder.add(fallback);screens.push(fallback);
  const item={...spec,holder,pivot,parts:[],meshes:[],rotors:[],glints:[],mechanismTime:0,mechanismEnabled:false,mechanismRunning:false,ready:false,failed:false,reveal:0,selected:null,turn:0,tilt:0,zoom:1};items.set(spec.id,item);
  try{
   const gltf=await loader.loadAsync('/assets/after-hours/assets/collection-3d/'+spec.id+'.glb');const object=gltf.scene;
   const orient=new THREE.Group();orient.rotation.x=spec.id==='ring'?0:Math.PI/2;orient.add(object);pivot.add(orient);
   object.traverse(o=>{
    if(o.userData.partLabel){o.userData.start=o.position.clone();o.userData.offset=new THREE.Vector3().fromArray(o.userData.explodeOffset);item.parts.push(o);}
    if(o.userData.motionId){o.userData.restQuaternion=o.quaternion.clone();o.userData.axis=new THREE.Vector3().fromArray(o.userData.motionAxis);item.rotors.push(o);}
    if(o.isMesh){o.userData.exhibit=spec.id;screens.push(o);item.meshes.push(o);const convert=mat=>{let m=mat.clone();const name=m.name.toLowerCase();
     if(name.includes('diamond'))m=jewels.material(m.name);
     if(/crystal|sapphire|magnifier/.test(name))m=new THREE.MeshPhysicalMaterial({name:m.name,color:0xffffff,roughness:.03,metalness:0,transparent:true,opacity:.13,depthWrite:false,side:THREE.FrontSide,envMapIntensity:.55});
     if(/walnut|maple|ebony|exposed wood/.test(name))wood(m);
     m.userData.baseColor=m.color.clone();m.userData.baseEnv=m.envMapIntensity;return m;};o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);
     if(spec.id==='ring'&&(Array.isArray(o.material)?o.material:[o.material]).every(m=>/diamond/i.test(m.name)))item.glints.push({mesh:o,material:addFacetGlints(o)});
    }
   });
   orient.removeFromParent();const b=new THREE.Box3().setFromObject(orient),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());const scale=(spec.id==='plaque'?2.3:2.15)/Math.max(size.x,size.y,size.z);orient.scale.setScalar(scale);orient.position.copy(center).multiplyScalar(-scale);pivot.add(orient);item.orient=orient;item.scale=scale;
   fallback.visible=false;item.ready=true;reset(spec.id);invalidate();
  }catch(error){console.error('Collection model '+spec.id,error);item.failed=true;invalidate();}
 });
 Promise.allSettled(loads).then(()=>decoder.dispose());
 function select(id){for(const item of items.values()){item.pivot.position.z=item.id==='plaque'&&id==='plaque'?1.3:0;if(item.id!==id)reset(item.id);}invalidate();}
 function rotate(id,dx,dy=0){const i=items.get(id);if(!i?.ready)return;i.turn+=dx;i.tilt=THREE.MathUtils.clamp(i.tilt+dy,-Math.PI,Math.PI);i.pivot.rotation.set(i.tilt,i.turn,0);invalidate();}
 function zoom(id,f){const i=items.get(id);if(!i)return;i.zoom=THREE.MathUtils.clamp(i.zoom*f,.6,1.8);i.pivot.scale.setScalar(i.zoom);invalidate();}
 function reset(id){const i=items.get(id);if(!i?.ready)return;i.mechanismTime=0;i.mechanismEnabled=false;applyMechanism(i);i.turn=id==='ring'?-.35:-.22;i.tilt=id==='watch'?-.35:id==='ring'?.54:0;i.zoom=1;i.pivot.scale.setScalar(1);i.pivot.rotation.set(i.tilt,i.turn,0);seek(id,0);highlight(id,null);invalidate();}
 function seek(id,value){const i=items.get(id);if(!i?.ready)return;i.reveal=id==='ring'?0:THREE.MathUtils.clamp(value,0,1);for(const p of i.parts)p.position.copy(p.userData.start).addScaledVector(p.userData.offset,i.reveal);invalidate();}
 function highlight(id,name){const i=items.get(id);if(!i)return;i.selected=name;for(const m of i.meshes){let p=m;while(p&&!p.userData.partLabel)p=p.parent;const active=!name||p?.userData.partLabel===name;for(const mat of Array.isArray(m.material)?m.material:[m.material]){mat.color.copy(mat.userData.baseColor).multiplyScalar(active?1:.22);mat.envMapIntensity=mat.userData.baseEnv*(active?1:.3);}for(const glint of i.glints)if(glint.mesh===m)glint.material.uniforms.strength.value=active?1:0;}invalidate();}
 function inspect(id,name){const i=items.get(id);if(!i?.ready)return;if(name&&id!=='ring'){seek(id,1);i.turn=-.85;i.tilt=-.25;i.pivot.rotation.set(i.tilt,i.turn,0);}highlight(id,name);}
 function pose(id,aspect,mobile=false){const i=items.get(id);i.pivot.updateWorldMatrix(true,true);const center=i.reveal>0?new THREE.Box3().setFromObject(i.pivot).getCenter(new THREE.Vector3()):i.holder.localToWorld(i.pivot.position.clone()),normal=new THREE.Vector3(Math.sin(i.angle),.05,Math.cos(i.angle));const d=Math.max(3.8,2.7/(2*Math.tan(Math.PI*48/360)*aspect))*(mobile?1.2:1.25)+i.reveal*(id==='watch'?2:1);return{center,position:center.clone().addScaledVector(normal,d)};}
 let previous=null;
 const rotation=new THREE.Quaternion();
 function applyMechanism(i){for(const rotor of i.rotors)rotor.quaternion.copy(rotor.userData.restQuaternion).multiply(rotation.setFromAxisAngle(rotor.userData.axis,watchAngle(rotor.userData.motionId,i.mechanismTime)));}
 function setMechanism(id,enabled){const i=items.get(id);if(i){i.mechanismEnabled=enabled;invalidate();}}
 function update(state){const dt=previous===null?0:Math.max(0,Math.min(.05,state.seconds-previous));previous=state.seconds;let active=false;
  for(const i of items.values()){
   i.mechanismRunning=i.ready&&i.id==='watch'&&watchCanRun(state,i.mechanismEnabled);
   if(i.mechanismRunning){i.mechanismTime=advanceWatch(i.mechanismTime,dt,true);applyMechanism(i);active=true;}
   if(collectionMotionAllowed(state)&&i.ready&&(state.selected===i.id||state.room)){if(state.room&&i.id==='plaque'){i.turn=Math.sin(state.seconds*.18)*.13;i.tilt=0;i.pivot.rotation.set(0,i.turn,0);}else rotate(i.id,dt*(state.selected?.18:.09));active=true;}
  }return active;
 }
 function progress(id){const i=items.get(id);return i?{ready:i.ready,failed:i.failed,reveal:i.reveal,turn:i.turn,tilt:i.tilt,zoom:i.zoom,selected:i.selected,mechanismRunning:i.mechanismRunning,mechanismEnabled:i.mechanismEnabled,mechanismTime:i.mechanismTime,rotors:i.rotors.map(r=>({id:r.userData.motionId,angle:watchAngle(r.userData.motionId,i.mechanismTime)})),parts:i.parts.map(p=>p.userData.partLabel)}:null;}
 function markers(camera,w,h){return exhibits.map(spec=>{const item=items.get(spec.id),point=new THREE.Vector3(0,1.7,.14);item.holder.localToWorld(point);point.project(camera);return{id:spec.id,x:(point.x*.5+.5)*w,y:(-.5*point.y+.5)*h,visible:point.z>-1&&point.z<1&&Math.abs(point.x)<.95&&Math.abs(point.y)<.88};});}
 function pause(){previous=null;}
 return{screens,pose,select,update,seek,progress,markers,pause,rotate,zoom,reset,highlight,inspect,setMechanism};
}
