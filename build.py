import re, io
BASE = 'https://maverick-defy.github.io/commut-fare-estimator/'
DESC = 'Estimate your fare per seat and your trip total with Commut standard rates. Car rides and event buses.'

CSS = """
:root{--ink:#3d1e0a;--muted:#5f4130;--line:#e6d6c8;--brand:#e8751a;--brand-d:#a75311;--brand-dd:#8a4310;--cream:#fff6f1;--brand2:#fdeedd;--warn:#fff6e0;--bad:#fdecec;--badink:#a02020;--bg:#fdf7f1}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:var(--bg);color:var(--ink);line-height:1.5}
a{color:var(--brand-d)}
:focus-visible{outline:3px solid #1f6fb5;outline-offset:2px}
.skip{position:absolute;left:-999px;top:0;background:#fff;color:var(--ink);padding:8px 12px;z-index:100}
.skip:focus{left:8px;top:8px}
header{background:var(--brand);color:var(--ink);padding:18px 16px 20px}
.hwrap{max-width:760px;margin:0 auto}
.brand{display:flex;align-items:center;gap:10px}
.brand svg{flex:none}
.brand img{border-radius:10px;display:block}
.brand span{font-size:26px;font-weight:700;letter-spacing:.01em}
header h1{margin:12px 0 0;font-size:20px;line-height:1.25;font-weight:600}
header p{margin:6px 0 0;font-size:15px}
main{max-width:760px;margin:0 auto;padding:14px 14px 28px}
.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:14px}
.card h2{margin:0 0 10px;font-size:17px}
.card h3{margin:14px 0 4px;font-size:15px}
label{display:block;font-size:14px;color:var(--muted);margin:10px 0 4px}
input[type=text],input[type=number]{width:100%;padding:11px;border:1px solid #8a7566;border-radius:8px;font-size:16px;background:#fff;color:var(--ink)}
.field{position:relative}
.sugg{position:absolute;left:0;right:0;top:100%;z-index:20;background:#fff;border:1px solid var(--line);border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.12);max-height:240px;overflow:auto;display:none}
.sugg div{padding:11px;font-size:14px;border-bottom:1px solid var(--line);cursor:pointer}
.sugg div:last-child{border-bottom:0}
.sugg div:hover{background:var(--brand2)}
.sugg .none{color:var(--muted);cursor:default}
.picked{font-size:13px;color:var(--brand-d);margin-top:4px;word-break:break-word}
.row{display:flex;gap:8px;align-items:flex-end}
.row .field{flex:1;min-width:0}
button{font:inherit;border:0;border-radius:8px;padding:11px 14px;cursor:pointer;min-height:44px}
button:disabled{opacity:.6;cursor:default}
.ghost{background:var(--brand2);color:var(--brand-d);font-weight:600}
.rm{background:var(--bad);color:var(--badink)}
.primary{background:var(--brand-d);color:#fff;font-weight:600;width:100%;margin-top:14px;font-size:16px}
.primary:hover{background:var(--brand-dd)}
.pin{background:var(--brand2);color:var(--brand-d);font-weight:600;white-space:nowrap;padding:11px 12px}
.seg{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 14px}
.seg button{background:#f4e8dc;color:var(--ink);flex:1;min-width:140px}
.seg button.on,.seg button[aria-selected=true]{background:var(--brand-d);color:#fff;font-weight:600}
.tabs{display:flex;gap:8px;margin:0 0 16px}
.tabs a{flex:1;text-align:center;text-decoration:none;background:#f4e8dc;color:var(--ink);padding:12px 14px;border-radius:8px;font-size:16px;min-height:44px}
.tabs a.on{background:var(--brand-d);color:#fff;font-weight:600}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:520px){.grid{grid-template-columns:1fr}.row{flex-wrap:wrap}.row .field{flex:1 1 100%}.row .pin,.row .rm{flex:1}}
.res{border:1px solid var(--line);border-radius:10px;padding:12px;margin-top:10px}
.res h3{margin:0 0 6px;font-size:15px}
.big{font-size:28px;font-weight:700;color:var(--brand-d);line-height:1.2}
.tw{overflow-x:auto;-webkit-overflow-scrolling:touch}
table{width:100%;border-collapse:collapse;font-size:15px;margin-top:6px}
th{font-size:13px;color:var(--muted);font-weight:600;text-align:right;padding:6px;border-bottom:2px solid var(--line);white-space:nowrap}
th:first-child,td:first-child{text-align:left}
td{padding:8px 6px;border-bottom:1px solid var(--line);text-align:right}
.tw td{white-space:nowrap}
td:last-child{padding-left:12px}
tr.tot td{font-weight:700}
.msg{background:var(--warn);border:1px solid #e3c978;border-radius:8px;padding:10px;font-size:14px;margin-top:10px}
.msg.hide{display:none}
.note{font-size:14px;color:var(--muted)}
.note li{margin-bottom:4px}
.sub{border-top:1px dashed var(--line);margin-top:8px;padding-top:6px;display:none}
.hidden{display:none}
.fixedval{display:block;width:100%;padding:11px;border:1px solid var(--line);border-radius:8px;font-size:16px;background:#f6ece2;color:var(--ink);font-weight:600}
.lock{display:inline-block;background:var(--brand2);color:var(--brand-d);font-size:11px;font-weight:700;border-radius:6px;padding:1px 6px;margin-left:6px;text-transform:uppercase;letter-spacing:.03em;vertical-align:1px}
.rates{background:var(--brand2);border:1px solid #f0c9a3;border-radius:12px;padding:14px 16px;margin-bottom:14px}
.rates h2{margin:0 0 4px;font-size:16px;color:var(--brand-d)}
.rates p{margin:0 0 8px;font-size:14px}
.rates .grid{margin-top:4px}
.rates .fixedval{background:#fff;border-color:#f0c9a3}
.example{font-size:14px;color:var(--muted);margin:0 0 4px}
footer{max-width:760px;margin:0 auto;padding:0 14px 28px;font-size:13px;color:var(--muted)}
.chk{display:flex;gap:10px;align-items:center;margin-top:14px;font-size:15px}
.chk input{width:22px;height:22px;flex:none}
#map{height:340px;border-radius:10px;border:1px solid var(--line);margin-top:8px;z-index:0}
@media(max-width:520px){#map{height:300px}}
.targets{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.targets button{background:#f4e8dc;color:var(--ink);padding:8px 12px;font-size:14px}
.targets button.on{background:var(--brand-d);color:#fff;font-weight:600}
.mk{width:28px;height:28px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.45);color:#fff;font-weight:700;font-size:14px;line-height:24px;text-align:center}
#msg{display:none}
.errbar{display:none;background:var(--bad);color:var(--badink);padding:10px 16px;font-size:14px;text-align:center}
"""

