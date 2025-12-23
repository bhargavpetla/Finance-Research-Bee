import ExcelJS from 'exceljs';
import { QuarterlyData } from './moneyControlScraper';
import { CalculatedMetrics } from './calculator';

/**
 * Sort quarters by year (descending) then by quarter number (descending)
 * Handles formats like "Q3'25", "Q4'24", "Q3 FY2025", "Q3 FY25"
 */
function sortQuartersByYearThenQuarter(quarters: string[]): string[] {
  return quarters.sort((a, b) => {
    // Parse quarter strings like "Q3'25" or "Q3 FY2025"
    const parseQuarter = (q: string) => {
      // Try format: Q3'25 or Q3'25
      let match = q.match(/Q(\d)['']?(\d{2})/);
      if (match) {
        return {
          year: 2000 + parseInt(match[2]),
          quarter: parseInt(match[1])
        };
      }
      // Try format: Q3 FY2025 or Q3 FY25
      match = q.match(/Q(\d)\s*FY\s*(\d{2,4})/i);
      if (match) {
        let year = parseInt(match[2]);
        if (year < 100) year += 2000;
        return {
          year: year,
          quarter: parseInt(match[1])
        };
      }
      return { year: 0, quarter: 0 };
    };
    
    const aParsed = parseQuarter(a);
    const bParsed = parseQuarter(b);
    
    // Sort by year descending, then by quarter descending
    if (aParsed.year !== bParsed.year) {
      return bParsed.year - aParsed.year;
    }
    return bParsed.quarter - aParsed.quarter;
  });
}

export interface CompanyQuarterlyData {
  companyName: string;
  dataSource: 'screener' | 'moneycontrol' | 'perplexity' | 'perplexity-url';
  quarters: Array<{
    quarter: string;
    period: string;
    rawData: Record<string, number | string>;
    calculatedMetrics: CalculatedMetrics;
  }>;
}

/**
 * Parse the input Excel file to understand its structure
 */
export async function parseInputExcel(fileBuffer: Buffer | ArrayBuffer): Promise<{
  hasValidStructure: boolean;
  numberOfQuarters: number;
  companies: string[];
}> {
  const workbook = new ExcelJS.Workbook();
  const bufferToLoad = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
  await workbook.xlsx.load(bufferToLoad as any);

  // Check if Sheet1 exists
  const sheet1 = workbook.getWorksheet('Sheet1') || workbook.getWorksheet(1);
  if (!sheet1) {
    throw new Error('Input file must have at least one sheet');
  }

  // Count number of quarters from the header row
  const headerRow = sheet1.getRow(1);
  let numberOfQuarters = 0;
  headerRow.eachCell((cell, colNumber) => {
    if (colNumber > 1 && cell.value) {
      numberOfQuarters++;
    }
  });

  return {
    hasValidStructure: true,
    numberOfQuarters: Math.min(numberOfQuarters, 14), // Limit to 14 quarters
    companies: [] // Will be filled from the companies config
  };
}

/**
 * Generate output Excel file with consolidated and company-specific sheets
 */
