# MoneyControl Table Structure

The table has:
- First column: Indicators (row names)
- Second column: Trend (with chart icons)
- Remaining columns: Quarter data (Sep '25, Jun '25, Mar '25, Dec '24, etc.)

Key indicators found:
- Net Sales/Income from operations: 65,799 | 63,437 | 64,479 | 63,973 | 64,259 | 62,613 | 61,237 | 60,583 | 59,692 | 59,381 | 59,162 | 58,229 | 55,309 | 52,758
- Employees Cost: 38,606 | 37,715 | 36,762 | 35,956 | 36,654 | 36,416 | 35,138 | 34,722 | 35,123 | 35,148 | 33,687 | 32,467 | 31,041 | 30,327
- Depreciation: 1,413 | 1,361 | 1,379 | 1,377 | 1,266 | 1,220 | 1,246 | 1,233 | 1,263 | 1,243 | 1,286 | 1,269 | 1,237 | 1,230
- Other Expenses: 9,215 | 8,847 | 10,737 | 10,983 | 10,874 | 9,535 | 8,935 | 9,473 | 8,823 | 9,235 | 9,701 | 10,209 | 9,752 | 9,015
- P/L Before Other Inc., Int., Excpt. Items & Tax: 16,565 | 15,514 | 15,601 | 15,657 | 15,465 | 15,442 | 15,918 | 15,155 | 14,483 | 13,755 | 14,488 | 14,284 | 13,279 | 12,186

The table structure is:
- Row 1: Headers (Indicators, Trend, Sep '25, Jun '25, ...)
- Row 2+: Data rows with indicator name, trend chart, and values

The scraper needs to:
1. Find the table with financial data
2. Extract header row to get quarter names
3. Skip the "Trend" column (index 1)
4. Extract values from columns 2 onwards
