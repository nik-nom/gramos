// GramOS admin startup recovery, v6.9.1. No authentication bypass or database writes.
(function(){
 const app=document.getElementById('app');
 if(!app)return;
 let finished=false;
 function fail(message,error){
   if(finished)return; finished=true;clearTimeout(timer);
   console.error('GramOS startup:',message,error||'');
   const box=document.createElement('div');box.className='error-screen';
   const title=document.createElement('h1');title.textContent='Admin could not start';
   const text=document.createElement('p');text.textContent=message;
   const button=document.createElement('button');button.type='button';button.className='btn btn-dark';button.textContent='Retry';button.addEventListener('click',()=>location.reload());
   box.append(title,text,button);app.replaceChildren(box);
 }
 const timer=setTimeout(()=>fail('Startup timed out. Check your connection and retry.'),18000);
 import('/src/main.js?v=6.9.1').then(()=>{finished=true;clearTimeout(timer);}).catch(error=>fail('A required admin JavaScript file did not load. Retry, or ask the administrator to check the deployment and browser console.',error));
})();
