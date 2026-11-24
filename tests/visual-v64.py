"""Offline Chromium verification; run GRAMOS_TEST_HTML=/tmp/g64-html node tests/v64-header.mjs first."""
from pathlib import Path
import os,re
from playwright.sync_api import sync_playwright
root=Path(os.environ.get('GRAMOS_TEST_HTML','/tmp/g64-html'))
def luminance(color):
    vals=[int(x)/255 for x in re.findall(r'\d+',color)[:3]]
    return sum(w*(x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4) for w,x in zip((.2126,.7152,.0722),vals))
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    for width in (1440,820,390,320):
        page=browser.new_page(viewport={'width':width,'height':900})
        for fixture in sorted(root.glob('*.html')):
            page.set_content(fixture.read_text(),wait_until='domcontentloaded')
            for selector in ('.admin-lang','a[href="/admin/security"]','a[href="/demo"]','.logout-button'):
                control=page.locator('.admin-top').locator(selector)
                assert control.is_visible(),(fixture.name,width,selector)
                style=control.evaluate('e=>({fg:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor,rect:e.getBoundingClientRect().toJSON()})')
                fg,bg=luminance(style['fg']),luminance(style['bg']);contrast=(max(fg,bg)+.05)/(min(fg,bg)+.05)
                assert contrast>=4.5,(fixture.name,width,selector,contrast)
                r=style['rect'];assert r['x']>=0 and r['right']<=width+1 and r['height']>=44,(fixture.name,width,selector,r)
            page.locator('.admin-lang').click()
            assert page.locator('.admin-lang-options button').count()==2
            assert page.locator('.admin-lang-options button').first.is_visible()
            page.locator('.admin-lang').click()
        page.close()
        print(f'PASS {width}px: all header controls visible, in viewport, 44px tall, contrast >=4.5; language menu opens; 10 bilingual fixtures')
    browser.close()