def head(title, page, extra=''):
    url = BASE + page
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{DESC}">
<meta name="theme-color" content="#e8751a">
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="16x16" href="favicon-16.png">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="favicon-192.png">
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Commut">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{DESC}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Commut fare estimator">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{DESC}">
<meta name="twitter:image" content="{BASE}og.png">
{extra}<style>{CSS}</style>
</head>
'''

LOGO = '<img src="logo-96.png" width="48" height="48" alt="">'

def top(active):
    return f'''<body>
<a class="skip" href="#main">Skip to the estimator</a>
<div class="errbar" id="errbar" role="alert">Something went wrong on this page. Please refresh it and try again.</div>
<header>
  <div class="hwrap">
    <div class="brand">{LOGO}<span>Commut</span></div>
    <h1>Fare estimator</h1>
    <p>Estimate your fare per seat and your trip total.</p>
  </div>
</header>
<main id="main">
  <nav class="tabs" id="sitetabs" aria-label="Choose a service"><a href="./" id="tab-car"{' class="on" aria-current="page"' if active=='car' else ''}>Car rides</a><a href="buses.html" id="tab-buses"{' class="on" aria-current="page"' if active=='bus' else ''}>Event buses</a></nav>
'''

FOOT = '''<footer>
  <p>Distances are road distances without traffic, so they are estimates. Please confirm your final fare with Commut before you book.</p>
