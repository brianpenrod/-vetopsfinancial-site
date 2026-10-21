// Relative visual speeds, not engineering gear ratios.
export const rotationRates={front_01:.18,converter_03:.72,clutch_14:.32,clutch_15:.32,drum_16:.44,gears_06:.12,gears_07:1.05,gears_08:-.72,gears_09:-.72,gears_10:-.72,gears_11:-.72,gears_12:-.72,gears_13:-.72};
export function approachSpeed(current,target,dt){return current+(target-current)*(1-Math.exp(-Math.max(0,Math.min(dt,.05))*4));}
export function advancePhase(phase,deltaSeconds,speed,running){
  if(!running)return phase;
  const dt=Math.max(0,Math.min(.05,Number.isFinite(deltaSeconds)?deltaSeconds:0));
  const rate=Math.max(0,Math.min(2,Number.isFinite(speed)?speed:1));
  return (phase+dt*rate)%(Math.PI*200);
}
