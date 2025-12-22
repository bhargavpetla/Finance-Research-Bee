import axios from 'axios';
import * as cheerio from 'cheerio';



/**
 * Convert Screener date format (e.g., "Sep 2025") to fiscal quarter format (e.g., "Q2'26")
 */
function convertToFiscalQuarter(screenerDate: string): string {
  const parts = screenerDate.trim().split(' ');
  if (parts.length !== 2) return screenerDate;

  const month = parts[0];
  const year = parseInt(parts[1], 10);

  // Indian fiscal year: Apr-Mar
  // Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
  const monthMap: Record<string, { quarter: number; fyOffset: number }> = {
    'Jan': { quarter: 4, fyOffset: 0 },
    'Feb': { quarter: 4, fyOffset: 0 },
    'Mar': { quarter: 4, fyOffset: 0 },
    'Apr': { quarter: 1, fyOffset: 1 },
    'May': { quarter: 1, fyOffset: 1 },
    'Jun': { quarter: 1, fyOffset: 1 },
    'Jul': { quarter: 2, fyOffset: 1 },
    'Aug': { quarter: 2, fyOffset: 1 },
    'Sep': { quarter: 2, fyOffset: 1 },
    'Oct': { quarter: 3, fyOffset: 1 },
    'Nov': { quarter: 3, fyOffset: 1 },
    'Dec': { quarter: 3, fyOffset: 1 },
  };

  const mapping = monthMap[month];
  if (!mapping) return screenerDate;

  const fiscalYear = year + mapping.fyOffset;
  const fyShort = fiscalYear.toString().slice(-2);

  return `Q${mapping.quarter}'${fyShort}`;
}

/**
 * Parse a number from Screener format (handles commas and percentages)
 */
function parseNumber(value: string): number | null {
  if (!value || value === '-' || value === '') return null;

  // Remove commas and percentage signs
  const cleaned = value.replace(/,/g, '').replace(/%/g, '').trim();
  const num = parseFloat(cleaned);

  return isNaN(num) ? null : num;
}

interface QuarterData {
  quarter: string;
  period: string;
  rawData: Record<string, number | string>;
}

interface ScreenerResult {
  companyName: string;
  symbol: string;
  dataSource: 'screener';
  quarters: QuarterData[];
  error?: string;
}

/**
 * Search for a company on Screener.in
 */
async function searchScreenerCompany(query: string): Promise<{ url: string; name: string } | null> {
  try {
    const searchUrl = `https://www.screener.in/api/company/search/?q=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    if (Array.isArray(response.data) && response.data.length > 0) {
      // Return the first match
      const match = response.data[0];
      return {
        url: `https://www.screener.in${match.url}`,
        name: match.name
      };
    }
    return null;
  } catch (error) {
    console.warn(`[Screener] Search failed for ${query}:`, error);
    return null;
  }
}

/**
 * Scrape quarterly financial data from Screener.in
 */
export async function scrapeScreener(companyName: string): Promise<ScreenerResult> {
  let url = '';
  let resolvedName = companyName;
  let symbol = '';

  // Always use fuzzy search to find the correct company URL
  console.log(`[Screener] Searching for "${companyName}"...`);
  const searchResult = await searchScreenerCompany(companyName);

  if (searchResult) {
    url = searchResult.url;
    resolvedName = searchResult.name;
    // Extract symbol from URL roughly (e.g. /company/HEXT/...)
    const match = url.match(/\/company\/([^/]+)\//);
    symbol = match ? match[1] : 'UNKNOWN';
    console.log(`[Screener] Found match: ${resolvedName} (${url})`);
  } else {
    return {
      companyName,
      symbol: '',
      dataSource: 'screener',
      quarters: [],
      error: `Could not find company: ${companyName} on Screener.in`,
    };
  }

  console.log(`[Screener] Scraping ${resolvedName} from: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);

    // Find the quarterly results section
    // The table is in a section with id "quarters" or class "quarters"
    const quartersSection = $('#quarters, .quarters, section:contains("Quarterly Results")').first();

    // Find all tables in the page
    const tables = $('table');
    let quarterlyTable: any = null;

    // Look for the table that has "Sales" or "Operating Profit" in its rows
    tables.each((_, table) => {
      const tableText = $(table).text();
      if (tableText.includes('Sales') && tableText.includes('Operating Profit') && tableText.includes('Net Profit')) {
        quarterlyTable = $(table);
        return false; // Break the loop
      }
    });

    if (!quarterlyTable) {
      console.log(`[Screener] Could not find quarterly results table for ${companyName}`);
      return {
        companyName,
        symbol,
        dataSource: 'screener',
        quarters: [],
        error: 'Could not find quarterly results table',
      };
    }

    // Extract headers (quarter dates)
    const headers: string[] = [];
    quarterlyTable.find('thead tr th, thead tr td, tr:first-child th, tr:first-child td').each((idx: number, el: any) => {
      const text = $(el).text().trim();
      if (idx > 0 && text) { // Skip first column (metric names)
        headers.push(text);
      }
    });

    console.log(`[Screener] Found ${headers.length} quarters: ${headers.slice(0, 5).join(', ')}...`);

    // Initialize quarters
    const quarters: QuarterData[] = headers.map(h => ({
      quarter: convertToFiscalQuarter(h),
      period: convertToFiscalQuarter(h),
      rawData: {}
    }));

    // Extract data rows
    quarterlyTable.find('tbody tr, tr').each((_: number, row: any) => {
      const cells = $(row).find('td, th');
      if (cells.length < 2) return;

      const label = $(cells[0]).text().trim();
      if (!label) return;

      // Normalize metric names
      let metricName = label;
      if (label.toLowerCase().includes('sales') || label.toLowerCase().includes('revenue')) metricName = 'Total Income From Operations';
      else if (label.toLowerCase() === 'operating profit') metricName = 'Op. EBITDA';
      else if (label.toLowerCase().includes('opm')) metricName = 'OPM %';
      else if (label.toLowerCase().includes('other income')) metricName = 'Other Income';
      else if (label.toLowerCase() === 'interest') metricName = 'Interest';
      else if (label.toLowerCase() === 'depreciation') metricName = 'Depreciation';
      else if (label.toLowerCase().includes('profit before tax')) metricName = 'P/L Before Tax';
      else if (label.toLowerCase().includes('tax %')) metricName = 'Tax %';
      else if (label.toLowerCase().includes('net profit')) metricName = 'Net Profit / (Loss) for the Period';

      // Extract values
      cells.each((idx: number, cell: any) => {
        if (idx === 0) return; // Skip label
        const quarterIdx = idx - 1;
        if (quarterIdx < quarters.length) {
          const valText = $(cell).text().trim();
          const valNum = parseNumber(valText);
          const finalVal = valNum !== null ? valNum : valText;

          quarters[quarterIdx].rawData[metricName] = finalVal;

          // Also keep original label just in case
          if (metricName !== label) {
            quarters[quarterIdx].rawData[label] = finalVal;
          }
        }
      });
    });

    // Filter out empty quarters
    const validQuarters = quarters.filter(q => Object.keys(q.rawData).length > 0);

    console.log(`[Screener] Successfully extracted ${validQuarters.length} quarters for ${companyName}`);

    return {
      companyName,
      symbol,
      dataSource: 'screener',
      quarters: validQuarters.reverse(), // Most recent first
    };

  } catch (error: any) {
    console.error(`[Screener] Error scraping ${companyName}:`, error.message);
    return {
      companyName,
      symbol,
      dataSource: 'screener',
      quarters: [],
      error: error.message,
    };
  }
}


