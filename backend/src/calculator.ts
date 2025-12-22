/**
 * Financial Metrics Calculation Engine
 * 
 * Implements strict formulas for derived metrics as per requirements:
 * - Contribution = Total Income From Operations - Purchase of Traded Goods - Increase/Decrease in Stocks
 * - Op. EBITDA = Contribution - Employee Cost - Other Expenses
 * - Op. EBIT = Op. EBITDA - Depreciation
 * - Op. PBT = Op. EBIT - Interest
 * - PBT = Op. PBT + Other Income
 */

export interface RawFinancialData {
  'Net Sales / Income from Operations'?: number | string;
  'Other Operating Income'?: number | string;
  'Total Income From Operations'?: number | string;
  'Purchase of Traded Goods'?: number | string;
  'Increase / Decrease in Stocks'?: number | string;
  'Employees Cost'?: number | string;
  'Depreciation'?: number | string;
  'Other Expenses'?: number | string;
  'Other Income'?: number | string;
  'Interest'?: number | string;
  'P/L Before Tax'?: number | string;
  'Tax'?: number | string;
  'P/L After Tax from Ordinary Activities'?: number | string;
  'Net Profit / (Loss) for the Period'?: number | string;
  [key: string]: number | string | undefined;
}

export interface CalculatedMetrics {
  Revenue?: number;
  Contribution?: number;
  'Op. EBITDA'?: number;
  'Op. EBITDA%'?: number;
  'Op. EBIT'?: number;
  'Op. EBIT%'?: number;
  'Op. PBT'?: number;
  PBT?: number;
}

export interface ValidationIssue {
  metric: string;
  issue: string;
  severity: 'warning' | 'error';
  expected?: number;
  actual?: number;
}

/**
 * Convert value to number, handling "--" and null values
 */