</footer>
<script>window.addEventListener('error',function(){var e=document.getElementById('errbar');if(e)e.style.display='block';});</script>
</body>
</html>
'''

def sub1(pat, rep, s, flags=re.S):
    new, n = re.subn(pat, lambda m: rep, s, count=1, flags=flags)
    assert n == 1, pat
    return new
def rep1(s, a, b):
    assert a in s, a
    return s.replace(a, b)

# ====================== CAR ======================
car = open('../site/index.html', encoding='utf8').read()
script = car[car.index('<script src="https://unpkg.com/leaflet'):car.index('</body>')]
script = script.replace('</script>\n', '</script>\n', 1)
script = rep1(script, "var COLORS = ['#c0392b','#0b6e4f','#1f6fb5','#d9822b','#7b3fa0'];", "var COLORS = ['#c0392b','#a75311','#1f6fb5','#3d1e0a','#7b3fa0'];")
script = rep1(script, "{color:'#0b6e4f', weight:5", "{color:'#a75311', weight:5")
script = rep1(script, "var LAGOS = {", "const FIXED_CAR = Object.freeze({allowance:150, rate:300, feePct:0, vatPct:0});\nvar LAGOS = {")
script = rep1(script, "var p = {allowance:g('allow'), rate:g('rate'), seats:g('seats'), feePct:g('fee'), vatPct:g('vat')};",
              "var p = {allowance:FIXED_CAR.allowance, rate:FIXED_CAR.rate, seats:g('seats'), feePct:FIXED_CAR.feePct, vatPct:FIXED_CAR.vatPct};")
script = rep1(script, "document.getElementById('seats').value = s;", "document.getElementById('seats').value = s;")
script = sub1(r"function fareBlock\(title, f, p\)\{.*?\n\}\n",
"""function fareBlock(title, f, p){
  return '<table>' +
    '<tr><td>Distance</td><td>' + f.km.toFixed(1) + ' km</td></tr>' +
    '<tr><td>Whole car journey (' + naira(p.allowance) + ' + ' + f.km.toFixed(1) + ' km x ' + naira(p.rate) + ' per km)</td><td>' + naira(f.journey) + '</td></tr>' +
    '<tr class="tot"><td>Fare per seat (shared between ' + p.seats + ' riders)</td><td>' + naira(f.rounded) + '</td></tr></table>';
}
""", script)
script = sub1(r"html \+= '<div class=\"card\"><h2>Driver route \(for reference\)</h2>.*?for reference only\.</p></div>';\n", "", script)
script = rep1(script, "'<div class=\"card\"><h2>Passenger ' + (i+1) + ' pickup</h2>", "'<div class=\"card\"><h2>Pickup ' + (i+1) + '</h2>")
script = rep1(script, "<div>Per seat</div>", "<div>Your fare per seat</div>")
script = rep1(script, "<div>Round trip per seat</div>", "<div>Your round trip fare per seat</div>")
script = rep1(script, "(withReturn ? 'Outbound' : 'Trip')", "(withReturn ? 'Outbound journey' : 'Your journey')")
script = rep1(script, "'Return</h3>'", "'Return journey</h3>'") if "'Return</h3>'" in script else script
script = rep1(script, "msg('Please check the pricing inputs. They must be numbers, and seats must be at least 1.');", "msg('Please enter the number of riders sharing the car. It must be 1 or more.');")
script = script.replace("Provisional", "Estimated")
script = rep1(script, "btn.textContent = 'Check fares'", "btn.textContent = 'Check my fare'")
script = rep1(script, "document.getElementById('seats').addEventListener('input', function(){", "document.getElementById('seats').addEventListener('input', function(){")
script = rep1(script, ">Map</button><button class=\"rm\"", ">Pick on map</button><button class=\"rm\"")
script = rep1(script, "var input = wrap.querySelector('input'), sugg = wrap.querySelector('.sugg'), picked = wrap.querySelector('.picked');", "var input = wrap.querySelector('input'), sugg = wrap.querySelector('.sugg'), picked = wrap.querySelector('.picked');\n  var uid = 'pk' + (++window.__pkSeq); input.id = uid; wrap.querySelector('label').setAttribute('for', uid);")
script = rep1(script, "function addPickup(){", "window.__pkSeq = 0;\nfunction addPickup(){")


car_html = head('Commut Fare Estimator: Car rides', '',
  '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">\n')
car_html += top('car') + '''
  <section class="rates" aria-labelledby="car-rates-h">
    <h2 id="car-rates-h">Commut standard rates</h2>
    <p>These rates are fixed by Commut and cannot be changed on this page.</p>
    <div class="grid">
      <div><label>Trip allowance<span class="lock">Fixed</span></label><span class="fixedval" id="allow" data-fixed="150">&#8358;150</span></div>
      <div><label>Rate per km<span class="lock">Fixed</span></label><span class="fixedval" id="rate" data-fixed="300">&#8358;300 per km</span></div>
    </div>
  </section>

  <div class="card">
    <h2>1. Your trip</h2>
    <label for="dest">Where are you going? (the event or venue)</label>
    <div class="row"><div class="field"><input type="text" id="dest" placeholder="Type a place, or paste coordinates or a Google Maps link" autocomplete="off"><div class="sugg" id="sugg-dest"></div></div><button class="pin" id="pin-dest" type="button" title="Set this point on the map">Pick on map</button></div>
    <div class="picked" id="picked-dest"></div>
    <div id="pickups"></div>
    <button class="ghost" id="addPickup" type="button" style="margin-top:12px">+ Add another pickup point</button>
    <div class="chk"><input type="checkbox" id="ret"><label for="ret" style="margin:0;color:var(--ink);font-size:15px">Include the return journey (from the venue back to each pickup)</label></div>
  </div>

  <div class="card">
    <h2>Map</h2>
    <div class="note" id="mapHint">Choose a field above, then tap the map to set that point. Drag a marker to move it.</div>
    <div class="targets" id="targets"></div>
    <div id="map" role="application" aria-label="Map for choosing your pickup points and destination"></div>
    <div class="note" id="mapFail" style="display:none">The map could not load. You can still type places or paste coordinates above.</div>
  </div>

  <div class="card">
    <h2>2. Riders sharing the car</h2>
    <div class="seg" role="group" aria-label="Number of riders sharing the car">
      <button id="mode3" class="on" type="button">Share between 3</button>
      <button id="mode4" type="button">Share between 4</button>
    </div>
    <label for="seats">Number of riders sharing the car</label>
    <input type="number" id="seats" value="3" min="1" step="1" inputmode="numeric">
    <button class="primary" id="go" type="button">Check my fare</button>
    <div class="msg" id="msg" role="alert"></div>
  </div>

  <div id="results" aria-live="polite"></div>

  <div class="card note">
    <ul style="margin:0;padding-left:18px">
      <li>How your fare is worked out: whole car journey = &#8358;150 + km x &#8358;300. Your fare per seat = whole car journey divided by the riders sharing, rounded to the nearest naira.</li>
      <li>You can paste coordinates (like 6.4281, 3.4219), a Google Maps link that shows coordinates, or a plus code. Short links such as maps.app.goo.gl cannot be opened from this page.</li>
      <li>Place search, the map and routing use free public map services (OpenStreetMap and OSRM). Search waits a moment after you stop typing, on purpose.</li>
    </ul>
  </div>
