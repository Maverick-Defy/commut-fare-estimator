// Asserts every worked bus figure against the core logic in buses.html, and the fixed Commut rates.
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, '..', 'buses.html'), 'utf8');
const core = html.split('//CORE_START')[1].split('//CORE_END')[0];
const L = new Function(core + '; return {FIXED,onewayDrop,ceil100,floor2,longDistance,shortFare,shortTable,shortProfitTable,shuttleFare,departure,economics,naira,pct};')();
let n = 0;
function eq(a, b, label){ n++; assert.strictEqual(a, b, label + ': got ' + a + ', expected ' + b); }
function near(a, b, label, tol){ n++; assert(Math.abs(a - b) <= (tol || 0.005), label + ': got ' + a + ', expected ' + b); }

// Rounding
eq(L.ceil100(23015.4), 23100, 'ceil100 up'); eq(L.ceil100(23100), 23100, 'ceil100 exact'); eq(L.ceil100(23100.0000000001), 23100, 'ceil100 float noise');

// Mode 0: one-way drop-off (passenger-km), Rume's newer method. Exact rate used in all computation.
const ow = L.onewayDrop({cost:180000, margin:0.10, seats:14, hubs:[
  {name:'Gbagada',km:21,pax:4},{name:'Maryland',km:22,pax:3},{name:'Ikeja',km:29,pax:2},{name:'Agege',km:35,pax:5}]});
eq(ow.pkm, 383, 'passenger-km'); eq(ow.totalPax, 14, 'total pax');
near(ow.required, 200000, 'required revenue 200,000', 1e-6);
eq(L.naira(ow.rate, 2), '\u20A6522.19', 'rate displays 522.19');
near(ow.rate, 200000 / 383, 'rate is exact', 1e-12);
// KNOWN DISCREPANCY: Rume prints Ikeja's exact fare as 15,143.61. The exact rate gives 29 x 200000/383 = 15,143.6031 -> 15,143.60.
// (29 x the rounded 522.19 would be 15,143.51, so 15,143.61 matches neither.) It is 1 kobo-level (N0.01) and the suggested fare N15,200 is unaffected.
assert.deepStrictEqual(ow.rows.map(r => r.exact.toFixed(2)), ['10966.06','11488.25','15143.60','18276.76']); n++;
near(ow.rows[2].exact, 15143.61, 'Ikeja exact vs Rume 15,143.61 (known N0.01 difference)', 0.011);
eq(ow.rows[2].exact.toFixed(2) === '15143.61', false, 'Ikeja exact is not 15,143.61 (documented discrepancy)');
assert.deepStrictEqual(ow.rows.map(r => r.fare), [11000,11500,15200,18300]); n++;
assert.deepStrictEqual(ow.rows.map(r => r.revenue), [44000,34500,30400,91500]); n++;
assert.deepStrictEqual(ow.rows.map(r => r.pkm), [84,66,58,175]); n++;
eq(ow.totalRevenue, 200400, 'total revenue'); eq(ow.profit, 20400, 'gross profit');
eq(L.pct(ow.margin), 10.18, 'margin 10.18%');
near(ow.breakEvenPkm, 344.7, 'break-even pkm ~344.7', 0.05); near(ow.targetPkm, 383, 'target pkm ~383', 1e-6);
const bk = ow.bookings;
assert.deepStrictEqual(bk.map(b => b.n), [14,13,12,11]); n++;
const exp = {14:[200400,20400,10.18], 13:[186086,6086,3.27], 12:[171771,-8229,-4.79], 11:[157457,-22543,-14.32]};
bk.forEach(b => {
  eq(Math.round(b.revenue), exp[b.n][0], 'revenue @' + b.n);
  eq(Math.round(b.profit), exp[b.n][1], 'profit @' + b.n);
  eq(L.pct(b.margin), exp[b.n][2], 'margin @' + b.n);
});
eq(ow.breakEvenBookings, 13, 'break-even bookings 13');
eq(ow.overSeats, false, 'no over-seat warning at 14/14');
eq(L.onewayDrop({cost:180000, margin:0.1, seats:12, hubs:[{name:'a',km:21,pax:14}]}).overSeats, true, 'over-seat warning when pax > seats');
eq(L.onewayDrop({cost:1, margin:0.1, seats:14, hubs:[]}).rate, null, 'no hubs');
eq(L.onewayDrop({cost:1, margin:0.1, seats:2, hubs:[{name:'a',km:5,pax:1}]}).bookings.length, 2, 'bookings rows limited by seats');