function toNumber(value: number | string | undefined): number | null {
  if (value === undefined || value === null || value === '--' || value === 'NA' || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  const num = parseFloat(String(value).replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

/**
 * Check if a value is available (not null/undefined/NA)
 */
function isAvailable(value: number | null): value is number {
  return value !== null && !isNaN(value);
}

/**
 * Calculate derived financial metrics using strict formulas
 */
export function calculateDerivedMetrics(rawData: RawFinancialData): {
  calculated: CalculatedMetrics;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const calculated: CalculatedMetrics = {};

  // Extract raw values
  const totalIncome = toNumber(rawData['Total Income From Operations']);
  const purchaseTraded = toNumber(rawData['Purchase of Traded Goods']);
  const stockChange = toNumber(rawData['Increase / Decrease in Stocks']);
  const employeeCost = toNumber(rawData['Employees Cost']);
  const depreciation = toNumber(rawData['Depreciation']);
  const otherExpenses = toNumber(rawData['Other Expenses']);
  const otherIncome = toNumber(rawData['Other Income']);
  const interest = toNumber(rawData['Interest']);
  const pbtRaw = toNumber(rawData['P/L Before Tax']);

  // Calculate Contribution
  if (isAvailable(totalIncome)) {
    const purchase = isAvailable(purchaseTraded) ? purchaseTraded : 0;
    const stock = isAvailable(stockChange) ? stockChange : 0;
    calculated.Contribution = totalIncome - purchase - stock;
  } else {
    issues.push({
      metric: 'Contribution',
      issue: 'Total Income From Operations is missing',
      severity: 'error'
    });
  }

  // Calculate Op. EBITDA
  // Try strict formula first: Contribution - Employee Cost - Other Expenses
  if (isAvailable(calculated.Contribution) && isAvailable(employeeCost) && isAvailable(otherExpenses)) {
    calculated['Op. EBITDA'] = calculated.Contribution - employeeCost - otherExpenses;
  } else {
    // Fallback: Check if we have Op. EBITDA directly from raw data (mapped from Operating Profit)
    const rawOpEbitda = toNumber(rawData['Op. EBITDA']) ?? toNumber(rawData['Operating Profit']);

    if (isAvailable(rawOpEbitda)) {
      calculated['Op. EBITDA'] = rawOpEbitda;
      // If we used fallback, we can't strictly validate the components, but that's okay
    } else {
      issues.push({
        metric: 'Op. EBITDA',
        issue: 'Missing required fields: Employees Cost, Other Expenses (and no direct Op. EBITDA found)',
        severity: 'error'
      });
    }
  }

  // Calculate Op. EBITDA%
  if (isAvailable(calculated['Op. EBITDA']) && isAvailable(calculated.Revenue) && calculated.Revenue !== 0) {
    calculated['Op. EBITDA%'] = (calculated['Op. EBITDA'] / calculated.Revenue) * 100;
  }

  // Calculate Op. EBIT
  if (isAvailable(calculated['Op. EBITDA']) && isAvailable(depreciation)) {
    calculated['Op. EBIT'] = calculated['Op. EBITDA'] - depreciation;
  } else {
    issues.push({
      metric: 'Op. EBIT',
      issue: 'Missing Op. EBITDA or Depreciation',
      severity: 'warning'
    });
  }

  // Calculate Op. EBIT%
  if (isAvailable(calculated['Op. EBIT']) && isAvailable(calculated.Revenue) && calculated.Revenue !== 0) {
    calculated['Op. EBIT%'] = (calculated['Op. EBIT'] / calculated.Revenue) * 100;
  }

  // Calculate Op. PBT
  if (isAvailable(calculated['Op. EBIT']) && isAvailable(interest)) {
    calculated['Op. PBT'] = calculated['Op. EBIT'] - interest;
  } else {
    issues.push({
      metric: 'Op. PBT',
      issue: 'Missing Op. EBIT or Interest',
      severity: 'warning'
    });
  }

  // Calculate PBT
  if (isAvailable(calculated['Op. PBT']) && isAvailable(otherIncome)) {
    calculated.PBT = calculated['Op. PBT'] + otherIncome;
  } else {
    // Fallback: Try to use raw PBT if calculation failed
    const rawPBT = toNumber(rawData['P/L Before Tax']) ?? toNumber(rawData['Profit before tax']);
    if (isAvailable(rawPBT)) {
      calculated.PBT = rawPBT;
    } else {
      issues.push({
        metric: 'PBT',
        issue: 'Missing Op. PBT or Other Income (and no direct PBT found)',
        severity: 'error'
      });
    }
  }
  // Extract Revenue (Net Sales / Income from Operations)
  // Try multiple possible keys for Revenue
  const revenueKeys = [
    'Net Sales / Income from Operations',
    'Revenue',
    'Net Sales',
    'Sales',
    'Income',
    'Total Income From Operations' // Fallback
  ];

  let netSales: number | null = null;
  for (const key of revenueKeys) {
    const val = toNumber(rawData[key]);
    if (isAvailable(val)) {
      netSales = val;
      break;
    }
  }

  if (isAvailable(netSales)) {
    calculated.Revenue = netSales;
  } else {
    console.warn('[Calculator] Revenue not found. Keys checked:', revenueKeys);
  }

  // Calculate Op. EBITDA% = (Op. EBITDA / Revenue) × 100
  const revenue = calculated.Revenue;
  const opEBITDAValue = calculated['Op. EBITDA'];

  if (revenue !== undefined && revenue !== 0 && opEBITDAValue !== undefined) {
    calculated['Op. EBITDA%'] = (opEBITDAValue / revenue) * 100;
  } else {
    if (opEBITDAValue !== undefined && (revenue === undefined || revenue === 0)) {
      console.warn(`[Calculator] Op. EBITDA% skipped: Revenue is ${revenue}`);
    }
  }

  // Calculate Op. EBIT% = (Op. EBIT / Revenue) × 100
  const opEBITValue = calculated['Op. EBIT'];
  if (revenue !== undefined && revenue !== 0 && opEBITValue !== undefined) {
    calculated['Op. EBIT%'] = (opEBITValue / revenue) * 100;
  } else {
    if (opEBITValue !== undefined && (revenue === undefined || revenue === 0)) {
      console.warn(`[Calculator] Op. EBIT% skipped: Revenue is ${revenue}`);
    }
  }

  // Validate PBT against raw data (tolerance: ₹1 Cr)
  const calculatedPBT = calculated.PBT;
  if (calculatedPBT !== undefined && isAvailable(pbtRaw)) {
    const difference = Math.abs(calculatedPBT - pbtRaw);
    if (difference > 1) {
      issues.push({
        metric: 'PBT',
        issue: `Calculated PBT differs from MoneyControl value by ₹${difference.toFixed(2)} Cr`,
        severity: 'warning',
        expected: pbtRaw,
        actual: calculated.PBT
      });
    }
  }

  return { calculated, issues };
}

/**
 * Merge raw data with calculated metrics
 */
export function mergeFinancialData(
  rawData: RawFinancialData,
  calculated: CalculatedMetrics
): Record<string, number | string> {
  return {
    ...rawData,
    ...calculated
  };
}

/**
 * Validate that all required base metrics are present
 */
export function validateRequiredMetrics(data: RawFinancialData): ValidationIssue[] {
  const requiredMetrics = [
    'Total Income From Operations',
    'Employees Cost',
    'Other Expenses',
    'Depreciation'
  ];

  const issues: ValidationIssue[] = [];

  for (const metric of requiredMetrics) {
    const value = toNumber(data[metric]);
    if (!isAvailable(value)) {
      issues.push({
        metric,
        issue: 'Required metric is missing or invalid',
        severity: 'error'
      });
    }
  }

  return issues;
}

/**
 * Round financial values to 2 decimal places
 */
export function roundFinancialValue(value: number | string): number | string {
  if (value === '--' || value === 'NA' || value === '') {
    return value;
  }
  const num = toNumber(value);
  if (num === null) {
    return '--';
  }
  return Math.round(num * 100) / 100;
}
