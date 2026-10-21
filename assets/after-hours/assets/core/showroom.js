import * as THREE from 'three';
import {films,websites} from './collection.js';

export function buildShowroom(scene,box,invalidate){
  const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  const u=size.x/12, floorY=box.min.y-u*.8;
  const room=new THREE.Group();scene.add(room);
  const charcoal=new THREE.MeshStandardMaterial({color:0x171d1e,roughness:.66,metalness:.12});
  const edge=new THREE.MeshStandardMaterial({color:0x887047,roughness:.3,metalness:.85});
  const dark=new THREE.MeshStandardMaterial({color:0x0b1012,roughness:.35,metalness:.5});
  const glow=new THREE.MeshBasicMaterial({color:0xe5c791});
  const wall=new THREE.MeshStandardMaterial({color:0x1c2425,roughness:.93,metalness:0});
  const base=new THREE.Vector3(center.x,floorY,center.z);
  function block(position,dimensions,material=charcoal,parent=room){const m=new THREE.Mesh(new THREE.BoxGeometry(...dimensions.map(n=>n*u)),material);m.position.copy(base).add(new THREE.Vector3(...position).multiplyScalar(u));parent.add(m);return m;}
  const noise=document.createElement('canvas');noise.width=noise.height=256;const ctx=noise.getContext('2d'),pixels=ctx.createImageData(256,256);
  let seed=91;for(let i=0;i<pixels.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const c=110+(seed%22);pixels.data.set([c,c+2,c+2,255],i);}ctx.putImageData(pixels,0,0);
  const texture=new THREE.CanvasTexture(noise);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(35,20);texture.colorSpace=THREE.SRGBColorSpace;
  const floor=new THREE.MeshStandardMaterial({color:0x111615,map:texture,roughness:.86,metalness:0,envMapIntensity:.08});
  block([22,-2.14,0],[110,.2,55],floor);block([22,6,-9],[110,20,.28],wall);
  // Broad panels, brass uprights, and luminous strips form one continuous gallery.
  for(let x=-16;x<=68;x+=8){block([x,7,-8.72],[.025,14,.04],edge);block([x,-2.025,-1],[.018,.012,15],edge);}
  for(const x of [-9,9,20,36,44,61]){block([x,5,-4],[.12,14,.12],edge);block([x,12,-1],[.12,.1,10],edge);block([x,11.9,-1],[.035,.035,9],glow);}
  block([4,12,-3],[22,.15,10],charcoal);block([4,11.9,-3],[20,.025,8],new THREE.MeshBasicMaterial({color:0xc6bba4}));
  // Workbench stays below the lowest exploded component.
  block([0,-.72,0],[15,1.3,5],dark);block([0,-.05,0],[15.1,.07,5.1],charcoal);block([0,-1.41,0],[14.7,.025,4.8],glow);
  for(const x of [-5,5])block([x,-1.6,0],[.5,.4,3.6],dark);
  // A soft local contact shadow anchors the assembly without expensive live shadow maps.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const s=shadowCanvas.getContext('2d'),g=s.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(0,0,0,.85)');g.addColorStop(1,'rgba(0,0,0,0)');s.fillStyle=g;s.fillRect(0,0,128,128);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(14*u,5*u),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(center.x,floorY+.01*u,center.z);room.add(shadow);
  const washCanvas=document.createElement('canvas');washCanvas.width=washCanvas.height=128;const wc=washCanvas.getContext('2d'),wg=wc.createRadialGradient(64,64,0,64,64,64);wg.addColorStop(0,'rgba(219,168,85,.42)');wg.addColorStop(.4,'rgba(175,119,48,.13)');wg.addColorStop(1,'rgba(122,78,30,0)');wc.fillStyle=wg;wc.fillRect(0,0,128,128);const washTex=new THREE.CanvasTexture(washCanvas);washTex.colorSpace=THREE.SRGBColorSpace;
  for(const x of [1,27,55]){const wash=new THREE.Mesh(new THREE.PlaneGeometry(15*u,17*u),new THREE.MeshBasicMaterial({map:washTex,transparent:true,depthWrite:false,toneMapped:false}));wash.position.copy(base).add(new THREE.Vector3(x,6,-8.8).multiplyScalar(u));room.add(wash);}
  const floorWash=new THREE.Mesh(new THREE.PlaneGeometry(20*u,9*u),new THREE.MeshBasicMaterial({map:washTex,transparent:true,depthWrite:false,toneMapped:false}));floorWash.rotation.x=-Math.PI/2;floorWash.position.copy(base).add(new THREE.Vector3(0,-2.025,0).multiplyScalar(u));room.add(floorWash);
  const loader=new THREE.TextureLoader(),cache=new Map(),screens=[];
  function imageMap(path){if(!cache.has(path)){const t=loader.load(path,()=>invalidate(),undefined,()=>invalidate());t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;cache.set(path,t);}return cache.get(path);}
  function screen(x,y,z,w,h,path,kind,value,angle=0){const holder=new THREE.Group();holder.position.copy(base).add(new THREE.Vector3(x,y,z).multiplyScalar(u));holder.rotation.y=angle;room.add(holder);
    const frame=new THREE.Mesh(new THREE.BoxGeometry((w+.2)*u,(h+.2)*u,.16*u),dark);holder.add(frame);
    const mat=new THREE.MeshBasicMaterial({map:imageMap(path),toneMapped:false});const plane=new THREE.Mesh(new THREE.PlaneGeometry(w*u,h*u),mat);plane.position.z=.09*u;plane.userData={kind,value};holder.add(plane);screens.push(plane);
    const trim=new THREE.LineSegments(new THREE.EdgesGeometry(frame.geometry),new THREE.LineBasicMaterial({color:0x897049}));holder.add(trim);return {holder,plane,mat,w,h};}
  const filmMain=screen(28,6,0,10,5.625,'/assets/after-hours/assets/studio/watch.jpg','film','watch',-.08);
  const filmSide=screen(36,6,-2.5,4.5,5.625,'/assets/after-hours/assets/studio/ring.jpg','film','ring',-.22);
  const plaqueSide=screen(42,6,-5,4.5,5.625,'/assets/after-hours/assets/studio/plaque.jpg','film','plaque',-.35);
  for(const x of [22.7,33.3])block([x,4.4,0],[.09,12.8,.12],edge);block([28,10.8,0],[10.7,.09,.12],edge);
  block([28,1.1,0],[11,.25,2],charcoal);block([28,.5,0],[9,1,1.2],dark);
  // Actual portfolio artwork is displayed on the desktop exhibition screen.
  block([56,1.6,0],[14,.25,5],charcoal);for(const x of [50,62])block([x,-.1,0],[.2,3.5,4],edge);
  const web=screen(56,5.3,0,10,5.625,websites.carats.poster,'website','carats',-.1);
  block([56,2.4,-.2],[.3,2.5,.25],edge);block([56,1.8,.2],[3,.09,1.8],dark);
  block([55,1.82,1.7],[4,.08,1.3],dark);
  for(let row=0;row<4;row++)for(let key=0;key<13;key++)block([53.25+key*.27,1.89,1.25+row*.24],[.22,.035,.18],charcoal);
  // Brass task light adds scale and a warmer focus to the website station.
  const stem=block([61,3.3,-.8],[.07,3,.07],edge);const shade=new THREE.Mesh(new THREE.SphereGeometry(.7*u,24,12,0,Math.PI*2,0,Math.PI/2),edge);shade.position.copy(base).add(new THREE.Vector3(61,4.8,-.8).multiplyScalar(u));room.add(shade);
  const taskLight=new THREE.PointLight(0xffd29b,18*u*u,9*u,2);taskLight.position.copy(shade.position).y-=.1*u;scene.add(taskLight);
  scene.fog=new THREE.FogExp2(0x101719,.009/u);
  function setFilm(key){const f=films[key];filmMain.mat.map=imageMap('/assets/after-hours/assets/studio/'+f.poster+'.jpg');filmMain.plane.userData.value=key;
    const square=key==='plaque';filmMain.plane.scale.x=square?.5625:1;invalidate();}
  function setWebsite(key){web.mat.map=imageMap(websites[key].poster);web.plane.userData.value=key;web.plane.scale.y=key==='gina'?.63:1;invalidate();}
  function pose(chapter,aspect=1.7,mobile=false){
    const positions={2:[26,8,18],3:[54,7.5,18],4:[-11,9.5,19]};const targets={2:[28,5.9,0],3:[56,5.1,0],4:[0,5,-1]};
    const target=base.clone().add(new THREE.Vector3(...targets[chapter]).multiplyScalar(u));const eye=base.clone().add(new THREE.Vector3(...positions[chapter]).multiplyScalar(u));const offset=eye.clone().sub(target);const minDistance=chapter<4?10.6*u/(2*Math.tan(34*Math.PI/360)*aspect*(mobile?.94:.54)):0;offset.setLength(Math.max(offset.length(),minDistance));return {position:target.clone().add(offset),center:target};
  }
  return {room,pose,setFilm,setWebsite,screens,unit:u};
}
