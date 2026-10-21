export function journeyAt(focus,centers,reduced=false){
  if(!Number.isFinite(focus)||centers.length<2)return 0;
  let value=0;
  if(focus>=centers.at(-1))value=centers.length-1;
  else for(let i=0;i<centers.length-1;i++){
    if(focus>=centers[i]&&focus<centers[i+1]){
      let t=(focus-centers[i])/(centers[i+1]-centers[i]);
      t=Math.max(0,Math.min(1,(t-.27)/.46));
      value=i+t*t*(3-2*t);break;
    }
  }
  return reduced?Math.round(value):value;
}