// Mode 1: long distance
const ld = L.longDistance({hire:290000, capacity:14, margin:0.10,
  corridors:[{name:'Agege',km:74},{name:'Iyana Ipaja',km:80},{name:'Ikeja',km:76},{name:'Ikorodu',km:80}]});
near(ld.required, 322222.22, 'required revenue');
near(ld.rate, 311.0253, 'exact rate per km', 0.0001);
eq(ld.rateShown, 311.02, 'rate per km as printed in the policy (2dp, rounded down)');
// Using the printed rate of 311.02 gives the same fares
assert.deepStrictEqual([74,80,76,80].map(k => L.ceil100(k * 311.02)), [23100,24900,23700,24900]); n++;
eq(ld.shortest, 74, 'shortest');
const fares = ld.rows.map(r => r.fare);
assert.deepStrictEqual(fares, [23100, 24900, 23700, 24900]); n++;
// Full capacity and thresholds are derived consistently
ld.rows.forEach(r => {
  eq(r.full.revenue, r.fare * 14, r.name + ' full revenue');
  eq(r.full.profit, r.fare * 14 - 290000, r.name + ' full profit');
  [12,13,14].forEach(b => eq(r.at[b].profit, r.fare * b - 290000, r.name + ' profit @' + b));
});
// Full-bus margin never below target for any corridor
ld.rows.forEach(r => assert(r.full.margin >= 0.10 - 1e-9, r.name + ' full margin >= target')); n += 4;
// Agege full bus: 14 x 23,100 = 323,400, profit 33,400
eq(ld.rows[0].full.profit, 33400, 'Agege full profit');
// Removing the shortest corridor changes the rate base
const ld2 = L.longDistance({hire:290000, capacity:14, margin:0.10, corridors:[{name:'Ikeja',km:76},{name:'Ikorodu',km:80}]});
eq(ld2.shortest, 76, 'shortest after removal');
// Unfilled corridors are ignored for shortest
const ld3 = L.longDistance({hire:290000, capacity:14, margin:0.10, corridors:[{name:'x',km:0},{name:'Ikeja',km:76}]});
eq(ld3.shortest, 76, 'zero km ignored'); eq(ld3.rows[0].fare, null, 'zero km has no fare');
eq(L.longDistance({hire:1,capacity:14,margin:0.1,corridors:[]}).rate, null, 'no corridors');

// Mode 2: short distance table
const expected = {80000:6900, 100000:8600, 120000:10300, 150000:12900, 180000:15400, 200000:17100};
L.shortTable(Object.keys(expected).map(Number), 13, 0.10).forEach(r => eq(r.fare, expected[r.quote], 'short fare for ' + r.quote));
// N120k example
const s = L.shortFare(120000, 13, 0.10); eq(s.fare, 10300, 'N120k fare');
const pt = L.shortProfitTable(120000, 10300);
assert.deepStrictEqual(pt.map(e => e.profit), [3600, 13900, 24200]); n++;
assert.deepStrictEqual(pt.map(e => L.pct(e.margin)), [2.91, 10.38, 16.78]); n++;
assert.deepStrictEqual(pt.map(e => e.bookings), [12, 13, 14]); n++;

