import * as THREE from 'three';

// Render within the WebGL canvas so the visible mark is included in canvas captures.
// This is attribution and deterrence, not copy protection for downloadable geometry.
export function createWatermark(){
  const canvas=document.createElement('canvas');
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
  function resize(w,h){
    // WebGL texture storage must be recreated after its canvas dimensions change.
    const scale=2;texture.dispose();canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
    const c=canvas.getContext('2d');c.scale(scale,scale);c.clearRect(0,0,w,h);
    c.save();c.translate(w*(w>700?.705:.5),h*.51);c.rotate(-Math.PI/12);
    c.textAlign='center';c.fillStyle='rgba(240,238,231,0.36)';
    c.shadowColor='rgba(0,0,0,0.8)';c.shadowBlur=3;
    c.font=`500 ${Math.max(20,Math.min(36,w*.035))}px Georgia`;
    c.strokeStyle='rgba(12,16,18,0.48)';c.lineWidth=.8;c.strokeText('VETOPS STUDIO',0,0);
    c.fillText('VETOPS STUDIO',0,0);
    c.font=`${w<500?9:11}px Arial`;c.fillStyle='rgba(240,238,231,0.58)';
    c.lineWidth=1;c.strokeText('© 2026 VetOps Financial LLC',0,23);
    c.fillText('© 2026 VetOps Financial LLC',0,23);c.restore();texture.needsUpdate=true;
  }
  function render(renderer){const clear=renderer.autoClear;renderer.autoClear=false;renderer.clearDepth();renderer.render(scene,camera);renderer.autoClear=clear;}
  return {resize,render};
}