export async function generateOutputExcel(
  allCompanyData: CompanyQuarterlyData[],
  templateBuffer?: Buffer
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Create Sheet 1: Quarterly Financials (Consolidated)
  const consolidatedSheet = workbook.addWorksheet('Quarterly Financials');

  // Build consolidated view
  await buildConsolidatedSheet(consolidatedSheet, allCompanyData);

  // Create individual company sheets
  for (const companyData of allCompanyData) {
    const companySheet = workbook.addWorksheet(companyData.companyName);
    await buildCompanySheet(companySheet, companyData);
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

/**
 * Build the consolidated sheet (Sheet 1) - Dashboard format
 * Columns: Companies | Revenue (Q3'25 Q2'25...) | Op. EBITDA% | Op. EBIT% | Op. PBT | PBT
 */
async function buildConsolidatedSheet(
  sheet: ExcelJS.Worksheet,
  allCompanyData: CompanyQuarterlyData[]
): Promise<void> {
  // Get all unique quarters across all companies, sorted by year then quarter (most recent first)
  const allQuarters = new Set<string>();
  allCompanyData.forEach(company => {
    company.quarters.forEach(q => allQuarters.add(q.period || q.quarter));
  });
  const quartersList = sortQuartersByYearThenQuarter(Array.from(allQuarters)); // Sort by year, then quarter

  // Dashboard metrics to display
  const dashboardMetrics = ['Revenue', 'Op. EBITDA%', 'Op. EBIT%', 'Op. PBT', 'PBT'];

  // Build header row 1: Metric groups
  const headerRow1: string[] = ['Companies'];
  for (const metric of dashboardMetrics) {
    headerRow1.push(metric);
    // Add empty cells for remaining quarters
    for (let i = 1; i < quartersList.length; i++) {
      headerRow1.push('');
    }
  }
  sheet.addRow(headerRow1);

  // Merge cells for metric headers
  if (quartersList.length > 1) {
    let colStart = 2;
    for (let i = 0; i < dashboardMetrics.length; i++) {
      const colEnd = colStart + quartersList.length - 1;
      try {
        sheet.mergeCells(1, colStart, 1, colEnd);
      } catch (e) {
        console.log(`Skipping merge for columns ${colStart}-${colEnd}`);
      }
      colStart = colEnd + 1;
    }
  }

  // Style header row 1
  const headerRow1Obj = sheet.getRow(1);
  headerRow1Obj.font = { bold: true };
  headerRow1Obj.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' } // Light blue background
  };
  headerRow1Obj.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow1Obj.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  // Build header row 2: Quarter names
  const headerRow2: string[] = [''];
  for (const metric of dashboardMetrics) {
    for (const quarter of quartersList) {
      headerRow2.push(quarter);
    }
  }
  sheet.addRow(headerRow2);

  // Style header row 2
  const headerRow2Obj = sheet.getRow(2);
  headerRow2Obj.font = { bold: true };
  headerRow2Obj.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' } // Light blue background
  };
  headerRow2Obj.alignment = { horizontal: 'center' };
  headerRow2Obj.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  // Add company data rows
  for (const company of allCompanyData) {
    const row: (string | number)[] = [company.companyName];

    for (const metric of dashboardMetrics) {
      for (const quarter of quartersList) {
        const quarterData = company.quarters.find(q => (q.period || q.quarter) === quarter);

        if (quarterData) {
          let value: number | string | undefined;

          // Get value from calculated metrics
          if (metric === 'Revenue') {
            value = quarterData.calculatedMetrics.Revenue ?? quarterData.rawData['Net Sales / Income from Operations'];
          } else if (metric === 'Op. EBITDA%') {
            value = quarterData.calculatedMetrics['Op. EBITDA%'];
          } else if (metric === 'Op. EBIT%') {
            value = quarterData.calculatedMetrics['Op. EBIT%'];
          } else if (metric === 'Op. PBT') {
            value = quarterData.calculatedMetrics['Op. PBT'];
          } else if (metric === 'PBT') {
            value = quarterData.calculatedMetrics.PBT ?? quarterData.rawData['P/L Before Tax'];
          }

          if (value === undefined || value === '--' || value === 'NA') {
            row.push('');
          } else if (typeof value === 'number') {
            // Format percentage metrics
            if (metric.includes('%')) {
              row.push(Math.round(value)); // Round to whole number as per screenshot example (19%, 20%)
            } else {
              row.push(Math.round(value)); // Round to whole number
            }
          } else {
            row.push(value);
          }
        } else {
          row.push('');
        }
      }
    }

    const dataRow = sheet.addRow(row);
    dataRow.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }

  // Auto-fit columns
  sheet.columns.forEach((column, idx) => {
    if (idx === 0) {
      column.width = 25;
    } else {
      column.width = 8; // Narrower columns for data
    }
  });
}

/**
 * Build the detailed consolidated sheet (Sheet 2) with all indicators
 */