</main>

''' + script + FOOT
open('index.html','w',encoding='utf8').write(car_html)

# ====================== BUSES ======================
b = open('../bus/index.html', encoding='utf8').read()
core = b[b.index('//CORE_START\n') + len('//CORE_START\n'):b.index('//CORE_END')]
core = "// Fixed company rates. 14 seats per bus. Margin factor and short distance passenger count are fixed inside the calculations and are never inputs.\nconst FIXED = Object.freeze({marginPct:10, seats:14, shortPaidPax:13});\n" + core
core = core.replace("(1 - margin)", "(1 - margin)")
def seg(a, z):
    return b[b.index(a):b.index(z)]
appA = seg('/* ---- Mode 0: one-way passenger-km ---- */', 'function recalcOneway(){')
appB = seg('/* ---- Mode 1 ---- */', 'function recalcLong(){')
appC = seg('/* ---- Place search and routing (optional) ---- */', 'renderRows(); renderHubs();')
# friendlier wording in reused UI code
R = [("Hub ' + (i + 1)", "Stop ' + (i + 1)"),
     ('<label>Hub name</label><input type="text" class="h-name"', '<label>Stop name</label><input type="text" class="h-name" aria-label="Stop name"'),
     ('<label>Km</label><input type="number" class="h-km"', '<label>Km</label><input type="number" class="h-km" aria-label="Distance from the venue in km"'),
     ('<div style="width:70px"><label>Pax</label><input type="number" class="h-pax"', '<div style="width:96px"><label>Passengers</label><input type="number" class="h-pax" aria-label="Number of passengers"'),
     ('<label>Search the hub</label><div class="field"><input type="text" class="h-q"', '<label>Search for the stop</label><div class="field"><input type="text" class="h-q" aria-label="Search for the stop"'),
     ('title="Remove this hub"', 'title="Remove this stop"'),
     ('Find on map', 'Find on the map'),
     ('<label>Drop-off hub</label><input type="text" class="c-name"', '<label>Drop-off point</label><input type="text" class="c-name" aria-label="Drop-off point"'),
     ('<label>Km</label><input type="number" class="c-km"', '<label>Km</label><input type="number" class="c-km" aria-label="Distance from the venue in km"'),
     ('<label>Search the drop-off hub</label><div class="field"><input type="text" class="c-q"', '<label>Search for the drop-off point</label><div class="field"><input type="text" class="c-q" aria-label="Search for the drop-off point"'),
     ('title="Remove this corridor"', 'title="Remove this drop-off point"'),
     ('Pick the event venue first (below the corridor list).', 'Pick the event venue first (below the list).'),
     ("Road distance ' + v + ' km from OSRM. Provisional. Please verify.", "Estimated road distance: ' + v + ' km. Please check it."),
     ("'Cumulative road distance along the route, in hub order. Provisional. Please verify.'", "'Estimated road distance along the route, in stop order. Please check it.'"),
     ('Use "Find on the map" for every hub first (', 'Use "Find on the map" for every stop first ('),
     ("{name:'', km:'', pax:'', place:null}", "{name:'', km:'', pax:'', place:null}"),
     ('Add at least one hub', 'Add at least one stop'),
    ]
for a_, b_ in R:
    if a_ in appA: appA = appA.replace(a_, b_)
    elif a_ in appB: appB = appB.replace(a_, b_)
    elif a_ in appC: appC = appC.replace(a_, b_)
    else: print('WARN not found:', a_)
# remaining Provisional/OSRM wording
for nm in ('appA','appB','appC'):
    pass
appA = appA.replace('Provisional. ', '').replace('OSRM', 'the map service')
appB = appB.replace('Provisional. ', '').replace('OSRM', 'the map service')
assert 'Provisional' not in appA + appB + appC

RECALC = r'''
function recalcOneway(){
  var cost = num('o-cost'), m = num('o-margin') / 100, seats = num('o-seats');
  var out = $('o-out');
  if(!(cost > 0)){ showMsg('o-msg','Please enter the bus hire cost for the journey (more than 0).'); out.innerHTML = ''; return; }
  var list = hubs.map(function(h){ var k = parseFloat(h.km), p = parseFloat(h.pax); return {name:h.name.trim() || 'Stop', km:isNaN(k) ? 0 : k, pax:isNaN(p) ? 0 : p}; });
  var r = onewayDrop({cost:cost, margin:m, seats:seats, hubs:list});
  if(r.rate === null){ showMsg('o-msg','Please add at least one stop with a distance and a number of passengers above 0.'); out.innerHTML = ''; return; }
  var warns = [];
  if(r.overSeats) warns.push('You have ' + r.totalPax + ' passengers, but a Commut bus has ' + seats + ' seats.');
  for(var i = 1; i < list.length; i++){ if(list[i].km < list[i-1].km){ warns.push('"' + list[i].name + '" is closer than "' + list[i-1].name + '". Distances are measured from the venue along the route, so each stop should be the same distance or further than the one before.'); break; } }
  showMsg('o-msg', warns.join(' '));
  var h = '<div class="card"><h2>Your trip total</h2><div class="big" id="o-total">' + money(r.totalRevenue) + '</div>' +
    '<p class="note" style="margin:4px 0 0">For ' + r.totalPax + ' passenger' + (r.totalPax === 1 ? '' : 's') + ', one way from the venue.</p></div>';
  h += '<div class="card"><h2>Fare per seat</h2><div class="tw"><table><tr><th scope="col">Stop</th><th scope="col">Distance</th><th scope="col">Passengers</th><th scope="col">Fare per seat</th><th scope="col">Stop total</th></tr>';
  r.rows.forEach(function(x){ h += '<tr><td>' + esc(x.name) + '</td><td>' + x.km + ' km</td><td>' + x.pax + '</td><td><b>' + money(x.fare) + '</b></td><td>' + money(x.revenue) + '</td></tr>'; });
  h += '<tr class="tot"><td>Total</td><td></td><td>' + r.totalPax + '</td><td></td><td>' + money(r.totalRevenue) + '</td></tr></table></div>' +
    '<p class="note" style="margin-bottom:0">Distances are measured from the venue along the bus route. Fares are rounded up to the next &#8358;100.</p></div>';
  out.innerHTML = h;
}
['o-cost'].forEach(function(id){ $(id).addEventListener('input', recalcOneway); });
'''
RECALC_LONG = r'''
function recalcLong(){
  var hire = num('l-hire'), cap = num('l-cap'), m = num('l-margin') / 100;
  var out = $('l-out');
  if(!(hire > 0)){ showMsg('l-msg','Please enter the bus hire cost (more than 0).'); out.innerHTML = ''; return; }
  var list = corridors.map(function(c){ var k = parseFloat(c.km); return {name: c.name.trim() || 'Drop-off point', km: isNaN(k) ? 0 : k}; });
  var r = longDistance({hire:hire, capacity:cap, margin:m, corridors:list});
  if(r.rate === null){ showMsg('l-msg','Please add at least one drop-off point with a distance above 0.'); out.innerHTML = ''; return; }
  showMsg('l-msg','');
  var h = '<div class="card"><h2>Fare per seat</h2><div class="tw"><table><tr><th scope="col">Drop-off point</th><th scope="col">Distance</th><th scope="col">Fare per seat</th><th scope="col">Full bus</th></tr>';
  r.rows.forEach(function(x){ h += '<tr><td>' + esc(x.name) + '</td><td>' + (x.km > 0 ? x.km + ' km' : '-') + '</td><td><b>' + (x.fare === null ? '-' : money(x.fare)) + '</b></td><td>' + (x.fare === null ? '-' : money(x.fare * cap)) + '</td></tr>'; });
  h += '</table></div><p class="note" style="margin-bottom:0">The full bus figure is the fare per seat multiplied by ' + cap + ' seats. Fares are rounded up to the next &#8358;100.</p></div>';
  out.innerHTML = h;
}
['l-hire'].forEach(function(id){ $(id).addEventListener('input', recalcLong); });

