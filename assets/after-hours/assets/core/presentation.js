import {ease,clampReveal} from './model-state.js';
export const OPENING_DURATION=7.2;
export const revealOffsets={front:0,converter:.08,housing:.04,clutch:.18,drum:.23,gears:.28,lower:.13};
export function componentReveal(progress,category){
  const offset=revealOffsets[category]||0;
  return ease((clampReveal(progress)-offset)/(1-offset));
}
export function openingAt(seconds){
  const t=Math.max(0,Number.isFinite(seconds)?seconds:0);
  const reveal=ease((t-1.1)/4.7),arrival=ease(t/1.3),settle=ease((t-5.8)/1.4);
  return {reveal,arrival,settle,done:t>=OPENING_DURATION,
    chapter:t<1.1?'01 / The assembly':t<5.8?'02 / Layers in motion':'03 / Yours to explore'};
}