async function buildDetailedConsolidatedSheet(
  sheet: ExcelJS.Worksheet,
  allCompanyData: CompanyQuarterlyData[]
): Promise<void> {
  // Define financial indicators in order
  const indicators = [
    'INCOME',
    'Net Sales / Income from Operations',
    'Other Operating Income',
    'Total Income From Operations',
    'EXPENDITURE',
    'Consumption of Raw Materials',
    'Purchase of Traded Goods',
    'Increase / Decrease in Stocks',
    'Power & Fuel',
    'Employees Cost',
    'Depreciation',
    'Excise Duty',
    'Admin. And Selling Expenses',
    'R & D Expenses',
    'Provisions And Contingencies',
    'Exp. Capitalised',
    'Other Expenses',
    'P/L Before Other Inc., Int., Excpt. Items & Tax',
    'Other Income',
    'P/L Before Int., Excpt. Items & Tax',
    'Interest',
    'P/L Before Exceptional Items & Tax',
    'Exceptional Items',
    'P/L Before Tax',
    'Tax',
    'P/L After Tax from Ordinary Activities',
    'Prior Year Adjustments',
    'Extraordinary Items',
    'Net Profit / (Loss) for the Period',
    'DERIVED METRICS',
    'Revenue',
    'Contribution',
    'Op. EBITDA',
    'Op. EBITDA%',
    'Op. EBIT',
    'Op. EBIT%',
    'Op. PBT',
    'PBT'
  ];

  // Get all unique quarters across all companies, sorted by year then quarter (most recent first)
  const allQuarters = new Set<string>();
  allCompanyData.forEach(company => {
    company.quarters.forEach(q => allQuarters.add(q.quarter));
  });
  const quartersList = sortQuartersByYearThenQuarter(Array.from(allQuarters)); // Sort by year, then quarter

  // Build header row
  const headerRow = ['Indicator'];
  for (const company of allCompanyData) {
    for (const quarter of quartersList) { // Show all quarters per company
      headerRow.push(`${company.companyName} ${quarter}`);
    }
  }
  sheet.addRow(headerRow);

  // Style header row
  const headerRowObj = sheet.getRow(1);
  headerRowObj.font = { bold: true };
  headerRowObj.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9D9D9' }
  };

  // Add data rows
  for (const indicator of indicators) {
    const row: (string | number)[] = [indicator];

    // Check if this is a section header
    const isSectionHeader = ['INCOME', 'EXPENDITURE', 'DERIVED METRICS'].includes(indicator);

    for (const company of allCompanyData) {
      for (const quarter of quartersList) {
        const quarterData = company.quarters.find(q => q.quarter === quarter);

        if (isSectionHeader) {
          row.push('');
        } else if (quarterData) {
          // Try to get value from raw data or calculated metrics
          const value = quarterData.rawData[indicator] ?? quarterData.calculatedMetrics[indicator as keyof CalculatedMetrics];
          row.push(value === '--' ? '--' : (typeof value === 'number' ? value : ''));
        } else {
          row.push('');
        }
      }
    }

    const dataRow = sheet.addRow(row);

    // Style section headers
    if (isSectionHeader) {
      dataRow.font = { bold: true };
      dataRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
    }
  }

  // Auto-fit columns
  sheet.columns.forEach((column, idx) => {
    if (idx === 0) {
      column.width = 40;
    } else {
      column.width = 15;
    }
  });
}

/**
 * Build individual company sheet
 */
async function buildCompanySheet(
  sheet: ExcelJS.Worksheet,
  companyData: CompanyQuarterlyData
): Promise<void> {
  // Add title
  sheet.addRow([`Profit & Loss account of ${companyData.companyName} (in Rs. Cr.)`]);
  sheet.getRow(1).font = { bold: true, size: 14 };

  // Add quarter headers
  const headerRow = ['Indicator'];
  companyData.quarters.forEach(q => {
    headerRow.push(q.quarter);
  });
  sheet.addRow(headerRow);

  const headerRowObj = sheet.getRow(2);
  headerRowObj.font = { bold: true };
  headerRowObj.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9D9D9' }
  };

  // Define indicators for company sheet
  const indicators = [
    'INCOME',
    'Net Sales / Income from Operations',
    'Other Operating Income',
    'Total Income From Operations',
    'EXPENDITURE',
    'Purchase of Traded Goods',
    'Increase / Decrease in Stocks',
    'Employees Cost',
    'Depreciation',
    'Other Expenses',
    'PROFIT & LOSS',
    'P/L Before Other Inc., Int., Excpt. Items & Tax',
    'Other Income',
    'Interest',
    'P/L Before Tax',
    'Tax',
    'Net Profit / (Loss) for the Period',
    'DERIVED METRICS',
    'Revenue',
    'Contribution',
    'Op. EBITDA',
    'Op. EBITDA%',
    'Op. EBIT',
    'Op. EBIT%',
    'Op. PBT',
    'PBT'
  ];

  // Add data rows
  for (const indicator of indicators) {
    const row: (string | number)[] = [indicator];
    const isSectionHeader = ['INCOME', 'EXPENDITURE', 'PROFIT & LOSS', 'DERIVED METRICS'].includes(indicator);

    companyData.quarters.forEach(q => {
      if (isSectionHeader) {
        row.push('');
      } else {
        const value = q.rawData[indicator] ?? q.calculatedMetrics[indicator as keyof CalculatedMetrics];
        row.push(value === '--' ? '--' : (typeof value === 'number' ? value : ''));
      }
    });

    const dataRow = sheet.addRow(row);

    if (isSectionHeader) {
      dataRow.font = { bold: true };
      dataRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
    }
  }

  // Auto-fit columns
  sheet.columns.forEach((column, idx) => {
    if (idx === 0) {
      column.width = 40;
    } else {
      column.width = 15;
    }
  });
}
