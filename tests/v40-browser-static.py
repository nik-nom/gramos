"""Offline visual QA with inline CSS and generated static page snapshots.
Run `node tests/v40-snapshots.mjs && python tests/v40-browser-static.py`.
No actual Supabase, auth or live deployment is used; this checks document layout only.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
WIDTHS=[320,390,650,820,1024,1440]
PAGES=['admin-overview','admin-home','admin-branding','admin-footer','admin-settings','admin-about','admin-news','admin-contact','admin-gallery','public-home']
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':920})
    n=0
    for name in PAGES:
        html=(ROOT/'qa'/f'{name}.html').read_text()
        for width in WIDTHS:
            page.set_viewport_size({'width':width,'height':920})
            page.set_content(html,wait_until='domcontentloaded',timeout=30000)
            dimensions=page.evaluate('''() => {
              let root=document.documentElement, body=document.body;
              let tooWide=[...document.querySelectorAll('*')].filter(el=>{let b=el.getBoundingClientRect();return b.right>innerWidth+4&&getComputedStyle(el).position!=='fixed'&&!el.closest('iframe')}).slice(0,5).map(x=>x.tagName+'.'+x.className);
              return {client:root.clientWidth,scroll:root.scrollWidth,body:body.scrollWidth,tooWide};}''')
            if dimensions['scroll']>dimensions['client']+4:
                raise AssertionError(f'Horizontal overflow: {name} at {width}px {dimensions}')
            if name=='admin-overview':
                assert page.locator('.admin-overview-card').count()==11
            if name=='admin-home':
                assert page.locator('#homeForm').count()==1
                assert page.locator('.admin-preview-wide iframe').count()==1
            if name=='admin-branding':
                assert page.locator('#navbarBrandingForm').count()==1
                assert page.locator('select[name=nav_logo_shape]').count()==1
                assert page.locator('input[name=nav_logo_url]').count()==1
            if name=='admin-footer':
                assert page.locator('#footerForm').count()==1
                assert page.locator('#footerLogoList [data-logo-row]:not([hidden])').count()==12
            if name=='public-home':
                assert page.locator('.sv-page-logo-grid img').count()==12
                assert page.locator('.sv-page-logo').first.evaluate("e=>getComputedStyle(e).objectFit")=='contain'
                assert page.locator('.sv-more-panel').count()>=1
                cards=page.locator('.sv-page-logo-grid>a').evaluate_all("es=>es.map(e=>{let r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})")
                for a_index,a in enumerate(cards):
                    for b in cards[a_index+1:]:
                        overlap=min(a[2],b[2])-max(a[0],b[0])>2 and min(a[3],b[3])-max(a[1],b[1])>2
                        assert not overlap, f'Bottom logo blocks overlap at {width}px: {a} {b}'
            n+=1
            if (name,width) in [('admin-home',1440),('admin-footer',390),('public-home',390),('public-home',1440)]:
                page.screenshot(path=str(ROOT/'qa'/f'{name}-{width}.png'),full_page=True,timeout=30000)
            print(f'PASS {name} at {width}px (document {dimensions["scroll"]} / viewport {dimensions["client"]})')
    print(f'PASS offline browser layout: {n} pages and viewport combinations. No horizontal scroll overflow.')
    browser.close()
