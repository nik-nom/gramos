from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
source=(ROOT/'src/main.js').read_text()
start=source.index('function enablePublicReadMore(){')
end=source.index('function startCarousels(){',start)
script=source[start:end]
html=(ROOT/'qa/public-home.html').read_text()
count=0
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width in [320,390,820,1440]:
  page=b.new_page(viewport={'width':width,'height':900})
  page.set_content(html,wait_until='domcontentloaded')
  found=page.evaluate('''(script)=>{
   const app=document.getElementById('app');const lang='en';const publicLongText=new Map();
   const source=script+'; enablePublicReadMore();';eval(source);
   app.addEventListener('click',(event)=>{
    const btn=event.target.closest('[data-action]');if(!btn)return;
    const action=btn.dataset.action;
    if(action==='public-read-more'){const dialog=document.getElementById('publicTextModal');
      const text=publicLongText.get(btn.dataset.id);if(dialog&&text){document.getElementById('publicTextModalContent').textContent=text;dialog.showModal();}}
    if(action==='public-more-close')document.getElementById('publicTextModal')?.close();
   });
   return {buttons:document.querySelectorAll('.sv-public-more-button').length,dialogs:document.querySelectorAll('#publicTextModal').length};
 }''',script)
  assert found['buttons']>=1, f'No More button at {width}px'
  assert found['dialogs']==1, 'Preview dialog missing'
  page.locator('.sv-public-more-button:visible').first.click()
  modal=page.locator('#publicTextModal')
  assert modal.evaluate('(e)=>e.open') is True
  assert len(page.locator('#publicTextModalContent').inner_text())>185
  page.locator('.sv-public-more-close').click()
  assert modal.evaluate('(e)=>e.open') is False
  dimension=page.evaluate('({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})')
  assert dimension['scroll']<=dimension['client']+1, f'Horizontal overflow after read more at {width}px'
  print(f'PASS public Read more dialog at {width}px, {found["buttons"]} expandable paragraphs, no overflow')
  page.close();count+=1
 b.close()
print('PASS v4.2 public expandable text behavior:',count,'viewport sizes')
