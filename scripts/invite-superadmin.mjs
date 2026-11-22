/**
 * GramOS 4.9.1: One-time Supabase Auth invitation for the specifically authorized
 * GramOS Super Admin email. Uses the OWNER's legacy service_role key only in
 * local process memory. Never store this key in a file or Git repository.
 *
 * Usage: SUPABASE_SERVICE_ROLE_KEY=<private env> node scripts/invite-superadmin.mjs
 * Dry-run: node scripts/invite-superadmin.mjs --dry-run (with same env)
 */
import {pathToFileURL} from 'node:url';

export const PROJECT = 'https://nttnrfyidokwnkqrukdb.supabase.co';
export const TARGET_EMAIL = 'sachinkalkumbe041@gmail.com';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function inviteSuperAdmin({key, fetchImpl = fetch, dryRun = false} = {}) {
  if (!key || typeof key !== 'string' || key.trim().split('.').length !== 3) {
    throw new Error('Missing Supabase legacy service_role key. Provide it via the SUPABASE_SERVICE_ROLE_KEY environment variable; NEVER paste it into chat or GitHub.');
  }
  const secret = key.trim();
  const headers = {apikey: secret, Authorization: `Bearer ${secret}`, Accept:'application/json', 'Content-Type':'application/json'};
  const api = async (path, options={}) => {
    const res=await fetchImpl(`${PROJECT}${path}`, {headers, ...options});
    let body;
    try { body = await res.json(); } catch { body = {}; }
    if (!res.ok) {
      const msg = String(body.msg || body.message || body.error_description || body.error || `Supabase error ${res.status}`);
      // Do not log server response objects, secrets or tokens.
      const error = new Error(msg.slice(0,200)); error.status=res.status; throw error;
    }
    return body;
  };
  let existing=null;
  // Supabase Auth Admin users endpoint is paginated. Never guess a user ID.
  for(let page=1;page<=100;page++) {
    const result=await api(`/auth/v1/admin/users?page=${page}&per_page=100`);
    const users=Array.isArray(result.users)?result.users:[];
    existing=users.find(u=>String(u.email||'').toLowerCase()===TARGET_EMAIL)||null;
    if(existing || users.length<100)break;
    if(page===100)throw new Error('Unable to check all existing Supabase Auth accounts safely.');
  }
  if(dryRun) return {status:'dry-run',exists:Boolean(existing),email:TARGET_EMAIL,verified:Boolean(existing?.email_confirmed_at)};
  let id;
  let invited=false;
  if(existing){
    if(!existing.email_confirmed_at)throw new Error('The email already exists in Supabase but is not verified. Confirm its email address before granting Super Admin access.');
    id=existing.id;
  } else {
    // Invitation sends a link to the owner's mailbox. No password is accepted,
    // printed, stored, auto-confirmed, or shared by this script.
    const user=await api('/auth/v1/invite',{method:'POST',body:JSON.stringify({email:TARGET_EMAIL})});
    id=user.id || user.user?.id;
    if(String(user.email || user.user?.email || '').toLowerCase()!==TARGET_EMAIL) {
      throw new Error('Supabase returned a different invitation recipient; no privilege was granted.');
    }
    invited=true;
  }
  if(!UUID.test(String(id||'')))throw new Error('Supabase did not return a valid Auth user ID. No role was granted.');
  // Grant only to the exact existing/invited Auth user's UUID.
  await api('/rest/v1/platform_admins?on_conflict=user_id',{
    method:'POST',headers:{...headers,Prefer:'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify({user_id:id})
  });
  const roles=await api(`/rest/v1/platform_admins?user_id=eq.${id}&select=user_id&limit=1`);
  if(!Array.isArray(roles)||roles.length!==1||roles[0].user_id!==id)throw new Error('Role verification failed; check platform_admins before proceeding.');
  return {status:invited?'invitation-sent':'verified-existing-account-granted',email:TARGET_EMAIL,role:'Super Admin'};
}

if(process.argv[1] && pathToFileURL(process.argv[1]).href===import.meta.url){
  inviteSuperAdmin({key:process.env.SUPABASE_SERVICE_ROLE_KEY,dryRun:process.argv.includes('--dry-run')})
    .then(result=>{
      console.log(`GramOS account: ${result.email}`);
      console.log(`Result: ${result.status}`);
      if(result.status==='invitation-sent')console.log('Next: open the Supabase invitation email, complete the sign-in, and set a NEW password.');
      if(result.status==='verified-existing-account-granted')console.log('Super Admin permission verified. Sign in using the existing account.');
    })
    .catch(error=>{console.error(`Super Admin setup stopped safely: ${error.message}`);process.exitCode=1;});
}
