# AI-Powered Financial Data Scraper

A robust, industry-grade financial data extraction tool designed to scrape, normalize, and analyze quarterly financial results for Indian companies. It uses a smart multi-tiered scraping strategy to ensure high data availability and accuracy.

## 🚀 Key Features

*   **Multi-Source Scraping**: Automatically falls back between sources to ensure data retrieval.
    1.  **Screener.in (Primary)**: Fast, structured data extraction.
    2.  **MoneyControl (Secondary)**: Comprehensive fallback for missing data.
    3.  **Perplexity AI (Tertiary)**: Intelligent agent to find correct URLs when standard lookups fail.
*   **Smart Company Search**: No hardcoded lists. The system dynamically searches for companies (e.g., "Hexaware" -> "Hexaware Technologies Ltd") to find the correct data.
*   **Automated Excel Generation**: Produces professional, formatted Excel reports with:
    *   **Consolidated View**: Key metrics for all companies in one sheet.
    *   **Detailed Views**: Individual sheets for each company with full historical data.
*   **Derived Metrics**: Automatically calculates complex metrics like `Op. EBITDA`, `PBT`, and `Margins` even if they aren't explicitly reported.
*   **Interactive UI**: A modern, 4-step wizard interface built with React and Tailwind CSS.

---

## 🏗️ Architecture

The application follows a modern client-server architecture:

### **Frontend (Client)**
*   **Framework**: React (Vite)
*   **Styling**: Tailwind CSS + shadcn/ui
*   **State Management**: React Query
*   **Flow**:
    1.  **Upload**: User uploads a template or starts fresh.
    2.  **Selection**: User searches and selects companies.
    3.  **Process**: Real-time progress tracking with live logs.
    4.  **Preview**: Data validation and Excel download.

### **Backend (Server)**
*   **Runtime**: Node.js + Express
*   **Orchestrator (`scrapingOrchestrator.ts`)**: Manages the scraping lifecycle. It implements the "Chain of Responsibility" pattern:
    *   *Try Screener* -> *Success? Return.*
    *   *Fail? Try MoneyControl* -> *Success? Return.*
    *   *Fail? Ask Perplexity AI* -> *Success? Return.*
*   **Scrapers**:
    *   `screenerScraper.ts`: Uses `cheerio` to parse HTML. Implements fuzzy search for company names.
    *   `moneyControlScraper.ts`: Handles complex table structures and normalizes column names.
    *   `perplexity.ts`: Interfaces with Perplexity API for intelligent lookups.
*   **Data Processing**:
    *   `calculator.ts`: Normalizes data (e.g., maps "Revenue from Ops" to "Revenue") and computes derived values.
    *   `excelProcessor.ts`: Generates `.xlsx` files using `exceljs`.

---

## 👨‍💻 Programmer's Guide

If you want to modify or debug the code, here is how the data flows:

1.  **Entry Point**: The frontend calls `/api/scrape` which triggers `orchestrateFinancialDataScraping` in `server/scrapingOrchestrator.ts`.
2.  **Company Resolution**:
    *   The orchestrator first calls `scrapeScreener(companyName)`.
    *   Inside `screenerScraper.ts`, it hits the Screener search API to get the correct URL (e.g., "Hexaware" -> "Hexaware Technologies").
3.  **Data Extraction**:
    *   HTML is fetched via `axios` and parsed with `cheerio`.
    *   We look for specific table rows (e.g., "Sales", "Net Profit").
    *   **Debugging Tip**: If a metric is missing, check `normalizeIndicatorName` in `moneyControlScraper.ts` or the mapping logic in `screenerScraper.ts`.
4.  **Calculation**:
    *   Raw data is passed to `calculateDerivedMetrics` in `server/calculator.ts`.
    *   This is where `Op. EBITDA`, `Margins`, and `PBT` are computed.
    *   **Debugging Tip**: If a calculated value is wrong, check the formula in this file.
5.  **Excel Generation**:
    *   Finally, `server/excelProcessor.ts` takes the processed data and builds the spreadsheet.
    *   It uses `exceljs` to style cells and add headers.

---

## 🛠️ Prerequisites

Before running the application, ensure you have the following installed:

*   **Node.js** (v18 or higher)
*   **npm** (Node Package Manager)

---

## ⚙️ Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd financial-data-scraper
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Copy the example environment file to create your local configuration:
    ```bash
    cp .env.example .env
    ```

    Open `.env` and update the following values:

    ### **A. Database Setup (MySQL)**
    You need a running MySQL server.
    1.  **Install MySQL**:
        *   **Mac (Homebrew)**: `brew install mysql` then `brew services start mysql`
        *   **Windows**: Download installer from [mysql.com](https://dev.mysql.com/downloads/installer/)
        *   **Linux**: `sudo apt install mysql-server`
    2.  **Create Database**:
        Log in to MySQL and run:
        ```sql
        CREATE DATABASE financial_data_scraper;
        ```
    3.  **Update .env**:
        Set `DATABASE_URL` with your credentials:
        ```env
        DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/financial_data_scraper
        ```

    ### **B. Generate JWT Secret**
    This key is used to sign session cookies. You can generate a secure random string using one of these methods:
    *   **Mac/Linux Terminal**:
        ```bash
        openssl rand -base64 32
        ```
    *   **Node.js (Any OS)**:
        ```bash
        node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
        ```
    *   **Manual**: Just type a long, random string of characters.
    
    Paste the result into your `.env`:
    ```env
    JWT_SECRET=your_generated_secret_string_here
    ```

    ### **C. Perplexity API (Optional but Recommended)**
    Required for the "Smart Fallback" feature to find companies when standard search fails.
    *   Get your key from [docs.perplexity.ai](https://docs.perplexity.ai).
    *   Add it to `.env`:
        ```env
        PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxx
        ```

---

## ▶️ How to Run

1.  **Start the Development Server**
    This command runs both the backend (Express) and frontend (Vite) concurrently:
    ```bash
    npm run dev
    ```

2.  **Access the Application**
    Open your browser and navigate to:
    ```
    http://localhost:3000
    ```

---

## 📖 Usage Guide

1.  **Step 1: Upload (Optional)**
    *   Upload an existing Excel file to use as a template, or skip to start fresh.
2.  **Step 2: Select Companies**
    *   Type a company name (e.g., "Reliance", "Tata Motors") in the search bar and click **Add**.
    *   Select the Fiscal Years and Quarters you want to scrape.
3.  **Step 3: Process**
    *   Watch the **Process Log** as the system scrapes data.
    *   If a company isn't found on the first source, you'll see it automatically switch to backup sources.
4.  **Step 4: Preview & Download**
    *   Review the scraped data in the table.
    *   Click **Download Excel** to get the final report.

---

## 📦 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # UI Components (Wizard, Cards, etc.)
│   │   └── pages/          # Main application pages
├── server/                 # Backend Node.js application
│   ├── _core/              # Core utilities (Auth, SDKs)
│   ├── shared/             # Shared types
│   ├── calculator.ts       # Financial metric calculations
│   ├── excelProcessor.ts   # Excel generation logic
│   ├── scrapingOrchestrator.ts # Main scraping logic
│   ├── screenerScraper.ts  # Screener.in scraper
│   └── moneyControlScraper.ts # MoneyControl scraper
├── uploads/                # Temporary storage for uploaded files
├── .env                    # Environment variables (do not commit)
├── package.json            # Project dependencies
└── README.md               # Project documentation
```

## 🔒 Security Note

*   **API Keys**: Never commit your `.env` file or API keys to GitHub. The `.gitignore` file is pre-configured to exclude these.
*   **Data Privacy**: All data is processed locally on your machine.
