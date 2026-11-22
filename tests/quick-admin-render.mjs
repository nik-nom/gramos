globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'https://example.supabase.co',supabaseAnonKey:'sb_publishable_test'},supabase:{createClient:()=>({})}};
globalThis.location={pathname:'/admin/login',origin:'https://example.test',search:''};
globalThis.document={title:''};
const {renderAdmin}=await import('../apps/admin/src/admin.js');
const html=await renderAdmin(['admin','login'],'mr',{admin:false,ids:[]},null);
if(!html.includes('id="loginForm"')||!html.includes('type="password"'))throw new Error('Admin form missing');
console.log('PASS admin application render: login form and password field');
