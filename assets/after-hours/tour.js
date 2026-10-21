import {smooth} from './cinematic.js';

export const tourStops=Object.freeze([
 {id:'transmission',name:'Transmission',title:'Where motion begins.',copy:'A working study in layers. Follow the rotating assembly as its construction opens before you.',duration:16},
 {id:'watch',name:'Watch',title:'A smaller kind of precision.',copy:'Six wheels. Three hands. Look through the layers while the mechanism keeps moving.',duration:18},
 {id:'ring',name:'Ring',title:'A conversation with light.',copy:'Follow the crown, the setting and the eternity band as each facet catches a different reflection.',duration:14},
 {id:'plaque',name:'Plaque',title:'Depth behind the detail.',copy:'Wood, brass and raised artwork. Seven layers separate to reveal how the piece comes together.',duration:18},
 {id:'room',name:'The studio',title:'The room is yours.',copy:'Take another look. Choose any piece and make the next move yourself.',duration:5},
]);
export const TOUR_DURATION=tourStops.reduce((sum,s)=>sum+s.duration,0);
export function tourShot(index,time){
 const stop=tourStops[index];if(!stop)throw Error('Unknown tour stop');
 const t=Math.max(0,Math.min(stop.duration,time));
 const travel=smooth(t/3.4),detail=smooth((t-3.5)/4.5);
 const close=stop.id==='watch'||stop.id==='plaque'?1-smooth((t-stop.duration+3)/3):1;
 return {travel,reveal:detail*close,drift:smooth((t-3.4)/(stop.duration-3.4)),done:t>=stop.duration};
}
export function advanceTour(elapsed,dt,{paused=false,reduced=false,hidden=false,waiting=false}={}){
 return paused||reduced||hidden||waiting?elapsed:elapsed+Math.max(0,Math.min(.05,dt));
}
export function tourProgress(index,elapsed){
 return (tourStops.slice(0,index).reduce((sum,s)=>sum+s.duration,0)+Math.max(0,Math.min(tourStops[index].duration,elapsed)))/TOUR_DURATION;
}
