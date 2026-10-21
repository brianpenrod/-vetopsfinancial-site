export const exhibits = [
  {id:'watch',name:'Watch',title:'Details in motion.',copy:'Turn the watch in your hands. Reveal nine layers, from the bracelet and movement to the dial and crystal.',note:'Carats & Timepieces · Illustrative 3D study',position:[-5.0,3.05,3.0],angle:.45,width:2.65,height:1.490625},
  {id:'ring',name:'Ring',title:'Light, held.',copy:'Explore the center stone, open setting and eternity band from every angle. Watch the facets catch the light as you turn. Select a detail to bring it into focus.',note:'Carats & Timepieces · Illustrative 3D study',position:[5.0,2.65,3.0],angle:-.45,width:2.65,height:1.490625},
  {id:'plaque',name:'Plaque',title:'Every layer tells a story.',copy:'Turn the solid relief and reveal seven layers of wood, brass and artwork. Explore the edges and construction.',note:'Custom plaque · Layered relief study',position:[6.3,4.15,-2.6],angle:-.95,width:2.1,height:2.1},
];
export function displayAsset(id,kind='poster') {
  if(!exhibits.some(e=>e.id===id))throw new Error('Unknown exhibit');
  return `/assets/after-hours/assets/collection/${id}${kind==='film'?'-hd.mp4':kind==='preview'?'.mp4':'.jpg'}`;
}
export function collectionMotionAllowed({reduced,hidden,simple,modal,paused}) {
  return !reduced&&!hidden&&!simple&&!modal&&!paused;
}
