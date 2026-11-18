// Builds og.png (1200x630) from the official logo. Needs puppeteer-core and Chrome.
const puppeteer=require('puppeteer-core'),fs=require('fs');
(async()=>{const b=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const p=await b.newPage();await p.setViewport({width:1200,height:630});
const logo='data:image/jpeg;base64,'+fs.readFileSync('logo-source.jpg').toString('base64');
await p.setContent(`<body style="margin:0;background:#e8751a;color:#3d1e0a;font-family:system-ui,'Segoe UI',Arial,sans-serif;height:630px;display:flex;align-items:center;padding:0 80px;gap:70px">
<img src="${logo}" width="440" height="440" style="border-radius:44px;flex:none">
<div><div style="font-size:112px;font-weight:700;line-height:1">Commut</div>
<div style="font-size:60px;font-weight:600;margin-top:26px">Fare estimator</div>
<div style="font-size:34px;margin-top:20px;line-height:1.3">Your fare per seat and your trip total, with Commut standard rates.</div></div></body>`);
await p.screenshot({path:'og.png'});await b.close();})();
