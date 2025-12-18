# Financial Data Scraper - Local Setup Guide

## Prerequisites

- Node.js 18+ (recommended: 22.x)
- pnpm (install with `npm install -g pnpm`)
- MySQL/TiDB database

## Setup Instructions

### 1. Extract the ZIP file

```bash
unzip financial_data_scraper_local.zip -d financial_data_scraper
cd financial_data_scraper
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Create environment file

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/financial_data_scraper

# JWT Secret (generate a random string)
JWT_SECRET=your-random-secret-key-here

# Perplexity API (required for fallback data source)
PERPLEXITY_API_KEY=your-perplexity-api-key

# App Configuration
VITE_APP_ID=financial-data-scraper
VITE_APP_TITLE=Financial Data Scraper
VITE_APP_LOGO=

# OAuth (optional - can be left empty for local testing)
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=
OWNER_OPEN_ID=
OWNER_NAME=

# Built-in APIs (optional)
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

### 4. Setup database

```bash
pnpm db:push
```

### 5. Run the development server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Running Tests

```bash
pnpm test
```

## Project Structure

```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities
├── server/           # Express backend
│   ├── screenerScraper.ts    # Primary data source (Screener.in)
│   ├── perplexity.ts         # Fallback data source (Perplexity AI)
│   ├── moneyControlScraper.ts # Legacy scraper
│   ├── scrapingOrchestrator.ts # Main scraping logic
│   ├── calculator.ts         # Financial calculations
│   └── excelProcessor.ts     # Excel generation
├── drizzle/          # Database schema
├── shared/           # Shared types and utilities
└── todo.md           # Project TODO list
```

## Data Sources

1. **Primary**: Screener.in - Direct HTML scraping of quarterly results
2. **Fallback**: Perplexity AI - AI-powered data extraction
3. **Legacy**: MoneyControl - Original scraper (requires JS rendering)

## Supported Companies

The scraper supports 13 Indian IT companies:
- TCS, Infosys, Wipro, HCL Tech, Tech Mahindra
- LTIMindtree, Persistent, Coforge, Mphasis
- L&T Technology Services, Cyient, Zensar, Hexaware, Birlasoft

## Notes

- The Screener.in scraper extracts raw financial data directly without calculations
- Data includes: Revenue, Operating Profit, OPM%, Interest, Depreciation, PBT, Net Profit
- Up to 13 quarters of historical data can be extracted per company
