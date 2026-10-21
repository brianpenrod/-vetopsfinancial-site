export const projectTypes=['Interactive 3D website','Product visualization','Animation / brand film','Website design','Something else'];
export const budgets=['Not sure yet','Under $2,500','$2,500–$5,000','$5,000–$10,000','$10,000+'];
export const timelines=['Flexible / exploring','Within a month','1–3 months','3+ months'];
export const fields=[['name','Name'],['email','Email'],['company','Company'],['phone','Phone'],['type','Project type'],['description','Project brief'],['budget','Budget range'],['timeline','Timing'],['reference','Reference link']];
export function validateInquiry(raw){
 const errors={},data={};
 for(const [key,label] of fields){const value=raw?.[key];data[key]=typeof value==='string'?value.trim():'';const max=key==='description'?4000:key==='reference'?500:200;if(data[key].length>max)errors[key]=`${label} is too long.`;if(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(data[key])||(key!=='description'&&/[\r\n]/.test(data[key])))errors[key]=`${label} contains unsupported characters.`;}
 if(!data.name)errors.name='Please enter your name.';
 if(!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(data.email)||data.email.length>254)errors.email='Please enter a valid email address.';
 if(!projectTypes.includes(data.type))errors.type='Choose a project type.';
 if(data.description.length<20)errors.description='Tell us a little more (at least 20 characters).';
 if(!budgets.includes(data.budget))errors.budget='Choose a budget range.';
 if(!timelines.includes(data.timeline))errors.timeline='Choose a timeframe.';
 if(data.reference){try{const u=new URL(data.reference);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error();}catch{errors.reference='Use a complete https:// or http:// reference link.';}}
 if(raw?.consent!==true)errors.consent='Please allow us to contact you about this project.';
 return {data,errors,valid:!Object.keys(errors).length};
}
export function requestText(data,id,created){return `VETOPS STUDIO — PROJECT REQUEST\nReference: ${id}\nCreated: ${created}\nStatus: ${id.startsWith('PREVIEW-')||id.startsWith('DRAFT')?'Preview only — not sent':'New inquiry — awaiting review'}\nDestination: studio@vetopsfinancial.com\n\n${fields.map(([key,label])=>`${label}: ${data[key]||'Not provided'}`).join('\n\n')}\n\nPermission: Visitor agreed to be contacted about this project.\nThis request is not an accepted work order, quote or commitment. Scope, price and schedule require confirmation.\n`;}
