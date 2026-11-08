import {chromium} from 'playwright';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..'),profile=await mkdtemp(join(tmpdir(),'signal-orientation-'));let c;
try{
 c=await chromium.launchPersistentContext(profile,{executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',headless:true,ignoreDefaultArgs:['--disable-extensions'],args:[`--disable-extensions-except=${root}/dist`,`--load-extension=${root}/dist`],viewport:{width:1440,height:1000}});
 const page=await c.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await c.route('https://www.linkedin.com/**',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:`<html><style>body{margin:0;background:#111;color:white;font:16px Arial}header{height:90px;background:#222;position:sticky;top:0;z-index:10}main{display:flex;margin-left:11vw;gap:30px}.column{width:39vw}.random{padding:20px;margin-bottom:14px;border:1px solid #555;border-radius:12px;background:#222;min-height:240px}.copy{line-height:1.6}.clamped{max-height:64px;overflow:hidden}aside{width:25vw}button{color:white;background:#333}a{color:#9bd}</style><header>LinkedIn synthetic orientation fixture</header><main><div class="column"><section class="random" id="one"><a href="https://www.linkedin.com/in/jeet/"><span aria-hidden="true">Jeet Adsule</span><span hidden>View profile</span></a><div class="copy clamped" data-test-id="post-text"><p>We’re hiring a Product Intern at Example!</p><p>An exciting opportunity to join our amazing team!</p></div><div hidden><p>Apply: <a href="https://forms.gle/exact-hidden-form">Application form</a></p></div><button>more</button><button>Like</button><button>Comment</button></section><section class="random" id="two"><a href="https://www.linkedin.com/in/saket/">Saket Aryan</a><div class="copy"><p>We're Hiring | Product Manager Intern at Example!</p><p>You will build product experiments with our AI agents team.</p><p>DM me for details.</p><a href="https://www.linkedin.com/jobs/view/12345/">View job</a></div><button>Like</button><button>Comment</button></section><section class="random"><small>Promoted</small><p>Hiring a Product Manager. Sponsored promotion.</p></section><section class="random" id="three"><p>Exciting opportunities for 2026 graduates: research analyst interns.</p><p>You will research consumer markets. Link is in the comments.</p><div hidden>Email your resume to <a href="mailto:careers%2B2026@company.co.in?subject=CV">careers+2026@company.co.in</a></div></section></div><aside>Privacy · Help Center<p>Hiring advice in sidebar must not be tagged.</p></aside></main><script>new MutationObserver(records=>{for(const record of records)for(const n of record.addedNodes)if(n.nodeType===1&&n.hasAttribute('data-signal-note')&&n.shadowRoot?.querySelector('.loading'))window.sawLoading=true;}).observe(document.documentElement,{childList:true});window.originalPosts=[...document.querySelectorAll('.random')].map(e=>({text:e.textContent,height:e.getBoundingClientRect().height}));</script></html>`}));
 await page.goto('https://www.linkedin.com/search/results/content/?keywords=product');
 await page.waitForFunction(()=>[...document.querySelectorAll('[data-signal-note]')].filter(n=>n.shadowRoot?.querySelector('.note[aria-busy="false"]')).length===3);
 assert.equal(await page.locator('[data-signal-note]').count(),3);assert.equal(await page.evaluate(()=>window.sawLoading),true,'Pending post indicator must render before classification completes');
 assert.equal(await page.locator('.toolbar').count(),0);
 assert.ok(await page.locator('[data-signal-note]').evaluateAll(nodes=>nodes.every(n=>{const lines=n.shadowRoot.querySelectorAll('.role-line');return lines.length===2&&[...lines].every(line=>{const style=getComputedStyle(line);return style.whiteSpace==='normal'&&style.textOverflow!=='ellipsis'&&line.scrollWidth<=line.clientWidth+1;});})), 'Two brief explanations must wrap without ellipses or horizontal clipping');
 assert.ok(await page.locator('[data-signal-note]').first().evaluate(n=>n.getBoundingClientRect().width>=400),'Notes should be wider when space allows');
 assert.equal(await page.getByText('Author not detected',{exact:true}).count(),0);
 await page.getByText('Jeet Adsule',{exact:true}).last().waitFor();
 await page.getByText('Research user needs, test ideas and support product delivery.',{exact:true}).waitFor();
 const apply=page.getByRole('link',{name:'Apply ↗',exact:true});assert.equal(await apply.count(),2);
 assert.equal(await apply.nth(0).getAttribute('href'),'https://forms.gle/exact-hidden-form');assert.equal(await apply.nth(1).getAttribute('href'),'https://www.linkedin.com/jobs/view/12345/');
 await page.locator('#one a[href="https://forms.gle/exact-hidden-form"]').evaluate(a=>a.setAttribute('href','https://forms.gle/updated-hidden-form'));
 await page.waitForFunction(()=>[...document.querySelectorAll('[data-signal-note]')].some(n=>n.shadowRoot?.querySelector('a[href="https://forms.gle/updated-hidden-form"]')));
 await page.locator('#one a[href="https://forms.gle/updated-hidden-form"]').evaluate(a=>a.setAttribute('href','https://forms.gle/exact-hidden-form'));
 await page.waitForFunction(()=>[...document.querySelectorAll('[data-signal-note]')].some(n=>n.shadowRoot?.querySelector('a[href="https://forms.gle/exact-hidden-form"]')));

 const positions=()=>page.locator('[data-signal-note]').evaluateAll(nodes=>nodes.map(n=>({top:n.getBoundingClientRect().top+scrollY,left:n.getBoundingClientRect().left,text:n.shadowRoot.textContent})));
 const before=await positions();
 const verifyBounds=async()=>assert.ok(await page.evaluate(()=>[...document.querySelectorAll('[data-signal-note]')].filter(n=>getComputedStyle(n).display!=='none').every(n=>{const a=n.getBoundingClientRect();return [...document.querySelectorAll('.random')].some(p=>{const r=p.getBoundingClientRect();return a.left>=r.right+10&&Math.abs(a.top-r.top-8)<1&&a.bottom<=r.bottom+1;});})), 'Notes stay locked eight pixels below their post top and inside its bottom');
 await verifyBounds();
 await page.getByRole('button',{name:'Product Manager Intern',exact:true}).click();await page.getByRole('dialog').getByText('Need to DM',{exact:true}).waitFor();await page.keyboard.press('Escape');
 for(const y of [220,510,40,700,0]){await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(80);await verifyBounds();assert.deepEqual(await positions(),before,'Scrolling must not retag or change document anchors');}
 assert.deepEqual(await page.locator('.random').evaluateAll(nodes=>nodes.map(e=>({text:e.textContent,height:e.getBoundingClientRect().height}))),await page.evaluate(()=>window.originalPosts));
 assert.equal(await page.locator('.random [data-signal-host]').count(),0);assert.equal(await page.locator('[data-signal-collapsed]').count(),0);
 // Native expansion reflows later posts: notes must follow the new geometry without replacing identities.
 await page.locator('#one .copy').evaluate(n=>n.style.maxHeight='none');await page.waitForTimeout(400);await verifyBounds();
 assert.equal(await page.locator('[data-signal-note]').count(),3);
 await page.setViewportSize({width:850,height:800});await page.waitForTimeout(400);await verifyBounds();
 await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(400);await verifyBounds();
 // Email-only route exposes Copy directly in the compact summary, including hidden DOM.
 await c.grantPermissions(['clipboard-read','clipboard-write'],{origin:'https://www.linkedin.com'});
 await page.getByRole('button',{name:'Copy email careers+2026@company.co.in',exact:true}).click();
 assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'careers+2026@company.co.in');
 await page.getByRole('button',{name:'Copy email careers+2026@company.co.in',exact:true}).getByText('Copied',{exact:true}).waitFor();
 // An author update marking applications closed removes Apply without removing the note or post.
 await page.locator('#one [hidden] p').evaluate(n=>n.append(document.createTextNode(' Applications are now closed.')));
 const closed=page.locator('[data-signal-note]').filter({has:page.getByRole('button',{name:'Product Intern',exact:true})});
 await closed.getByText('Applications closed',{exact:true}).waitFor();assert.equal(await closed.getByRole('link').count(),0);
 assert.ok(await page.locator('[data-signal-note]').evaluateAll(nodes=>nodes.every(n=>[...n.shadowRoot.querySelectorAll('a[href]')].every(a=>/^https?:\/\//i.test(a.href)))));
 await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(150);await verifyBounds();
 await page.locator('#one .copy').evaluate(n=>{n.style.maxHeight='none';n.textContent="We're Hiring at Reelo! | Product Ops Intern & Product Marketer\nYou'll work on:\n- Debug APIs and troubleshoot integrations.\nLocation: Ahmedabad | Work from Office";});
 await page.waitForFunction(()=>[...document.querySelectorAll('[data-signal-note]')].some(n=>n.shadowRoot?.querySelector('.note-title')?.textContent==='Reelo'));
 const reelo=page.locator('[data-signal-note]').filter({has:page.getByRole('button',{name:'Product Ops Intern & Product Marketer',exact:true})});
 assert.equal(await reelo.locator('.note-title').textContent(),'Reelo');await reelo.getByText('Product Ops Intern & Product Marketer',{exact:true}).waitFor();
 await page.locator('#two .copy').evaluate(n=>n.textContent='HIRING ALERT | PUMA IS HIRING A PRODUCT INTERN!\nCompany: PUMA\nPosition: Product Intern\nLocation: Bengaluru\nStipend: ₹25,000/month');
 await page.waitForFunction(()=>[...document.querySelectorAll('[data-signal-note]')].some(n=>n.shadowRoot?.querySelector('.note-title')?.textContent==='PUMA'));
 const puma=page.locator('[data-signal-note]').filter({has:page.getByText('PUMA',{exact:true})});
 assert.equal(await puma.locator('.note-role').textContent(),'Product Intern');assert.match(await puma.locator('.role-explanation').textContent(),/Bengaluru/);assert.match(await puma.locator('.role-explanation').textContent(),/₹25,000/);
 assert.ok(await page.locator('[data-signal-note]').evaluateAll(nodes=>nodes.every(n=>!n.shadowRoot.querySelector('.role-explanation').textContent.includes('…'))));
 await page.waitForTimeout(200);await verifyBounds();
 assert.equal(errors.length,0,errors.join('\n'));
 // Validate actual glass gradients against both possible page underlays, including the gloss layer.
 await mkdir(join(root,'artifacts'),{recursive:true});
 for(const scheme of ['light','dark']){
  await page.emulateMedia({colorScheme:scheme});
  const result=await page.locator('[data-signal-note]').evaluateAll(nodes=>{
   const rgb=s=>s.match(/[\d.]+/g).map(Number),colors=s=>[...s.matchAll(/rgba?\([^)]*\)/g)].map(m=>rgb(m[0]));
   const over=(fg,bg)=>fg.slice(0,3).map((v,i)=>v*(fg[3]??1)+bg[i]*(1-(fg[3]??1)));
   const lum=c=>c.slice(0,3).map(x=>{const v=x/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
   return nodes.map(host=>{const root=host.shadowRoot,note=root.querySelector('.note'),surface=root.querySelector('.note-surface'),style=getComputedStyle(note),inner=rgb(getComputedStyle(surface).backgroundColor);
    const stops=colors(style.backgroundImage),gloss=colors(getComputedStyle(note,'::before').backgroundImage);
    const backgrounds=[];for(const page of [[255,255,255],[0,0,0]])for(const stop of stops)for(const shine of gloss)backgrounds.push(over(inner,over(shine,over(stop,page))));
    const ratios=[...root.querySelectorAll('.note-title,.note-role,.note-author,.role-line,.note-outcome,.closed-label,.apply,.copy-email')].flatMap(el=>backgrounds.map(base=>{let bg=base;const own=rgb(getComputedStyle(el).backgroundColor);bg=over(own,bg);const fg=lum(over(rgb(getComputedStyle(el).color),bg)),back=lum(bg);return (Math.max(fg,back)+.05)/(Math.min(fg,back)+.05);}));
    return {gradient:stops.length>=3&&!style.backgroundImage.includes('url('),glass:inner[3]>0&&inner[3]<1&&style.backdropFilter!=='none',minimumContrast:Math.min(...ratios)};
   });
  });
  assert.ok(result.every(r=>r.gradient&&r.glass&&r.minimumContrast>=4.5),JSON.stringify({scheme,result}));
  await page.screenshot({path:join(root,'artifacts','glass-0.9.2-'+scheme+'.png')});
  await page.locator('[data-signal-note]').first().screenshot({path:join(root,'artifacts','glass-card-0.9.2-'+scheme+'.png')});
 }
 await page.emulateMedia({colorScheme:'light'});

 await mkdir(join(root,'artifacts'),{recursive:true});await page.screenshot({path:join(root,'artifacts/orientation-0.9.2.png')});
 console.log('PASS: compact notes, no toolbar/collapse, exact direct Apply links including clamped/native job links, author recovery, ad skip, locked anchors during repeated scroll, native expansion and resize, hidden email clipboard copy, closure actions, HTTP-only display links');
}catch(error){for(const p of c?.pages()||[])console.log(await p.locator('[data-signal-host]').evaluateAll(nodes=>nodes.map(n=>n.shadowRoot?.textContent)));throw error;}finally{await c?.close();await rm(profile,{recursive:true,force:true});}
