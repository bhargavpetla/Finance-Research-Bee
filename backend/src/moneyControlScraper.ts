import axios from 'axios';
import * as cheerio from 'cheerio';

export interface QuarterlyData {
  quarter: string;
  period: string;
  indicators: Record<string, number | string>;
}

/**
 * Parse quarter string like "Sep '25" to fiscal quarter info
 * Indian FY: Apr-Mar, so Apr-Jun = Q1, Jul-Sep = Q2, Oct-Dec = Q3, Jan-Mar = Q4
 */
function parseQuarterHeader(header: string): { quarter: string; fiscalYear: string; period: string } {
  const monthMap: Record<string, { quarter: string; fyOffset: number }> = {
    'jan': { quarter: 'Q3', fyOffset: 0 },
    'feb': { quarter: 'Q3', fyOffset: 0 },
    'mar': { quarter: 'Q4', fyOffset: 0 },
    'apr': { quarter: 'Q1', fyOffset: 1 },
    'may': { quarter: 'Q1', fyOffset: 1 },
    'jun': { quarter: 'Q1', fyOffset: 1 },
    'june': { quarter: 'Q1', fyOffset: 1 },
    'jul': { quarter: 'Q2', fyOffset: 1 },
    'aug': { quarter: 'Q2', fyOffset: 1 },
    'sep': { quarter: 'Q2', fyOffset: 1 },
    'oct': { quarter: 'Q3', fyOffset: 1 },
    'nov': { quarter: 'Q3', fyOffset: 1 },
    'dec': { quarter: 'Q3', fyOffset: 1 }
  };

  // Match patterns like "Sep '25", "Jun '25", "Mar '25"
  const match = header.match(/([a-zA-Z]+)\s*'?(\d{2})/i);
  if (match) {
    const month = match[1].toLowerCase();
    const year = parseInt('20' + match[2]);
    const monthInfo = monthMap[month];
    if (monthInfo) {
      const fiscalYear = year + monthInfo.fyOffset;
      const fyShort = fiscalYear.toString().slice(-2);
      return { 
        quarter: monthInfo.quarter, 
        fiscalYear: `FY${fiscalYear}`,
        period: `${monthInfo.quarter}'${fyShort}`
      };
    }
  }
  return { quarter: header, fiscalYear: '', period: header };
}

/**
 * Normalize indicator names to standard format
 */
function normalizeIndicatorName(name: string): string {
  const mapping: Record<string, string> = {
    // IT/Manufacturing metrics
    'net sales/income from operations': 'Net Sales / Income from Operations',
    'net sales / income from operations': 'Net Sales / Income from Operations',
    'revenue from operations': 'Net Sales / Income from Operations',
    'total income from operations': 'Total Income From Operations',
    'other operating income': 'Other Operating Income',
    'employees cost': 'Employees Cost',
    'employee benefit expenses': 'Employees Cost',
    'depreciation': 'Depreciation',
    'depreciation and amortisation expenses': 'Depreciation',
    'other expenses': 'Other Expenses',
    'other income': 'Other Income',
    'interest': 'Interest',
    'finance costs': 'Interest',
    'p/l before other inc., int., excpt. items & tax': 'P/L Before Other Inc., Int., Excpt. Items & Tax',
    'p/l before int., excpt. items & tax': 'P/L Before Int., Excpt. Items & Tax',
    'p/l before exceptional items & tax': 'P/L Before Exceptional Items & Tax',
    'exceptional items': 'Exceptional Items',
    'p/l before tax': 'P/L Before Tax',
    'profit before tax': 'P/L Before Tax',
    'tax': 'Tax',
    'tax expenses': 'Tax',
    'p/l after tax from ordinary activities': 'P/L After Tax from Ordinary Activities',
    'profit after tax': 'P/L After Tax from Ordinary Activities',
    'net profit/(loss) for the period': 'Net Profit / (Loss) for the Period',
    'net profit / (loss) for the period': 'Net Profit / (Loss) for the Period',
    'net profit': 'Net Profit / (Loss) for the Period',
    'minority interest': 'Minority Interest',
    'net p/l after m.i & associates': 'Net P/L After MI & Associates',
    'basic eps': 'Basic EPS',
    'diluted eps': 'Diluted EPS',
    'purchase of traded goods': 'Purchase of Traded Goods',
    'increase/decrease in stocks': 'Increase / Decrease in Stocks',
    'consumption of raw materials': 'Consumption of Raw Materials',
    'power & fuel': 'Power & Fuel',
    'excise duty': 'Excise Duty',
    'admin. and selling expenses': 'Admin. And Selling Expenses',
    'r & d expenses': 'R & D Expenses',
    'provisions and contingencies': 'Provisions And Contingencies',
    'exp. capitalised': 'Exp. Capitalised',
    
    // Banking & Financial Services specific metrics
    'net interest income': 'Net Interest Income',
    'interest income': 'Interest Income',
    'interest earned': 'Interest Income',
    'interest expended': 'Interest Expended',
    'interest expense': 'Interest Expended',
    'fee income': 'Fee Income',
    'total income': 'Total Income',
    'operating expenses': 'Operating Expenses',
    'employee expenses': 'Employees Cost',
    'provisions': 'Provisions',
    'provisions for bad debts': 'Provisions',
    'provision for npa': 'Provisions',
    'operating profit': 'Operating Profit',
    'profit before provisions': 'Profit Before Provisions',
    'net profit after tax': 'Net Profit / (Loss) for the Period',
    'total assets': 'Total Assets',
    'total deposits': 'Total Deposits',
    'total advances': 'Total Advances',
    'gross npa': 'Gross NPA',
    'net npa': 'Net NPA',
    'casa ratio': 'CASA Ratio',
    'net interest margin': 'Net Interest Margin',
    'nim': 'Net Interest Margin'
  };
  
  const lowerName = name.toLowerCase().trim();
  return mapping[lowerName] || name;
}

/**
 * Scrape quarterly financial data from MoneyControl
 */
export async function scrapeMoneyControl(
  companyUrl: string,
  numberOfQuarters: number = 8,
  companyName?: string
): Promise<QuarterlyData[]> {
  const maxRetries = 3;
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[MoneyControl] Scraping ${companyName || 'company'} from ${companyUrl} (attempt ${attempt}/${maxRetries})`);
      
      const response = await axios.get(companyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
        },
        timeout: 45000,
        maxRedirects: 5
      });

    const html = response.data;
    const $ = cheerio.load(html);
    const quarters: QuarterlyData[] = [];

    console.log(`[MoneyControl] Page loaded for ${companyName}, parsing data...`);

    // Find all tables and look for the financial data table
    const tables = $('table');
    let financialTable: any = null;
    
    tables.each((i: number, table: any) => {
      const tableText = $(table).text();
      // Look for tables that contain financial indicators (IT companies)
      const hasITMetrics = tableText.includes('Net Sales') || 
          tableText.includes('Employees Cost') || 
          tableText.includes('Depreciation') ||
          tableText.includes('Other Expenses');
      
      // Look for banking/financial company indicators
      const hasBankingMetrics = tableText.includes('Net Interest Income') ||
          tableText.includes('Interest Income') ||
          tableText.includes('Fee Income') ||
          tableText.includes('Provisions') ||
          tableText.includes('Total Income');
      
      if (hasITMetrics || hasBankingMetrics) {
        financialTable = $(table);
        return false; // break
      }
    });

    if (!financialTable) {
      console.log(`[MoneyControl] No financial table found for ${companyName}`);
      return [];
    }

    // Extract quarter headers from the table
    const quarterHeaders: string[] = [];
    const headerRow = financialTable.find('tr').first();
    
    headerRow.find('th, td').each((i: number, el: any) => {
      const text = $(el).text().trim();
      // Match quarter patterns like "Sep '25", "Jun '25", etc.
      const match = text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*'?\d{2}/i);
      if (match) {
        quarterHeaders.push(text);
      }
    });

    // If no headers in first row, try all rows to find header row
    if (quarterHeaders.length === 0) {
      financialTable.find('tr').each((rowIdx: number, row: any) => {
        if (quarterHeaders.length > 0) return false; // Already found
        
        $(row).find('th, td').each((i: number, el: any) => {
          const text = $(el).text().trim();
          const match = text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*'?\d{2}/i);
          if (match) {
            quarterHeaders.push(text);
          }
        });
      });
    }

    console.log(`[MoneyControl] Found ${quarterHeaders.length} quarters: ${quarterHeaders.slice(0, 4).join(', ')}...`);

    if (quarterHeaders.length === 0) {
      console.log(`[MoneyControl] No quarter headers found for ${companyName}`);
      return [];
    }

    // Initialize quarters array
    const numQuarters = Math.min(quarterHeaders.length, numberOfQuarters);
    for (let i = 0; i < numQuarters; i++) {
      const qHeader = quarterHeaders[i];
      const { period } = parseQuarterHeader(qHeader);
      quarters.push({
        quarter: qHeader,
        period: period,
        indicators: {}
      });
    }

    // Extract data from each row
    financialTable.find('tr').each((rowIdx: number, row: any) => {
      const cells = $(row).find('td, th');
      if (cells.length < 3) return; // Skip rows with too few cells

      // First cell is the indicator name
      const indicatorName = $(cells[0]).text().trim();
      
      // Skip header rows and section headers
      if (!indicatorName || 
          indicatorName === 'Indicators' || 
          indicatorName === 'Trend' ||
          indicatorName.toUpperCase() === 'EXPENDITURE' ||
          indicatorName.toUpperCase() === 'INCOME' ||
          indicatorName.includes('EPS Before Extra') ||
          indicatorName.includes('EPS After Extra')) {
        return;
      }

      const standardName = normalizeIndicatorName(indicatorName);
      
      // Find where the data columns start
      // Usually: Column 0 = Indicator, Column 1 = Trend (chart), Columns 2+ = Data
      let dataStartIdx = 1;
      
      // Check if column 1 is a trend column (usually empty or contains chart)
      const col1Text = $(cells[1]).text().trim();
      if (!col1Text || col1Text === '--' || col1Text === '-' || col1Text.length < 2) {
        dataStartIdx = 2; // Skip trend column
      }
      
      // Also check if column 1 looks like a number (then it's data, not trend)
      const col1Num = parseFloat(col1Text.replace(/,/g, ''));
      if (!isNaN(col1Num) && col1Text.length > 0) {
        dataStartIdx = 1; // Column 1 is data
      }

      // Extract values for each quarter
      let quarterIdx = 0;
      for (let cellIdx = dataStartIdx; cellIdx < cells.length && quarterIdx < quarters.length; cellIdx++) {
        const cellText = $(cells[cellIdx]).text().trim();
        
        // Skip empty cells or trend indicators
        if (!cellText || cellText === '--' || cellText === '-' || cellText === 'NA') {
          quarters[quarterIdx].indicators[standardName] = '--';
          quarterIdx++;
          continue;
        }

        // Parse numeric value
        const cleanText = cellText.replace(/,/g, '').replace(/[()]/g, '-');
        const numValue = parseFloat(cleanText);
        
        if (!isNaN(numValue)) {
          quarters[quarterIdx].indicators[standardName] = numValue;
        } else {
          quarters[quarterIdx].indicators[standardName] = '--';
        }
        quarterIdx++;
      }
    });

    // Validate we got meaningful data
    const hasData = quarters.some(q => {
      const netSales = q.indicators['Net Sales / Income from Operations'];
      return netSales !== undefined && netSales !== '--' && netSales !== 'NA';
    });

    if (!hasData) {
      console.log(`[MoneyControl] No meaningful data found for ${companyName}`);
      // Log what we did find for debugging
      console.log(`[MoneyControl] Sample indicators found: ${Object.keys(quarters[0]?.indicators || {}).slice(0, 5).join(', ')}`);
      return [];
    }

    console.log(`[MoneyControl] Successfully extracted ${quarters.length} quarters for ${companyName}`);
    console.log(`[MoneyControl] Net Sales: ${quarters.map(q => q.indicators['Net Sales / Income from Operations']).slice(0, 4).join(', ')}`);
    console.log(`[MoneyControl] Employees Cost: ${quarters.map(q => q.indicators['Employees Cost']).slice(0, 4).join(', ')}`);
    
    return quarters;


    } catch (error) {
      lastError = error;
      console.error(`[MoneyControl] Attempt ${attempt}/${maxRetries} failed for ${companyName}:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[MoneyControl] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  console.error(`[MoneyControl] All ${maxRetries} attempts failed for ${companyName}`);
  throw lastError;
}

/**
 * Get MoneyControl URL for a company
 */
export function getMoneyControlUrl(companySlug: string, companyCode: string): string {
  return `https://www.moneycontrol.com/financials/${companySlug}/results/quarterly-results/${companyCode}`;
}
