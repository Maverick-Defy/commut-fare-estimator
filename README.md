# Commut Fare Estimator

A client-facing fare estimator for Commut car rides and event buses, using Commut standard rates.

- `index.html`: car rides. Trip allowance of 150 naira and 300 naira per km are fixed.
- `buses.html`: event buses. Seats per bus (14) are fixed. The margin and the passenger count used in the short distance calculation are fixed inside the calculations and are not shown or editable.
- Fixed values are constants in the page code, not form inputs, so they cannot be changed from the page.
- Anyone with the code could fork the repository and change the constants. Fixing the rates on the page does not stop that.

Tests: `npm i && npm test` (needs Google Chrome; set `CHROME=/path/to/chrome` if needed). `build.py` is the generator used to assemble the pages from the earlier Commut checkers.
