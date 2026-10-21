import {validateInquiry,requestText} from '../assets/after-hours/inquiry-data.js';
const recipient='studio@vetopsfinancial.com';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const enabled=env=>env.DELIVERY_ENABLED==='true'&&env.EMAIL?.send&&env.REQUEST_LIMITER?.limit&&env.TURNSTILE_SECRET&&env.TURNSTILE_SITE_KEY&&env.STUDIO_ORIGIN&&/^[a-z0-9._+-]+@vetopsfinancial\.com$/i.test(env.STUDIO_FROM||'');
const escapeHtml=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function readBounded(request){const reader=request.body?.getReader();if(!reader)throw Error();let size=0,chunks=[];try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();throw Error();}chunks.push(value);}}finally{reader.releaseLock();}const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return JSON.parse(new TextDecoder().decode(bytes));}
export async function handleInquiry(request,env,{fetcher=fetch}={}){
 const url=new URL(request.url);
 if(url.pathname==='/api/studio-request/config'&&request.method==='GET')return json(enabled(env)?{mode:'live',siteKey:env.TURNSTILE_SITE_KEY}:{mode:'unavailable'});
 if(url.pathname!=='/api/studio-request')return json({error:'Not found'},404);
 if(request.method!=='POST')return json({error:'Use POST.'},405);
 if(!enabled(env))return json({error:'Direct delivery is not connected yet.'},503);
 if(url.origin!==env.STUDIO_ORIGIN||request.headers.get('Origin')!==env.STUDIO_ORIGIN)return json({error:'This request must come from the Studio.'},403);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Use JSON.'},415);
 try{
  const ip=request.headers.get('CF-Connecting-IP');if(!ip)return json({error:'Unable to verify this connection.'},403);
  if(!(await env.REQUEST_LIMITER.limit({key:ip})).success)return json({error:'Please wait a minute before trying again.'},429);
  let raw;try{raw=await readBounded(request);}catch{return json({error:'The project brief is invalid or too large.'},400);}
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.website)return json({error:'Unable to accept this request.'},400);
  const parsed=validateInquiry(raw);if(!parsed.valid)return json({error:'Please review your project details.',fields:parsed.errors},400);
  if(typeof raw.token!=='string'||raw.token.length<1||raw.token.length>2048)return json({error:'Please complete verification.'},403);
  const verification=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET,response:raw.token,remoteip:ip}),signal:AbortSignal.timeout(8000)});
  if(!verification.ok)return json({error:'Verification is temporarily unavailable.'},503);
  const result=await verification.json();if(!result.success||result.hostname!==new URL(env.STUDIO_ORIGIN).hostname||result.action!=='studio_request')return json({error:'Verification expired. Please try again.'},403);
  const created=new Date().toISOString(),reference='VOS-'+created.slice(0,10).replaceAll('-','')+'-'+crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase();
  const text=requestText(parsed.data,reference,created);
  const mail=await env.EMAIL.send({from:{email:env.STUDIO_FROM,name:'VetOps Studio'},to:recipient,replyTo:parsed.data.email,subject:`[${reference}] New project request — ${parsed.data.type}`,text,html:`<div style="font-family:Arial,sans-serif;color:#18252b;max-width:700px"><h1 style="font-size:24px">VetOps Studio · Project request</h1><p>New inquiry — awaiting review</p><pre style="white-space:pre-wrap;font:14px/1.7 Arial,sans-serif">${escapeHtml(text)}</pre></div>`});
  if(!mail?.messageId)return json({error:'Unable to confirm delivery. Contact the Studio before retrying.'},502);
  return json({status:'accepted',reference,created});
 }catch{return json({error:'Unable to confirm delivery. Contact the Studio before retrying.'},502);}
}
export default {fetch:handleInquiry};
