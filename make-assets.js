const puppeteer=require('puppeteer-core'),fs=require('fs');
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const p=await b.newPage();
const svg=fs.readFileSync('favicon.svg','utf8');
await p.setViewport({width:192,height:192});
await p.setContent('<body style="margin:0">'+svg.replace('<svg ','<svg width="192" height="192" ')+'</body>');
await p.screenshot({path:'favicon-192.png'});
await p.setViewport({width:1200,height:630});
await p.setContent(`<body style="margin:0;background:#0b6e4f;color:#fff;font-family:system-ui,Arial,sans-serif;display:flex;flex-direction:column;justify-content:center;padding:0 90px;height:630px">
<div style="display:flex;align-items:center;gap:28px"><svg width="120" height="120" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#fff"/><path d="M42 20.5c-3-2.3-6.6-3.5-10.4-3.5C23 17 16 23.8 16 32s7 15 15.6 15c3.8 0 7.4-1.2 10.4-3.5" fill="none" stroke="#0b6e4f" stroke-width="7" stroke-linecap="round"/></svg><div style="font-size:104px;font-weight:700">Commut</div></div>
<div style="font-size:64px;font-weight:600;margin-top:40px">Fare estimator</div>
<div style="font-size:38px;margin-top:18px;opacity:.95">Your fare per seat and your trip total, with Commut standard rates.</div></body>`);
await p.screenshot({path:'og.png'});await b.close();})();
