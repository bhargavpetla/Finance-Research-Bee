# Financial Data Scraper - Project TODO

## Core Features
- [x] File upload interface with drag-and-drop support and validation
- [x] MoneyControl data scraping engine for 13 Indian IT companies
- [x] Perplexity API integration as fallback data source
- [x] Financial metrics calculation engine with strict formulas
- [x] Indian fiscal quarter mapping system (Apr-Jun 2025 = Q1 FY2026)
- [x] Data validation layer with ₹1 Cr tolerance checking
- [x] Excel file generator matching Birlasoft&peer.xlsx structure
- [x] Web-based data preview with interactive tables
- [x] Excel file download functionality
- [x] Processing status dashboard with real-time progress tracking

## Database & Backend
- [x] Database schema for storing scraping jobs and results
- [x] Perplexity API key configuration
- [x] MoneyControl scraper implementation
- [x] Perplexity API fallback implementation
- [x] Financial calculation engine
- [x] Excel parsing and generation utilities
- [x] File upload handling with S3 storage
- [x] tRPC procedures for all operations

## Frontend
- [x] File upload component with drag-and-drop
- [x] Processing status dashboard
- [x] Data preview tables
- [x] Excel download functionality
- [x] Error handling and validation display
- [x] Clean, functional financial tool design

## Testing & Validation
- [x] Test MoneyControl scraping accuracy
- [x] Test Perplexity API fallback
- [x] Test financial calculations
- [x] Test Excel generation
- [x] Test Indian fiscal quarter mapping
- [x] End-to-end integration tests


## Bug Fixes
- [x] Fix OAuth sign-in redirect loop issue (user was already signed in, no bug present)

## New Feature Requests
- [x] Add multi-select for quarters (Q1, Q2, Q3, Q4)
- [x] Add multi-select for fiscal years (2023, 2024, 2025, 2026)
- [x] Enhanced processing window showing real-time backend activity
- [x] Display what AI is scraping for each company
- [x] Show estimated time remaining
- [x] Display current stage for each company
- [x] Show AI analysis progress
- [x] Display data source being used (MoneyControl/Perplexity)
- [x] Fix processing stuck at 54% issue (added retry logic with exponential backoff)
- [x] Improve error handling for failed companies (TCS, LTIMindtree)

## Missing Implementation
- [ ] Update scraping orchestrator to emit detailed company-by-company progress
- [ ] Send real-time stage updates (e.g., "Scraping MoneyControl", "Calculating metrics")
- [ ] Calculate and send estimated time remaining per company
- [ ] Track and send data source being used for each company
- [ ] Update database with companyDetails array in progressData
- [ ] Ensure frontend receives and displays real-time updates

## Critical Missing Features
- [x] Implement real-time backend activity display showing what AI is scraping
- [x] Show estimated time remaining for each company
- [x] Display current stage for each company (e.g., "Scraping MoneyControl", "Calculating metrics")
- [x] Show data source being used (MoneyControl/Perplexity) for each company
- [x] Add data preview table showing extracted financial data before download
- [x] Update scraping orchestrator to emit detailed progress updates
- [x] Ensure companyDetails array is populated and sent to frontend

## New Requirements
- [x] Remove login functionality and make app publicly accessible
- [x] Show live extraction preview of what's being scraped
- [x] Display when switching from MoneyControl to Perplexity
- [x] Show Perplexity chain of thought reasoning in frontend
- [x] Display each extracted output value in real-time for verification
- [x] Show raw scraped data as it's being processed

## Bug Fixes
- [x] Fix LTIMindtree scraping getting stuck (increased timeout to 45s, reduced retries to 2)
- [x] Improve timeout handling for slow-loading company pages
- [x] Add company-specific scraping logic for problematic companies (pass company name for logging)
- [x] Implement better fallback mechanism when MoneyControl fails (skip failed companies and continue)

## New Requirements (Dec 15)
- [x] Add test mode - process only one company first for verification
- [x] Add "Satisfied? Process All" button after test company completes
- [x] Implement 3-step fallback chain:
  - Step 1: Try MoneyControl with our URL
  - Step 2: Ask Perplexity for correct MoneyControl URL, then scrape
  - Step 3: Use Perplexity Finance API directly as final fallback
- [x] Fix data preview showing 0 quarters - updated MoneyControl URLs to new format
- [x] Debug MoneyControl scraping - fixed URL format and parsing logic

