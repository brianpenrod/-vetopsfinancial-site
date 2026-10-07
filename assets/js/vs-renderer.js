/* One small WebGL2 renderer, one mesh upload, no runtime libraries or textures. */
const vertex = `#version 300 es
in vec3 position; in vec3 normal;
uniform mat4 model; uniform mat4 projection; uniform float distance;
out vec3 worldPosition; out vec3 worldNormal; out vec3 localPosition;
void main(){vec4 p=model*vec4(position,1.);worldPosition=p.xyz;
worldNormal=mat3(model)*normal;localPosition=position;
gl_Position=projection*vec4(p.xyz-vec3(0.,0.,distance),1.);}`;
const fragment = `#version 300 es
precision highp float;
in vec3 worldPosition; in vec3 worldNormal; in vec3 localPosition;
uniform vec2 light; uniform float distance; out vec4 color;
void main(){
 vec3 n=normalize(worldNormal),v=normalize(vec3(0.,0.,distance)-worldPosition),r=reflect(-v,n);
 vec3 copper=vec3(.62,.24,.105);
 float grain=sin(localPosition.y*900.+sin(localPosition.x*90.)*.6)*.004/max(1.,fwidth(localPosition.y*900.));
 vec3 key=normalize(vec3(-.55+light.x*.35,.55+light.y*.2,1.));
 vec3 rim=normalize(vec3(.82,.18,-.45));
 float soft=pow(max(dot(r,key),0.),18.);
 float strip=pow(max(dot(r,normalize(vec3(-.75,.2,.5))),0.),65.);
 float edge=pow(max(dot(r,rim),0.),12.);
 float diffuse=max(dot(n,key),0.);
 float fresnel=pow(1.-max(dot(n,v),0.),5.);
 float box=exp(-pow((r.x-.36-light.x*.28)/.12,2.)-pow((r.y-.20-light.y*.12)/.65,2.));
 vec3 environment=vec3(.09,.07,.06)+vec3(3.8,3.1,2.6)*box+vec3(1.4,1.2,1.)*soft+vec3(3.4,2.8,2.2)*strip+vec3(1.7,1.2,.8)*edge;
 vec3 c=copper*(environment+diffuse*.08+grain)+vec3(.48,.31,.19)*fresnel*.4;
 c=c/(c+vec3(.7));c=pow(c,vec3(1./2.2));color=vec4(c,1.);
}`;
function multiply(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
function modelMatrix(x,y){const a=Math.cos(x),b=Math.sin(x),c=Math.cos(y),d=Math.sin(y);
 return multiply(new Float32Array([c,0,-d,0,0,1,0,0,d,0,c,0,0,0,0,1]),new Float32Array([1,0,0,0,0,a,b,0,0,-b,a,0,0,0,0,1]));}
function perspective(aspect){const f=1/Math.tan(.49/2),near=.1,far=30;return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);}
export async function createRenderer(canvas, signal){
 const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});
 if(!gl)throw new Error('WebGL2 unavailable');
 let disposed=false,program=null,buffer=null,vao=null;
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(log);}return s;};
 const dispose=()=>{if(disposed)return;disposed=true;if(vao)gl.deleteVertexArray(vao);if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);};
 try{
  const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
  program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  const response=await fetch(new URL('../studio-3d/vs-copper.bin',import.meta.url),{signal});
  if(!response.ok)throw new Error('Mesh unavailable');
  const bytes=await response.arrayBuffer();if(bytes.byteLength!==137376)throw new Error('Unexpected mesh size');
  const data=new Float32Array(bytes);if(data.some(n=>!Number.isFinite(n)))throw new Error('Invalid geometry');
  buffer=gl.createBuffer();vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  for(const [name,offset] of [['position',0],['normal',12]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,24,offset);}
  const model=gl.getUniformLocation(program,'model'),projection=gl.getUniformLocation(program,'projection'),light=gl.getUniformLocation(program,'light'),distance=gl.getUniformLocation(program,'distance');
  gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
  let frames=0;
  return {get frames(){return frames;},triangles:data.length/18,bytes:bytes.byteLength,
   resize(width,height,dpr){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);gl.uniformMatrix4fv(projection,false,perspective(width/height));gl.uniform1f(distance,Math.max(7.2,10.4/(width/height)));},
   draw(x,y,lx=0,ly=0){if(disposed)return;gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.uniformMatrix4fv(model,false,modelMatrix(x,y));gl.uniform2f(light,lx,ly);gl.bindVertexArray(vao);gl.drawArrays(gl.TRIANGLES,0,data.length/6);frames++;if(gl.getError()!==gl.NO_ERROR)throw new Error('WebGL rendering failure');},dispose};
 }catch(error){dispose();throw error;}
}
