const crypto = require('node:crypto');
const base = () => process.env.SUPABASE_URL?.replace(/\/$/, '');
const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = () => ({ apikey: secret(), 'Content-Type': 'application/json' });
const reply = (status,body) => ({statusCode:status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(body)});
async function db(path,options={}) {
 const response=await fetch(`${base()}/rest/v1/${path}`,{...options,headers:{...headers(),...(options.headers||{})}});
 const raw=await response.text(); let value;try{value=raw?JSON.parse(raw):null}catch{value={message:raw}}
 if(!response.ok) throw Object.assign(new Error(value?.message||`Database error ${response.status}`),{status:response.status});
 return value;
}
function isAdmin(event) {
 const expected=process.env.DOUGHPLANNER_ADMIN_SECRET;
 const provided=event.headers['x-dp-admin']||event.headers['X-Dp-Admin']||'';
 if(!expected||!provided)return false;
 const a=crypto.createHash('sha256').update(provided).digest();
 const b=crypto.createHash('sha256').update(expected).digest();
 return crypto.timingSafeEqual(a,b);
}
async function alert(kind,description) {
 if(!process.env.RESEND_API_KEY)return;
 const claim=await db('rpc/dp_claim_alert',{method:'POST',body:JSON.stringify({p_kind:kind,p_interval_minutes:60})});
 if(!claim)return;
 const email=process.env.ALERT_EMAIL||'peha0003@gmail.com';
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.ALERT_FROM||'Dough Planner <onboarding@resend.dev>',to:[email],subject:`Dough Planner alert: ${kind}`,text:`${description}\nTime: ${new Date().toISOString()}\n`})});
 if(!response.ok) console.error('Resend failed:',response.status,await response.text());
}
async function checkVolume(){
 const since15=new Date(Date.now()-15*60*1000).toISOString();
 const since60=new Date(Date.now()-60*60*1000).toISOString();
 const recent=await db(`recipe_save_events?select=recipe_id,created_at&created_at=gte.${encodeURIComponent(since60)}&limit=1000`);
 const count15=recent.filter(e=>e.created_at>=since15).length;
 if(count15>=10)await alert('10 saves / 15 minutes',`${count15} recipe saves in 15 minutes.`);
 if(recent.length>=20)await alert('20 saves / hour',`${recent.length} recipe saves in 60 minutes.`);
}
exports.handler=async event=>{
 if(!base()||!secret())return reply(503,{error:'Database not configured'});
 try {
  const method=event.httpMethod;
  const query=event.queryStringParameters||{};
  const admin=isAdmin(event);
  if(method==='GET'&&query.history){
   const id=encodeURIComponent(query.history);
   const rows=await db(`recipe_history?select=id,recipe_id,version,previous_data,new_data,action,changed_at&recipe_id=eq.${id}&order=changed_at.desc&limit=100`);
   return reply(200,{history:rows,admin});
  }
  if(method==='GET'){
   const rows=await db('recipes?select=id,data,version,archived,updated_at&deleted_at=is.null&order=updated_at.asc&limit=1000');
   return reply(200,{recipes:rows,admin});
  }
  const body=JSON.parse(event.body||'{}');
  if(method==='POST'&&body.action==='save'){
   const data=body.recipe;
   if(!data||typeof data!=='object'||Array.isArray(data)||typeof data.id!=='string')return reply(400,{error:'Invalid recipe'});
   const ip=event.headers['x-nf-client-connection-ip']||event.headers['client-ip']||event.headers['x-forwarded-for']?.split(',')[0]?.trim()||'unknown';
   const actor=crypto.createHash('sha256').update(`${process.env.RATE_LIMIT_SALT||'dp'}:${ip}`).digest('hex');
   const result=await db('rpc/dp_save_recipe',{method:'POST',body:JSON.stringify({p_id:data.id,p_data:data,p_version:Number(body.version)||0,p_actor:actor,p_admin:admin})});
   try{await checkVolume()}catch(e){console.error('Activity alert failed',e)}
   return reply(200,{recipe:result,admin});
  }
  if(method==='POST'&&body.action==='delete'){
   if(!admin){try{await alert('Unauthorized deletion attempt','An unapproved client attempted to delete a recipe.')}catch(e){console.error(e)}return reply(403,{error:'Administrator access required'});}
   const deleted=await db('rpc/dp_delete_recipe',{method:'POST',body:JSON.stringify({p_id:String(body.id||'')})});
   return reply(200,{deleted});
  }
  return reply(405,{error:'Unsupported action'});
 }catch(e){
  console.error('Recipe API:',e.message);
  const conflict=/CONFLICT/.test(e.message),rate=/RATE_LIMIT/.test(e.message);
  return reply(conflict?409:rate?429:500,{error:conflict?'Recipe changed elsewhere. Reload before saving.':rate?'Maximum two saves per minute. Please wait and try again.':'Unable to complete request.'});
 }
};