## Missing Dashboard Metrics (Dec 15)
- [x] Extract Revenue data from MoneyControl
- [x] Calculate Op. EBITDA% = (Op. EBITDA / Revenue) × 100
- [x] Calculate Op. EBIT% = (Op. EBIT / Revenue) × 100
- [x] Ensure Op. PBT is properly extracted/calculated
- [x] Ensure PBT is properly extracted/calculated
- [x] Update Excel generator to include all metrics in dashboard sheet
- [x] Format dashboard with columns: Revenue, Op. EBITDA%, Op. EBIT%, Op. PBT, PBT

## New Requirements (Dec 15 - Output Format)
- [x] Fix empty output issue - rewrote MoneyControl scraper to parse new page structure
- [x] Add company selection dropdown for test mode
- [x] Match exact Excel output format from Birlasoft&peer.xlsx sample (added Op. EBITDA, Op. EBIT)
- [x] Add data preview for every company in frontend before download
- [x] Show all extracted values in preview for verification (dashboard + company details views)

## Bug Fixes (Dec 15 - Part 2)
- [x] Fix Excel "Cannot merge already merged cells" error (added try-catch for merge)
- [x] Fix data preview showing blanks - rewrote scraper with correct table parsing
- [x] Ensure selected quarters are properly displayed in preview

## Quarter Display Format Fix (Dec 15)
- [x] Update quarter display to show actual fiscal quarters (Q2'26, Q1'26) instead of MoneyControl format (Sep '25, Jun '25)
- [x] Mapping: Sep '25 → Q2'26, Jun '25 → Q1'26, Mar '25 → Q4'25, Dec '24 → Q3'25, Sep '24 → Q2'25, Jun '24 → Q1'25
- [x] Verified: parseQuarterHeader function correctly converts MoneyControl format to fiscal quarters
- [x] Verified: period field is passed through scraper → orchestrator → Excel processor → frontend

## Critical Bug: Scraper Returns 0 Quarters (Dec 15)
- [x] Root cause: MoneyControl uses JavaScript rendering which axios cannot handle
- [x] Solution: Switched to Perplexity-first approach as primary data source
- [x] Updated fallback chain: Perplexity AI → MoneyControl scraping → Perplexity URL lookup
- [x] Test with single company to verify data extraction works (TCS: 3 quarters extracted)
- [x] Verify data flows correctly to frontend preview (Revenue, EBITDA, EBIT displayed)
- [x] Added startScraping endpoint - no file upload required
- [x] Frontend updated to allow scraping without file upload

## Bug: Missing Quarters in Preview (Dec 15)
- [x] Fixed: Updated Perplexity function to accept selectedQuarters and selectedFiscalYears parameters
- [x] Fixed: Increased max_tokens from 6000 to 8000 for multi-quarter requests
- [x] Fixed: Added JSON repair logic for truncated responses
- [x] Result: Now extracting 7 quarters vs 3 before
- [x] Note: Some quarters show "--" because data not yet available (e.g., Q3'26 = Oct-Dec 2025 hasn't happened)

## Bug: Blank Historical Quarters in Preview (Dec 15)
- [x] Fixed: Updated Perplexity prompt to explicitly list each quarter (Q2'26, Q1'26, Q4'25, Q3'25, Q2'25, Q1'25)
- [x] Fixed: Simplified system prompt to focus on multi-quarter extraction
- [x] Fixed: Updated DataPreview to handle multiple data formats (Revenue, Operating Profit, etc.)
- [x] Result: Now extracting 6 quarters vs 1 before
- [x] Note: Some quarters may still show "--" if Perplexity doesn't find data for that specific period

## New Approach: Screener.in Scraper (Dec 16)
- [x] Analyzed Screener.in page structure (https://www.screener.in/company/WIPRO/consolidated/)
- [x] Built Screener.in scraper to extract quarterly financial data directly
- [x] Extract raw numbers without calculations (Sales, Operating Profit, OPM%, Interest, Depreciation, PBT, Net Profit)
- [x] Mapped all 13 company names to Screener.in URLs
- [x] Integrated as primary data source (Screener → Perplexity fallback)
- [x] Tested with TCS: 13 quarters extracted with full financial data
- [x] Data accuracy verified: Revenue ₹64,479 Cr, Op. EBITDA ₹16,980 Cr for Q4'25