// Mode 3: multiple shuttle trips
const sh = L.shuttleFare(180000, 3, 14, 0.10);
near(sh.exact, 4761.90, 'shuttle exact'); eq(sh.fare, 4800, 'shuttle shown N4,800');

// Mode 4: departure check for the N120k / N10,300 example
let d = L.departure(10300, 120000, 0.10, 13);
eq(d.breakEven, 12, 'break-even bookings'); eq(d.target, 13, 'target bookings');
eq(d.reachesBreakEven, true, '13 reaches break-even'); eq(d.reachesTarget, true, '13 reaches target');
d = L.departure(10300, 120000, 0.10, 12);
eq(d.reachesBreakEven, true, '12 reaches break-even'); eq(d.reachesTarget, false, '12 misses target');
d = L.departure(10300, 120000, 0.10, 11);
eq(d.reachesBreakEven, false, '11 misses break-even'); eq(d.reachesTarget, false, '11 misses target');
// Long-distance corridor: Agege fare 23,100 vs hire 290,000
d = L.departure(23100, 290000, 0.10, 13);
eq(d.breakEven, 13, 'Agege break-even'); eq(d.target, 14, 'Agege target');
// Exact division must not round up from float noise: cost 100000, fare 10000 -> exactly 10
eq(L.departure(10000, 100000, 0, 10).breakEven, 10, 'exact break-even 10');
eq(L.departure(9000, 90000, 0.1, 11).target, 12, 'target boundary: 90000/(9000*0.9)=11.11');
eq(L.departure(9000, 81000, 0.1, 10).target, 10, 'target exact 10');

// Naira formatting
eq(L.naira(23100), '\u20A623,100', 'naira commas'); eq(L.naira(4761.9, 2), '\u20A64,761.90', 'naira 2dp'); eq(L.naira(-3600), '-\u20A63,600', 'naira negative');


// ---- Fixed Commut rates ----
eq(Object.isFrozen(L.FIXED), true, 'FIXED is frozen');
eq(L.FIXED.seats, 14, 'fixed seats 14'); eq(L.FIXED.marginPct, 10, 'fixed margin 10%'); eq(L.FIXED.shortPaidPax, 13, 'fixed short passengers 13');
eq(String(1 - L.FIXED.marginPct / 100), '0.9', 'margin factor 0.9');
eq((L.FIXED.shortPaidPax * (1 - L.FIXED.marginPct / 100)).toFixed(1), '11.7', 'short distance divisor 13 x 0.9 = 11.7');
// Figures through the fixed constants (what the page uses)
const m = L.FIXED.marginPct / 100, S = L.FIXED.seats;
eq(L.shortFare(120000, L.FIXED.shortPaidPax, m).fare, 10300, 'short fare via fixed constants (N120k -> N10,300)');
near(L.shortFare(120000, 13, m).exact, 120000 / 11.7, 'short exact = cost / 11.7', 1e-6);
eq(L.shuttleFare(180000, 3, S, m).fare, 4800, 'shuttle via fixed constants -> N4,800');
assert.deepStrictEqual(L.longDistance({hire:290000, capacity:S, margin:m, corridors:[{name:'a',km:74},{name:'b',km:80},{name:'c',km:76},{name:'d',km:80}]}).rows.map(r=>r.fare), [23100,24900,23700,24900]); n++;
eq(L.onewayDrop({cost:180000, margin:m, seats:S, hubs:[{name:'G',km:21,pax:4},{name:'M',km:22,pax:3},{name:'I',km:29,pax:2},{name:'A',km:35,pax:5}]}).totalRevenue, 200400, 'one-way total via fixed constants');
// 74 is the shortest corridor distance, an input per trip, not a locked constant
const alt = L.longDistance({hire:290000, capacity:S, margin:m, corridors:[{name:'x',km:60},{name:'y',km:80}]});
eq(alt.shortest, 60, '74 is not locked: shortest corridor drives the rate');

console.log('core tests passed: ' + n + ' assertions');
