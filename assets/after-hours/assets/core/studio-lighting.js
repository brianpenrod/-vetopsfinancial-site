import * as THREE from 'three';

export function lightStudio(renderer,scene){
  // A photographic studio: large softboxes separated by dark reflection cards.
  const studio=new THREE.Scene();studio.background=new THREE.Color(0x1c2028);
  const geometry=new THREE.PlaneGeometry(1,1),materials=[];
  function softbox(position,size,color,intensity){
    const material=new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(intensity),side:THREE.DoubleSide});
    materials.push(material);const card=new THREE.Mesh(geometry,material);
    card.position.set(...position);card.scale.set(...size,1);card.lookAt(0,0,0);studio.add(card);
  }
  softbox([-3,5,4],[5,4],0xfff3df,5.5);
  softbox([2,6,-2],[7,.8],0xffffff,7);
  softbox([5,1,-4],[2.2,5],0xc8dcff,4.5);
  softbox([-5,0,-1],[1.1,4],0xffd7a2,2.5);
  softbox([1,-3,5],[6,1.2],0xcbd8e4,1.4);
  const pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromScene(studio,.025,.1,30);
  scene.environment=target.texture;scene.environmentIntensity=1.05;
  geometry.dispose();materials.forEach(m=>m.dispose());pmrem.dispose();
  const lights=[];
  const ambient=new THREE.HemisphereLight(0xc8d6e5,0x16181b,.28);scene.add(ambient);
  function light(color,intensity,position){const l=new THREE.DirectionalLight(color,intensity);l.position.set(...position);scene.add(l);lights.push({light:l,intensity});}
  light(0xfff0da,2.1,[-3,5,6]);light(0xc6dcff,1.8,[4,3,-4]);light(0xffffff,.5,[-5,-1,3]);
  return {setOpeningLevel(t){for(const item of lights)item.light.intensity=item.intensity*(.68+.32*t);scene.environmentIntensity=.78+.27*t;}};
}

export function finishMetal(material){
  const name=material.name.toLowerCase();
  const cast=name.includes('cast'),dark=name.includes('charcoal')||name.includes('blackened')||name.includes('dark');
  const gold=/gold|bronze|copper|warm/.test(name);
  material.roughness=cast?.42:dark?.4:gold?.29:.265;
  if(name.includes('friction')){material.roughness=.72;material.metalness=.16;}
  material.envMapIntensity=1.0;
  material.userData.baseColor=material.color.clone();
  material.userData.baseRoughness=material.roughness;
  // Procedural roughness variation adds machining grain without shipping source textures.
  // fwidth filtering fades subpixel lines instead of allowing them to shimmer during rotation.
  material.onBeforeCompile=shader=>{
    shader.uniforms.finishStrength={value:cast?.035:.023};
    shader.uniforms.finishFrequency={value:cast?170:620};
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vFinishPosition;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvFinishPosition = position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 vFinishPosition;
      uniform float finishStrength;
      uniform float finishFrequency;
    `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      float phase = vFinishPosition.x * finishFrequency;
      float bandVisibility = 1.0 - smoothstep(0.5, 3.0, fwidth(phase));
      float grainPhase = dot(vFinishPosition, vec3(157.0, 241.0, 173.0));
      float grainVisibility = 1.0 - smoothstep(0.5, 3.0, fwidth(grainPhase));
      float finishGrain = sin(phase) * bandVisibility * 0.65 + sin(grainPhase) * grainVisibility * 0.35;
      roughnessFactor = clamp(roughnessFactor + finishGrain * finishStrength, 0.12, 0.9);
    `);
  };
  material.customProgramCacheKey=()=> 'vetops-machining-v1';
  return material;
}
