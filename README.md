# Money Seasons

A static lifetime investment calculator inspired by the broad, steady index-investing mindset from *The Simple Path to Wealth*.

## Run locally

Open `index.html` in a browser.

No build step is required. The app is currently made of:

- `index.html` for the page structure
- `styles.css` for the responsive UI
- `app.js` for the projection model, contribution periods, chart, and yearly table

## Current calculator behavior

- Starts with initial age, retirement age, initial investment, and expected stock/bond returns.
- Lets users add multiple contribution periods.
- Each contribution period runs from the starting age until the ending birthday, so `30` to `40` means ten years.
- Contributions can be monthly or yearly.
- Growth compounds monthly.
- Supports stock-only, stock-and-bond, or historical projections using S&P 500 total returns and 10-year Treasury bond returns from Aswath Damodaran's NYU dataset.
- Stock/bond allocation works in stock-and-bond and historical modes.
- Historical mode lets users choose the start year and either percentage-based allocation or a static bond amount.
- Percentage allocation can use one stock/bond split before retirement and another after retirement.
- Static bond mode keeps up to the chosen dollar amount in bonds and treats the rest of the portfolio as stocks.
- Optional post-retirement phase keeps returns going through a selected end age.
- Withdrawals are paid monthly and can use either the initial retirement balance or the current portfolio balance each year.
- Optional inflation near the graph shows what future balances would equal in today's spending power.

This is an educational planning tool, not financial advice.

Historical return data source: https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html
