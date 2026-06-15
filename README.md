A single page expense tracker built with HTML/CSS + JS for functions. Adds expenses, filters them, and sorts them to see your data. Included EURO conversion to USD via the exchange rate API listed below.


To run:
No install! Simply open index.html in any browser,  or double-click the file in your file explorer

## NOTE: Internet connection IS needed for conversion.



Features:
*Add expenses with a description, amount, category, and date (defaults to today).

*Filter by category and sort by date or amount, ascending or descending.
Totals reflect the current filtered view.

*Live currency conversion — converts the shown total to EUR with fetch and
async/await, including loading and error states.

*Running totals


Structure:
State lives in a single JavaScript array (expenses). The UI is always rebuilt from that array by one render() function, which runs after every change. Nothing edits the DOM ad-hoc outside of render().


API and acknowledgements:

Credit to https://www.exchangerate-api.com/ for open source usage.

Uses the free, no-key endpoint https://open.er-api.com/v6/latest/USD, reading the rates.EUR value from the JSON response.
