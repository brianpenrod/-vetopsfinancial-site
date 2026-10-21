export const clamp=v=>Math.min(1,Math.max(0,Number.isFinite(v)?v:0));
export const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export const DURATION=12;
export function openingShot(t){return {pull:smooth((t-1.2)/6.5),reveal:smooth((t-3)/6),light:smooth(t/2.2),done:t>=DURATION,label:t<2.5?'The first turn':t<7?'Precision, revealed':t<10?'Welcome to the studio':'Yours to explore'};}
