import assert from 'node:assert/strict';
import {inviteSuperAdmin,TARGET_EMAIL,PROJECT} from '../scripts/invite-superadmin.mjs';
const id='d0ab2701-4c5a-44c5-bd1d-fb18238dce78';
const jwt=['abc','def','ghi'].join('.');
const response=(body,ok=true,status=200)=>({ok,status,json:async()=>body});
const calls=[];
const fetchImpl=async (url, options)=>{
  assert(url.startsWith(PROJECT+'/'));
  assert.equal(options.headers.apikey,jwt);
  calls.push({url, method:options.method||'GET'});
  if(url.includes('/auth/v1/admin/users'))return response({users:[]});
  if(url.endsWith('/auth/v1/invite')){assert.equal(JSON.parse(options.body).email,TARGET_EMAIL);return response({id,email:TARGET_EMAIL});}
  if(url.includes('platform_admins') && options.method==='POST'){
    assert.equal(JSON.parse(options.body).user_id,id);
    return response({});
  }
  if(url.includes('platform_admins'))return response([{user_id:id}]);
  throw new Error(`Unexpected route: ${url}`);
};
const result=await inviteSuperAdmin({key:jwt,fetchImpl});
assert.equal(result.status,'invitation-sent');
assert.equal(calls.filter(x=>x.url.endsWith('/auth/v1/invite')).length,1);
assert.equal(calls.filter(x=>x.method==='POST').length,2);
const dryCalls=[];
const dry=await inviteSuperAdmin({key:jwt,dryRun:true,fetchImpl:async (url,options)=>{dryCalls.push(url);return response({users:[]});}});
assert.equal(dry.status,'dry-run');
assert.equal(dryCalls.length,1);
await assert.rejects(inviteSuperAdmin({key:'bad'}),/service_role/);
const existingFetch=async (url,options)=>{
  if(url.includes('/admin/users'))return response({users:[{id,email:TARGET_EMAIL,email_confirmed_at:'2026-11-22T09:00:00Z'}]});
  if(url.includes('platform_admins')&&options.method==='POST')return response({});
  if(url.includes('platform_admins'))return response([{user_id:id}]);
  throw new Error('Unexpected request');
};
assert.equal((await inviteSuperAdmin({key:jwt,fetchImpl:existingFetch})).status,'verified-existing-account-granted');
await assert.rejects(inviteSuperAdmin({key:jwt,fetchImpl:async()=>response({users:[{id,email:TARGET_EMAIL,email_confirmed_at:null}]})}),/not verified/);
console.log('PASS v4.9.1: safe Auth invitation, existing verified user, fail-closed for unverified email, no password, idempotent role grant.');
