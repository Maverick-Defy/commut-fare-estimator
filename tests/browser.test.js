// Headless Chrome: client view of both pages, desktop and mobile. Map services are mocked so tests run offline-safe.
const puppeteer = require('puppeteer-core'), path = require('path'), assert = require('assert'), fs = require('fs');
const ROOT = process.env.TEST_BASE || ('file://' + path.join(__dirname, '..') + '/');
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const SHOTS = process.env.SHOTS || '/workspace/commut-fixed-screens';
fs.mkdirSync(SHOTS, {recursive: true});
let n = 0;
const ok = (c, m) => { n++; assert(c, m); };
const JARGON = /margin|polic(y|ies)|rume|break-?even|profit|divisor|internal|provisional|draft|passenger-km|supplier|0\.9|11\.7/i;

async function setup(browser, vp) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.evaluateOnNewDocument(() => {
    window.__calls = [];
    const real = window.fetch.bind(window);
    window.fetch = (u) => {
      u = String(u);
      const json = (o) => Promise.resolve({ok: true, json: () => Promise.resolve(o)});
      if (u.includes('nominatim.openstreetmap.org/reverse')) return json({display_name: 'Mapped point, Lagos, Nigeria'});
      if (u.includes('nominatim')) { window.__calls.push(u);
        return json(/shiro/i.test(decodeURIComponent(u)) ? [{display_name:'Shiro Lagos, Lekki, Lagos, Nigeria', lat:'6.44', lon:'3.55'}] : [{display_name:'Agege Motor Road, Agege, Lagos, Nigeria', lat:'6.62', lon:'3.32'}]); }
      if (u.includes('router.project-osrm.org')) { window.__calls.push(u);
        const pts = u.split('/driving/')[1].split('?')[0].split(';').length;
        if (u.includes('geometries=geojson')) return json({code:'Ok', routes:[{distance:20000, geometry:{coordinates:[[3.32,6.62],[3.55,6.44]]}}]});
        if (pts > 2) return json({code:'Ok', routes:[{legs:[{distance:20000},{distance:2500},{distance:7000},{distance:6000}]}]});
        return json({code:'Ok', routes:[{distance: /buses/.test(location.pathname) ? 75432 : 20000}]}); }
      return real(u);
    };
  });
  return {page, errors};
}

