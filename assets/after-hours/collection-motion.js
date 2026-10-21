// Illustrative gear motion; hands keep clock ratios at five times real time.
export const watchRates=Object.freeze({
 'gear-1':.9,'gear-2':-.9*36/28,'gear-3':.9*36/32,
 'gear-4':-.9*36/26,'gear-5':.9*36/22,'gear-6':-.9*36/24,
 'second-hand':-Math.PI*2/12,'minute-hand':-Math.PI*2/720,'hour-hand':-Math.PI*2/8640,
});
export function advanceWatch(seconds,dt,running){return running?seconds+Math.max(0,Math.min(.05,dt)):seconds;}
export function watchAngle(id,seconds){return (watchRates[id]||0)*seconds%(Math.PI*2);}
export function watchCanRun(state,enabled){return !state.reduced&&!state.hidden&&!state.simple&&!state.modal&&(state.room||(state.selected==='watch'&&enabled));}
