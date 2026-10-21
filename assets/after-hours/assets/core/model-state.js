export const clampReveal=value=>Math.max(0,Math.min(1,Number.isFinite(Number(value))?Number(value):0));
export const ease=value=>{const t=clampReveal(value);return t*t*(3-2*t);};
export function interpolateReveal(from,to,elapsed,duration){return duration<=0?clampReveal(to):clampReveal(from+(to-from)*ease(elapsed/duration));}
export const componentInfo={
  front:{title:'Front plate',label:'01 / THE OPENING LAYER',copy:'A perforated plate gives the assembly its distinctive face. Reveal the model to see the components arranged behind it.'},
  housing:{title:'Housing & shell',label:'02 / THE OUTER STRUCTURE',copy:'The sectioned housing frames the internal assembly. Its cutaway presentation makes the relationship between exterior and interior visible.'},
  converter:{title:'Converter assembly',label:'03 / FORMED METAL',copy:'Warm metallic vanes and formed dishes create a layered front assembly. Rotate the view to examine their depth and profile.'},
  clutch:{title:'Clutch & plate pack',label:'04 / REPEATED PRECISION',copy:'Nested plates and the surrounding basket form the central pack. Separation gives the repeated layers room to be seen.'},
  drum:{title:'Rear drum & bearing',label:'05 / THE CENTRAL CONNECTION',copy:'A compact drum and bearing group sits between the central pack and rear mechanism. The reveal exposes its shape and placement.'},
  gears:{title:'Rear gear assembly',label:'06 / INTERLOCKING DETAIL',copy:'The rear assembly brings together the annulus, sun and planet forms. This illustrative model makes their arrangement visible without claiming a validated mechanism.'},
  lower:{title:'Lower assembly & pan',label:'07 / BELOW THE SURFACE',copy:'The lower assembly and removable tray separate from the main body, completing the view into the model’s construction.'}
};