/* ---- Mode 2 ---- */
function recalcShort(){
  var q = num('s-quote'), n = num('s-pax'), m = num('s-margin') / 100, cap = FIXED.seats;
  var out = $('s-out');
  if(!(q > 0)){ showMsg('s-msg','Please enter the bus hire cost (more than 0).'); out.innerHTML = ''; return; }
  showMsg('s-msg','');
  var r = shortFare(q, n, m);
  out.innerHTML = '<div class="card"><h2>Your fare</h2><div class="res"><div>Fare per seat</div><div class="big" id="s-fare">' + money(r.fare) + '</div></div>' +
    '<div class="res"><div>Full bus (' + cap + ' seats)</div><div class="big" id="s-total">' + money(r.fare * cap) + '</div></div>' +
    '<p class="note" style="margin-bottom:0">Fares are rounded up to the next &#8358;100.</p></div>';
}
['s-quote'].forEach(function(id){ $(id).addEventListener('input', recalcShort); });

/* ---- Mode 3 ---- */
function recalcShuttle(){
  var c = num('m-cost'), t = num('m-trips'), cap = num('m-cap'), m = num('m-margin') / 100;
  var out = $('m-out');
  if(!(c > 0) || !(t >= 1)){ showMsg('m-msg','Please enter the total cost (more than 0) and at least 1 trip.'); out.innerHTML = ''; return; }
  showMsg('m-msg','');
  var r = shuttleFare(c, t, cap, m);
  out.innerHTML = '<div class="card"><h2>Your fare</h2><div class="res"><div>Fare per seat</div><div class="big" id="m-fare">' + money(r.fare) + '</div></div>' +
    '<div class="res"><div>Total if every seat is booked (' + (t * cap) + ' seats over ' + t + ' trip' + (t === 1 ? '' : 's') + ')</div><div class="big" id="m-total">' + money(r.fare * t * cap) + '</div></div>' +
    '<p class="note" style="margin-bottom:0">Fares are rounded up to the next &#8358;100.</p></div>';
}
['m-cost','m-trips'].forEach(function(id){ $(id).addEventListener('input', recalcShuttle); });

