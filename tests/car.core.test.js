// Car core logic: the fixed Commut car rates (N150 allowance, N300 per km) and the fare formula.
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const core = html.split('//CORE_START')[1].split('//CORE_END')[0];
const C = new Function(core + '; return {FIXED_CAR,computeFare,naira,parseLocationInput,nominatimUrl,osrmUrl};')();
let n = 0; const eq = (a,b,l) => { n++; assert.strictEqual(a,b,l + ': got ' + a + ', expected ' + b); };
eq(Object.isFrozen(C.FIXED_CAR), true, 'car rates frozen');
eq(C.FIXED_CAR.allowance, 150, 'allowance 150'); eq(C.FIXED_CAR.rate, 300, 'rate 300');
eq(C.FIXED_CAR.feePct, 0, 'no Commut fee'); eq(C.FIXED_CAR.vatPct, 0, 'no VAT line');
const P = (seats) => ({allowance:C.FIXED_CAR.allowance, rate:C.FIXED_CAR.rate, seats, feePct:C.FIXED_CAR.feePct, vatPct:C.FIXED_CAR.vatPct});
// Arithmetic from the formula: journey = 150 + km x 300, fare = journey / seats
let f = C.computeFare(20, P(3)); eq(f.journey, 6150, '20 km journey'); eq(f.rounded, 2050, '20 km fare per seat (3 riders)');
f = C.computeFare(20, P(4)); eq(f.rounded, 1538, '20 km fare per seat (4 riders), 6150/4 = 1537.5 rounds to 1538');
f = C.computeFare(0, P(3)); eq(f.journey, 150, '0 km is just the allowance'); eq(f.rounded, 50, '0 km fare');
f = C.computeFare(45.5, P(3)); eq(f.journey, 13800, '45.5 km journey'); eq(f.rounded, 4600, '45.5 km fare');
eq(C.naira(1234567), '\u20A61,234,567', 'currency has thousands separators');
// Place paste support is still there
eq(C.parseLocationInput('6.4281, 3.4219').type, 'coords', 'coordinates parse');
eq(C.parseLocationInput('https://www.google.com/maps/@6.4281,3.4219,15z').type, 'link', 'google link parses');
assert(C.nominatimUrl('Ikeja').includes('countrycodes=ng')); n++;
assert(C.osrmUrl([{lat:1,lon:2},{lat:3,lon:4}]).includes('router.project-osrm.org')); n++;
console.log('car core tests passed: ' + n + ' assertions');
