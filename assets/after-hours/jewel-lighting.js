import * as THREE from 'three';

// A small, private-to-the-gems lighting probe: narrow bright cards separated by dark space.
// Metal and room materials continue to use the original room reflection probe.
export function createJewelLighting(renderer){
 const studio=new THREE.Scene();studio.background=new THREE.Color(.035,.045,.065);
 const cards=[];
 for(const [pos,size,color,power] of [
  [[-3,5,4],[1.1,3.5],0xffffff,13],[[4,3,2],[.55,2.4],0xcce4ff,10],
  [[2,-2,5],[2,.35],0xffffff,8],[[-4,0,-3],[1.4,2],0xffead2,6],
  [[1,5,-4],[3,.45],0xffffff,9],[[0,-4,-2],[.7,1.2],0xc9dfff,5],
 ]){const m=new THREE.Mesh(new THREE.PlaneGeometry(...size),new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(power)}));m.position.set(...pos);m.lookAt(0,0,0);studio.add(m);cards.push(m);}
 const generator=new THREE.PMREMGenerator(renderer),probe=generator.fromScene(studio,.015,.1,30);generator.dispose();cards.forEach(c=>{c.geometry.dispose();c.material.dispose();});
 return {material(name){return new THREE.MeshPhysicalMaterial({name,color:0xf4f8ff,metalness:0,roughness:.025,transmission:.62,thickness:.32,ior:2.417,dispersion:.14,envMap:probe.texture,envMapIntensity:1.45,clearcoat:1,clearcoatRoughness:.015,flatShading:true});}};
}

export function addFacetGlints(mesh){
 const g=mesh.geometry,positions=g.attributes.position,index=g.index,points=[],normals=[];
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3(),ab=new THREE.Vector3(),center=new THREE.Vector3();
 const count=(index?index.count:positions.count)/3;
 // Sample actual facet centers, never billboard stars floating around the jewelry.
 for(let t=0;t<count;t+=Math.max(1,Math.floor(count/180))){
  const at=k=>index?index.getX(t*3+k):t*3+k;
  a.fromBufferAttribute(positions,at(0));b.fromBufferAttribute(positions,at(1));c.fromBufferAttribute(positions,at(2));
  normal.subVectors(c,b).cross(ab.subVectors(a,b)).normalize();
  center.copy(a).add(b).add(c).multiplyScalar(1/3).addScaledVector(normal,.0015);
  points.push(...center);normals.push(...normal);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,toneMapped:false,
  uniforms:{strength:{value:1}},
  vertexShader:`varying float vFlash; varying vec3 vTint;
  void main(){
   vec4 mv=modelViewMatrix*vec4(position,1.0);vec3 N=normalize(normalMatrix*normal);vec3 V=normalize(-mv.xyz);
   vec3 L1=normalize(mat3(viewMatrix)*normalize(vec3(-.5,1.,1.)));
   vec3 L2=normalize(mat3(viewMatrix)*normalize(vec3(1.,.25,.7)));
   float f1=pow(max(dot(reflect(-L1,N),V),0.),36.);
   float f2=pow(max(dot(reflect(-L2,N),V),0.),48.);
   vFlash=max(f1,f2)*smoothstep(.12,.45,dot(N,V));
   vTint=mix(vec3(.72,.85,1.),vec3(1.,.95,.85),step(f2,f1));
   gl_PointSize=clamp(140./max(1.,-mv.z),6.,28.)*smoothstep(.015,.25,vFlash);
   gl_Position=projectionMatrix*mv;
  }`,
  fragmentShader:`uniform float strength;varying float vFlash;varying vec3 vTint;
  void main(){vec2 p=gl_PointCoord-.5;float r=length(p);
   float core=exp(-r*r*130.);float crossRay=exp(-abs(p.x)*100.)*exp(-abs(p.y)*8.)+exp(-abs(p.y)*100.)*exp(-abs(p.x)*8.);
   float alpha=(core+crossRay*.38)*vFlash*strength;
   if(alpha<.012)discard;gl_FragColor=vec4(vTint,alpha);
  }`,
 });
 const glints=new THREE.Points(geometry,material);glints.name='Facet reflections';glints.frustumCulled=false;mesh.add(glints);return material;
}