'''
EXAMPLE = '<p class="example">Example figures are shown. Replace them with your own.</p>'
bus_html = head('Commut Fare Estimator: Event buses', 'buses.html') + top('bus') + f'''
  <section class="rates" aria-labelledby="bus-rates-h">
    <h2 id="bus-rates-h">Commut standard rates</h2>
    <p>These rates are fixed by Commut and cannot be changed on this page.</p>
    <div class="grid"><div><label>Seats on each bus<span class="lock">Fixed</span></label><span class="fixedval" id="fixed-seats" data-fixed="14">14 seats</span></div></div>
  </section>

  <div class="seg" id="tabs" role="tablist" aria-label="Type of bus trip">
    <button role="tab" id="t-oneway" aria-controls="tab-oneway" aria-selected="true" data-tab="oneway" class="on" type="button">Several drop-off stops</button>
    <button role="tab" id="t-long" aria-controls="tab-long" aria-selected="false" data-tab="long" type="button">Long distance</button>
    <button role="tab" id="t-short" aria-controls="tab-short" aria-selected="false" data-tab="short" type="button">Short distance</button>
    <button role="tab" id="t-shuttle" aria-controls="tab-shuttle" aria-selected="false" data-tab="shuttle" type="button">Several shuttle trips</button>
  </div>

  <section id="tab-oneway" role="tabpanel" aria-labelledby="t-oneway">
    <div class="card">
      <h2>Several drop-off stops</h2>
      <p class="note" style="margin:0">One bus after the event, from the venue to each drop-off stop in route order. One way only. {EXAMPLE[:-4].replace('<p class="example">','')}</p>
      <div class="grid">
        <div><label for="o-cost">Bus hire cost for the whole one-way journey (&#8358;)</label><input type="number" id="o-cost" value="180000" min="0" step="any" inputmode="decimal"></div>
      </div>
      <h3>Drop-off stops, in route order</h3>
      <p class="note" style="margin:0 0 4px">Distance is the total distance from the venue along the bus's route. Type it yourself, or fetch it from the map. A typed distance always works.</p>
      <div id="o-rows"></div>
      <button class="ghost" id="o-add" type="button" style="margin-top:10px">+ Add a stop</button>
      <div class="sub" style="display:block">
        <p class="note" style="margin:0">Optional: use "Find on the map" on each stop, search for the venue below, then fetch the distances along the route.</p>
        <label for="o-venue">Search for the event venue on the map</label>
        <div class="field"><input type="text" id="o-venue" placeholder="e.g. Victoria Island, Lagos" autocomplete="off"><div class="sugg" id="o-venue-sugg"></div></div>
        <div class="picked" id="o-venue-picked"></div>
        <button class="ghost" id="o-fetch" type="button" style="margin-top:10px">Get the distances from the map</button>
        <div class="note" id="o-fetch-status" style="margin-top:6px" aria-live="polite"></div>
      </div>
      <div class="msg hide" id="o-msg" role="alert"></div>
    </div>
    <div id="o-out" aria-live="polite"></div>
  </section>

  <section id="tab-long" class="hidden" role="tabpanel" aria-labelledby="t-long">
    <div class="card">
      <h2>Long distance</h2>
      <p class="note" style="margin:0">{EXAMPLE[:-4].replace('<p class="example">','')}</p>
      <div class="grid">
        <div><label for="l-hire">Bus hire cost (&#8358;)</label><input type="number" id="l-hire" value="290000" min="0" step="any" inputmode="decimal"></div>
      </div>
      <h3>Drop-off points</h3>
      <p class="note" style="margin:0 0 4px">Type the distance yourself, or use "Find km by road" to fetch a driving distance. A typed distance always works.</p>
      <div id="l-rows"></div>
      <button class="ghost" id="l-add" type="button" style="margin-top:10px">+ Add a drop-off point</button>
      <div class="sub" id="l-venuebox" style="display:block">
        <label for="l-venue">Event venue (only needed for "Find km by road")</label>
        <div class="field"><input type="text" id="l-venue" placeholder="e.g. Shiro Lagos" autocomplete="off"><div class="sugg" id="l-venue-sugg"></div></div>
        <div class="picked" id="l-venue-picked"></div>
      </div>
      <div class="msg hide" id="l-msg" role="alert"></div>
    </div>
    <div id="l-out" aria-live="polite"></div>
  </section>

  <section id="tab-short" class="hidden" role="tabpanel" aria-labelledby="t-short">
    <div class="card">
      <h2>Short distance</h2>
      <p class="note" style="margin:0">{EXAMPLE[:-4].replace('<p class="example">','')}</p>
      <div class="grid">
        <div><label for="s-quote">Bus hire cost (&#8358;)</label><input type="number" id="s-quote" value="120000" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="msg hide" id="s-msg" role="alert"></div>
    </div>
    <div id="s-out" aria-live="polite"></div>
  </section>

  <section id="tab-shuttle" class="hidden" role="tabpanel" aria-labelledby="t-shuttle">
    <div class="card">
      <h2>Several shuttle trips</h2>
      <p class="note" style="margin:0">{EXAMPLE[:-4].replace('<p class="example">','')}</p>
      <div class="grid">
        <div><label for="m-cost">Total bus hire cost for all trips (&#8358;)</label><input type="number" id="m-cost" value="180000" min="0" step="any" inputmode="decimal"></div>
        <div><label for="m-trips">Number of trips</label><input type="number" id="m-trips" value="3" min="1" step="1" inputmode="numeric"></div>
      </div>
      <div class="msg hide" id="m-msg" role="alert"></div>
    </div>
    <div id="m-out" aria-live="polite"></div>
  </section>

  <div class="card note">
    <ul style="margin:0;padding-left:18px">
      <li>Return only, from the event venue to the drop-off point. Fares are per seat.</li>
      <li>Fares are rounded up to the next &#8358;100.</li>
      <li>Distance lookup uses free public map services (OpenStreetMap and OSRM). Road distances are without traffic.</li>
    </ul>
  </div>
</main>

<script>
/* ===== CORE LOGIC (tested with node) ===== */
//CORE_START
{core}//CORE_END

/* ===== APP ===== */
function $(id){{return document.getElementById(id);}}
function esc(s){{return String(s).replace(/[&<>"']/g,function(c){{return {{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}}[c];}});}}
const LOCKED = Object.freeze({{'o-margin':FIXED.marginPct,'o-seats':FIXED.seats,'l-cap':FIXED.seats,'l-margin':FIXED.marginPct,'s-pax':FIXED.shortPaidPax,'s-margin':FIXED.marginPct,'m-cap':FIXED.seats,'m-margin':FIXED.marginPct}});
function num(id){{if(Object.prototype.hasOwnProperty.call(LOCKED,id)) return LOCKED[id]; var v = parseFloat($(id).value); return isNaN(v) ? NaN : v;}}
function showMsg(id, text){{var el = $(id); if(text){{el.textContent = text; el.className = 'msg';}} else {{el.textContent = ''; el.className = 'msg hide';}}}}
function money(v){{return naira(v, 0);}}

/* Tabs */
var tabs = ['oneway','long','short','shuttle'];
document.querySelectorAll('#tabs button').forEach(function(b){{
  b.addEventListener('click', function(){{
    tabs.forEach(function(t){{ $('tab-' + t).className = (t === b.dataset.tab) ? '' : 'hidden'; }});
    document.querySelectorAll('#tabs button').forEach(function(x){{ var on = x === b; x.className = on ? 'on' : ''; x.setAttribute('aria-selected', on ? 'true' : 'false'); }});
  }});
}});

''' + appA + RECALC + '\n' + appB + RECALC_LONG + appC + '''renderRows(); renderHubs();
recalcOneway(); recalcLong(); recalcShort(); recalcShuttle();
</script>
''' + FOOT
open('buses.html','w',encoding='utf8').write(bus_html)
print('built')