// WCAG contrast helpers
const lum = ([r,g,b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const rgb = s => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
async function brandTests(page, label, file) {
  // Official logo in the header, loaded, and the orange sampled from it
  ok(await page.$eval('header .brand img', i => i.complete && i.naturalWidth >= 96 && i.getAttribute('src') === 'logo-96.png'), label + ' ' + file + ': official logo loaded in header');
  ok(await page.$eval('header', h => getComputedStyle(h).backgroundColor) === 'rgb(232, 117, 26)', 'header uses the logo orange #e8751a');
  ok(await page.$('header svg') === null, 'no self-drawn svg mark left');
  ok(await page.$eval('link[rel="apple-touch-icon"]', l => l.getAttribute('href')) === 'apple-touch-icon.png', 'apple touch icon');
  ok(await page.$eval('meta[property="og:image"]', m => m.content.endsWith('/og.png')), 'og image set');
  // AA contrast on the colours the browser actually renders
  const pairs = await page.evaluate(() => {
    const g = (sel, prop) => { const e = document.querySelector(sel); return e ? getComputedStyle(e)[prop] : null; };
    return {
      headerText: [g('header h1','color'), g('header','backgroundColor')],
      brandText: [g('header .brand span','color'), g('header','backgroundColor')],
      body: [g('body','color'), g('body','backgroundColor')],
      muted: [g('.note','color'), g('body','backgroundColor')],
      tabOn: [g('#sitetabs a.on','color'), g('#sitetabs a.on','backgroundColor')],
      tabOff: [g('#sitetabs a:not(.on)','color'), g('#sitetabs a:not(.on)','backgroundColor')],
      lock: [g('.lock','color'), g('.lock','backgroundColor')],
      ratesH: [g('.rates h2','color'), g('.rates','backgroundColor')],
      fixedval: [g('.fixedval','color'), g('.fixedval','backgroundColor')],
      ghost: [g('.ghost','color'), g('.ghost','backgroundColor')],
    };
  });
  for (const [k, [fg, bg]] of Object.entries(pairs)) { if (!fg) continue; const c = cr(rgb(fg), rgb(bg)); ok(c >= 4.5, label + ' ' + file + ' contrast ' + k + ' = ' + c.toFixed(2) + ' (needs 4.5)'); }
}
const bodyText = page => page.evaluate(() => document.body.innerText);

async function carTests(page, errors, label, vp) {
  await page.goto(ROOT + 'index.html', {waitUntil: 'load'});
  const text = id => page.$eval(id, e => e.innerText);
  // Page basics
  ok((await page.title()) === 'Commut Fare Estimator: Car rides', label + ' car title');
  ok(await page.$eval('meta[name=description]', e => e.content.length > 30), 'meta description');
  for (const p of ['og:title','og:description','og:image','og:url','og:type']) ok(await page.$('meta[property="' + p + '"]') !== null, 'og tag ' + p);
  ok(await page.$('meta[name="twitter:card"]') !== null, 'twitter card');
  ok(await page.$('link[rel=icon]') !== null, 'favicon link');
  ok(await page.$eval('html', e => e.lang) === 'en', 'html lang');
  ok(await page.$('main#main') !== null && await page.$('h1') !== null, 'landmarks');
  await brandTests(page, label, 'car');
  const prim = await page.$eval('#go', e => [getComputedStyle(e).color, getComputedStyle(e).backgroundColor]); ok(cr(rgb(prim[0]), rgb(prim[1])) >= 4.5, 'primary button contrast >= 4.5');
  // Locked rates: shown, not inputs
  ok((await text('#allow')) === '\u20A6150' && (await text('#rate')) === '\u20A6300 per km', 'fixed rates shown');
  ok(await page.$eval('#allow', e => e.tagName) === 'SPAN' && await page.$eval('#rate', e => e.tagName) === 'SPAN', 'rates are not inputs');
  ok((await page.$$('input#allow, input#rate, input#fee, input#vat')).length === 0, 'no editable rate, fee or VAT inputs');
  const t0 = await bodyText(page);
  ok(t0.includes('Commut standard rates') && t0.includes('fixed by Commut'), 'standard rates and fixed note');
  ok(!JARGON.test(t0), 'no internal jargon on car page: ' + (t0.match(JARGON) || [''])[0]);
  ok(await page.$$eval('#allow, #rate', els => els.every(e => e.getAttribute('contenteditable') === null && e.tabIndex < 0)), 'rates not editable or focusable');
  await page.screenshot({path: path.join(SHOTS, 'car-' + label + '-1-start.png'), fullPage: true});
  // Tamper with the DOM and the globals: results must still use 150 and 300
  await page.evaluate(() => { document.getElementById('allow').textContent = '\u20A69999'; document.getElementById('allow').dataset.fixed = '9999'; document.getElementById('rate').textContent = '\u20A61 per km'; try { FIXED_CAR.rate = 1; FIXED_CAR.allowance = 1; } catch (e) {} });
  // Flow: destination and pickup
  await page.type('#dest', 'Shiro Lagos');
  await page.waitForSelector('#sugg-dest div:not(.none)', {visible: true, timeout: 12000});
  await page.click('#sugg-dest div:not(.none)');
  const pk = await page.$('#pickups input'); ok(!!pk, 'pickup input exists');
  ok(await page.$eval('#pickups input', e => !!e.id && !!document.querySelector('label[for="' + e.id + '"]')), 'pickup input has a label');
  await page.type('#pickups input', 'Agege Motor Road');
  await page.waitForSelector('#pickups .sugg div:not(.none)', {visible: true, timeout: 12000});
  await page.$eval('#pickups .sugg div:not(.none)', e => e.click());
  await page.click('#go');
  await page.waitForFunction(() => document.getElementById('results').innerText.includes('Your fare per seat'), {timeout: 15000});
  let r = await text('#results');
  ok(r.includes('\u20A62,050'), 'fare per seat \u20A62,050 (20 km, 3 riders, fixed rates survive tampering)');
  ok(r.includes('\u20A66,150') && r.includes('\u20A6150 + 20.0 km x \u20A6300 per km'), 'whole car journey \u20A66,150 shown with the fixed rates');
  ok(!JARGON.test(r) && !/\bfee\b|VAT/i.test(r), 'no jargon, fee or VAT in car results');
  await page.evaluate(() => { document.getElementById('allow').textContent = '\u20A6150'; document.getElementById('allow').dataset.fixed = '150'; document.getElementById('rate').textContent = '\u20A6300 per km'; });
  await page.screenshot({path: path.join(SHOTS, 'car-' + label + '-2-results.png'), fullPage: true});
  // Share between 4
  await page.click('#mode4'); await page.click('#go');
  await page.waitForFunction(() => document.getElementById('results').innerText.includes('\u20A61,538'), {timeout: 15000});
  ok(true, '4 riders gives \u20A61,538');
  // Return journey
  await page.click('#mode3'); await page.click('#ret'); await page.click('#go');
  await page.waitForFunction(() => document.getElementById('results').innerText.includes('\u20A64,100'), {timeout: 15000});
  ok((await text('#results')).includes('Your round trip fare per seat'), 'round trip \u20A64,100');
  const calls = await page.evaluate(() => window.__calls);
  ok(calls.some(u => u.includes('countrycodes=ng')), 'nominatim biased to Nigeria'); ok(calls.some(u => u.includes('router.project-osrm.org')), 'osrm used');
  // Bad input handled gracefully
  await page.reload({waitUntil: 'load'});
  await page.click('#go');
  ok((await text('#msg')).toLowerCase().includes('destination'), 'asks for a destination with no console error');
  await page.$eval('#seats', e => { e.value = '0'; e.dispatchEvent(new Event('input')); });
  await page.click('#go');
  ok((await text('#msg')).includes('riders'), 'rider count validated');
  // Layout
  ok(!(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)), label + ' car: no horizontal overflow');
  ok(errors.length === 0, 'no console errors on car page (' + label + '): ' + errors.join(' | '));
}

async function busTests(page, errors, label) {
  await page.goto(ROOT + 'buses.html', {waitUntil: 'load'});
  const text = id => page.$eval(id, e => e.innerText);
  const setVal = async (sel, v) => { await page.$eval(sel, e => { e.value = ''; }); await page.type(sel, String(v)); };
  const tab = t => page.click('#tabs button[data-tab="' + t + '"]');
  ok((await page.title()) === 'Commut Fare Estimator: Event buses', label + ' bus title');
  for (const p of ['og:title','og:description','og:image','og:url']) ok(await page.$('meta[property="' + p + '"]') !== null, 'og tag ' + p);
  ok(await page.$('link[rel=icon]') !== null, 'favicon');
  await brandTests(page, label, 'buses');
  const sel = await page.$eval('#tabs button.on', e => [getComputedStyle(e).color, getComputedStyle(e).backgroundColor]); ok(cr(rgb(sel[0]), rgb(sel[1])) >= 4.5, 'selected bus tab contrast >= 4.5');
  // Tabs: departure check is gone
  const tabNames = await page.$$eval('#tabs button', b => b.map(x => x.dataset.tab));
  ok(tabNames.join() === 'oneway,long,short,shuttle', 'four client tabs, no departure check');
  ok(await page.$('#tab-depart') === null && await page.$('#d-out') === null, 'no departure check in the page');
  // Fixed seats: shown, not an input
  ok((await text('#fixed-seats')) === '14 seats' && await page.$eval('#fixed-seats', e => e.tagName) === 'SPAN', 'fixed seats shown, not an input');
  ok((await page.$$('#o-margin,#o-seats,#l-cap,#l-margin,#s-pax,#s-margin,#m-cap,#m-margin,#d-margin,#d-cap')).length === 0, 'no margin, seats or passenger inputs in the DOM');
  const t0 = await bodyText(page);
  ok(t0.includes('Commut standard rates') && t0.includes('fixed by Commut'), 'standard rates and fixed note');
  // One-way
  const o = await text('#o-out');
  for (const f of ['\u20A6200,400','\u20A611,000','\u20A611,500','\u20A615,200','\u20A618,300','\u20A644,000','\u20A634,500','\u20A630,400','\u20A691,500']) ok(o.includes(f), 'one-way shows ' + f);
  ok((await text('#o-total')) === '\u20A6200,400', 'one-way trip total');
  ok(!JARGON.test(o), 'no jargon in one-way results: ' + (o.match(JARGON) || [''])[0]);
  ok(!/profit|margin|break/i.test(o), 'no profit or margin figures');
  await page.screenshot({path: path.join(SHOTS, 'buses-' + label + '-1-stops.png'), fullPage: true});
  // Tamper: fake inputs with the locked ids and altered text must change nothing
  await page.evaluate(() => {
    document.getElementById('fixed-seats').textContent = '99 seats';
    ['l-cap','l-margin','o-margin','o-seats','s-pax','s-margin','m-cap','m-margin'].forEach(id => { const i = document.createElement('input'); i.id = id; i.value = '50'; i.style.display = 'none'; document.body.appendChild(i); });
    try { FIXED.seats = 99; FIXED.marginPct = 50; } catch (e) {}
  });
  await setVal('#o-cost', 180000);
  ok((await text('#o-total')) === '\u20A6200,400', 'one-way unchanged after tampering');
  // Editable per trip: hire cost, km, passengers
  await setVal('#o-cost', 90000);
  ok((await text('#o-total')) !== '\u20A6200,400', 'hire cost is editable');
  await setVal('#o-cost', 180000);
  await page.$$eval('.h-km', e => { e[3].value = '40'; e[3].dispatchEvent(new Event('input')); });
  ok((await text('#o-out')).includes('40 km'), 'distance is editable');
  await page.$$eval('.h-pax', e => { e[0].value = '6'; e[0].dispatchEvent(new Event('input')); });
  ok((await text('#o-msg')).includes('more than') === false && (await text('#o-msg')).includes('14 seats'), 'over-seat warning at 16 passengers');
  await page.$$eval('.h-pax', e => { e[0].value = '4'; e[0].dispatchEvent(new Event('input')); });
  await page.$$eval('.h-km', e => { e[3].value = '35'; e[3].dispatchEvent(new Event('input')); });
  ok((await text('#o-total')) === '\u20A6200,400', 'back to the example');
  // reorder + add/remove
  await page.$$eval('.h-down', b => b[0].click());
  ok((await text('#o-msg')).includes('closer than'), 'out-of-order warning');
  await page.$$eval('.h-up', b => b[1].click());
  await page.click('#o-add'); ok((await page.$$('.hrow')).length === 5, 'stop added');
  await page.$$eval('.h-rm', b => b[4].click()); ok((await page.$$('.hrow')).length === 4, 'stop removed');
  ok((await page.$$eval('.hrow input', els => els.every(e => e.getAttribute('aria-label')))), 'stop inputs have accessible names');
  // Map lookup (mocked)
  await page.reload({waitUntil: 'load'});
  await page.type('#o-venue', 'Shiro Lagos');
  await page.waitForSelector('#o-venue-sugg div:not(.none)', {visible: true, timeout: 12000});
  await page.click('#o-venue-sugg div:not(.none)');
  for (let i = 0; i < 4; i++) {
    await page.$$eval('.h-find', (b, i) => b[i].click(), i);
    const qs = await page.$$('.h-q'); await qs[i].click({clickCount: 3}); await qs[i].type('Agege Motor Road');
    await page.waitForSelector('.hrow:nth-child(' + (i + 1) + ') .h-sugg div:not(.none)', {visible: true, timeout: 12000});
    await page.$eval('.hrow:nth-child(' + (i + 1) + ') .h-sugg div:not(.none)', e => e.click());
  }
  await page.click('#o-fetch');
  await page.waitForFunction(() => document.querySelectorAll('.h-km')[3].value === '35.5', {timeout: 10000});
  ok((await page.$$eval('.h-km', e => e.map(x => x.value))).join() === '20,22.5,29.5,35.5', 'cumulative distances from the map');
  await page.reload({waitUntil: 'load'});
  // Long distance
  await tab('long');
  ok(await page.$eval('#t-long', e => e.getAttribute('aria-selected')) === 'true' && await page.$eval('#t-oneway', e => e.getAttribute('aria-selected')) === 'false', 'aria-selected follows the tab');
  const l = await text('#l-out');
  for (const f of ['\u20A623,100','\u20A624,900','\u20A623,700','\u20A6323,400','\u20A6348,600','\u20A6331,800']) ok(l.includes(f), 'long shows ' + f);
  ok(!JARGON.test(l) && !/rate per km|profit|margin/i.test(l), 'no internal figures in long results');
  await page.screenshot({path: path.join(SHOTS, 'buses-' + label + '-2-long.png'), fullPage: true});
  await page.evaluate(() => { const i = document.createElement('input'); i.id = 'l-margin'; i.value = '50'; document.body.appendChild(i); });
  await setVal('#l-hire', 290000);
  ok((await text('#l-out')).includes('\u20A623,100'), 'long unchanged after tampering');
  await page.$$eval('.c-km', e => { e[0].value = '100'; e[0].dispatchEvent(new Event('input')); });
  ok((await text('#l-out')).includes('\u20A630,300'), 'corridor distance editable (100 km -> \u20A630,300)');
  await page.$$eval('.c-rm', b => b[0].click()); ok((await page.$$('.crow')).length === 3, 'drop-off removed');
  await page.reload({waitUntil: 'load'}); await tab('long');
  await page.type('#l-venue', 'Shiro Lagos');
  await page.waitForSelector('#l-venue-sugg div:not(.none)', {visible: true, timeout: 12000});
  await page.click('#l-venue-sugg div:not(.none)');
  await page.$$eval('.c-find', b => b[0].click());
  const q = (await page.$$('.c-q'))[0]; await q.click({clickCount: 3}); await q.type('Agege Motor Road');
  await page.waitForSelector('.c-sugg div:not(.none)', {visible: true, timeout: 12000});
  await page.$eval('.c-sugg div:not(.none)', e => e.click());
  await page.waitForFunction(() => document.querySelectorAll('.c-km')[0].value === '75.4', {timeout: 10000});
  ok((await text('#l-out')).includes('75.4 km'), 'fetched distance drives the fare');
  await page.reload({waitUntil: 'load'});
  // Short
  await tab('short');
  ok((await text('#s-fare')) === '\u20A610,300' && (await text('#s-total')) === '\u20A6144,200', 'short: \u20A610,300 per seat, \u20A6144,200 full bus');
  ok(!JARGON.test(await text('#s-out')), 'no jargon in short results');
  await page.screenshot({path: path.join(SHOTS, 'buses-' + label + '-3-short.png'), fullPage: true});
  await setVal('#s-quote', 80000);
  ok((await text('#s-fare')) === '\u20A66,900', 'short quote 80,000 -> \u20A66,900');
  await setVal('#s-quote', 0);
  ok(!(await page.$eval('#s-msg', e => e.classList.contains('hide'))), 'friendly message for an empty quote');
  // Shuttle
  await tab('shuttle');
  ok((await text('#m-fare')) === '\u20A64,800' && (await text('#m-total')) === '\u20A6201,600', 'shuttle: \u20A64,800 per seat, \u20A6201,600 total');
  ok(!JARGON.test(await text('#m-out')), 'no jargon in shuttle results');
  await page.screenshot({path: path.join(SHOTS, 'buses-' + label + '-4-shuttle.png'), fullPage: true});
  // Currency format and overflow
  const all = await bodyText(page);
  ok(!/\u20A6\d{4,}/.test(all), 'every naira amount over 999 has a thousands separator');
  ok(!(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)), label + ' buses: no horizontal overflow');
  ok(errors.length === 0, 'no console errors on buses page (' + label + '): ' + errors.join(' | '));
}

(async () => {
  const browser = await puppeteer.launch({executablePath: CHROME, headless: true, args: ['--no-sandbox']});
  for (const [label, vp] of [['desktop', {width: 1280, height: 900}], ['mobile', {width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2}]]) {
    let {page, errors} = await setup(browser, vp); await carTests(page, errors, label, vp); await page.close();
    ({page, errors} = await setup(browser, vp)); await busTests(page, errors, label); await page.close();
  }
  await browser.close();
  console.log('browser tests passed: ' + n + ' checks, 0 console errors, screenshots in ' + SHOTS);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
