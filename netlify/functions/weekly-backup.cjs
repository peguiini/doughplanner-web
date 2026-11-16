const {schedule}=require('@netlify/functions');
const endpoint=()=>process.env.SUPABASE_URL?.replace(/\/$/,'');
const key=()=>process.env.SUPABASE_SERVICE_ROLE_KEY;
const auth=()=>({apikey:key()});
exports.handler=schedule('0 1 * * 0',async()=>{
 if(!endpoint()||!key())throw new Error('Supabase backup credentials missing');
 const get=async path=>{const r=await fetch(`${endpoint()}/rest/v1/${path}`,{headers:auth()});if(!r.ok)throw new Error(`${path}: ${r.status}`);return r.json()};
 const recipes=await get('recipes?select=*&limit=10000');
 const history=await get('recipe_history?select=*&limit=100000');
 const snapshot={created_at:new Date().toISOString(),recipes,history};
 const filename=`weekly-${new Date().toISOString().slice(0,10)}.json`;
 const path=`${endpoint()}/storage/v1/object/doughplanner-backups/${filename}`;
 const response=await fetch(path,{method:'POST',headers:{...auth(),'Content-Type':'application/json','x-upsert':'true'},body:JSON.stringify(snapshot)});
 if(!response.ok)throw new Error(`Backup upload failed: ${response.status} ${await response.text()}`);
 // Verify backup exists and is nonempty.
 const check=await fetch(path,{headers:auth()});
 if(!check.ok||(await check.text()).length<100)throw new Error('Backup verification failed');
 console.log('Verified private backup',filename,recipes.length,'recipes',history.length,'history entries');
});
