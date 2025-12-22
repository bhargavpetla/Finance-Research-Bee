/**
 * Indian Fiscal Year Quarter Mapping
 * 
 * Indian fiscal year runs from April to March:
 * - Q1 FY2026: Apr-Jun 2025
 * - Q2 FY2026: Jul-Sep 2025
 * - Q3 FY2026: Oct-Dec 2025
 * - Q4 FY2026: Jan-Mar 2026
 */

export interface QuarterInfo {
  quarter: string; // e.g., "Q1 FY2026"
  fiscalYear: number; // e.g., 2026
  quarterNumber: number; // 1-4
  startMonth: number; // 1-12
  endMonth: number; // 1-12
  startYear: number;
  endYear: number;
  period: string; // e.g., "Apr-Jun 2025"
}

/**
 * Convert calendar month/year to Indian fiscal quarter
 * @param month Calendar month (1-12)
 * @param year Calendar year
 * @returns QuarterInfo object
 */
export function getIndianFiscalQuarter(month: number, year: number): QuarterInfo {
  let fiscalYear: number;
  let quarterNumber: number;
  let startMonth: number;
  let endMonth: number;
  let startYear: number;
  let endYear: number;

  // Determine fiscal year and quarter
  if (month >= 4 && month <= 6) {
    // Apr-Jun: Q1 of next fiscal year
    quarterNumber = 1;
    fiscalYear = year + 1;
    startMonth = 4;
    endMonth = 6;
    startYear = year;
    endYear = year;
  } else if (month >= 7 && month <= 9) {
    // Jul-Sep: Q2 of next fiscal year
    quarterNumber = 2;
    fiscalYear = year + 1;
    startMonth = 7;
    endMonth = 9;
    startYear = year;
    endYear = year;
  } else if (month >= 10 && month <= 12) {
    // Oct-Dec: Q3 of next fiscal year
    quarterNumber = 3;
    fiscalYear = year + 1;
    startMonth = 10;
    endMonth = 12;
    startYear = year;
    endYear = year;
  } else {
    // Jan-Mar: Q4 of current fiscal year
    quarterNumber = 4;
    fiscalYear = year;
    startMonth = 1;
    endMonth = 3;
    startYear = year;
    endYear = year;
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const period = `${monthNames[startMonth - 1]}-${monthNames[endMonth - 1]} ${startYear}`;

  return {
    quarter: `Q${quarterNumber} FY${fiscalYear}`,
    fiscalYear,
    quarterNumber,
    startMonth,
    endMonth,
    startYear,
    endYear,
    period
  };
}

/**
 * Parse quarter string like "Q1 FY2026" or "Q2'FY26"
 */
export function parseQuarterString(quarterStr: string): QuarterInfo | null {
  // Handle formats: "Q1 FY2026", "Q2'FY26", "Q1FY2026"
  const match = quarterStr.match(/Q(\d)['\s]*FY['\s]*(\d{2,4})/i);
  if (!match) return null;

  const quarterNumber = parseInt(match[1]);
  let fiscalYear = parseInt(match[2]);
  
  // Convert 2-digit year to 4-digit
  if (fiscalYear < 100) {
    fiscalYear += 2000;
  }

  if (quarterNumber < 1 || quarterNumber > 4) return null;

  let startMonth: number;
  let endMonth: number;
  let startYear: number;
  let endYear: number;

  switch (quarterNumber) {
    case 1:
      startMonth = 4;
      endMonth = 6;
      startYear = fiscalYear - 1;
      endYear = fiscalYear - 1;
      break;
    case 2:
      startMonth = 7;
      endMonth = 9;
      startYear = fiscalYear - 1;
      endYear = fiscalYear - 1;
      break;
    case 3:
      startMonth = 10;
      endMonth = 12;
      startYear = fiscalYear - 1;
      endYear = fiscalYear - 1;
      break;
    case 4:
      startMonth = 1;
      endMonth = 3;
      startYear = fiscalYear;
      endYear = fiscalYear;
      break;
    default:
      return null;
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const period = `${monthNames[startMonth - 1]}-${monthNames[endMonth - 1]} ${startYear}`;

  return {
    quarter: `Q${quarterNumber} FY${fiscalYear}`,
    fiscalYear,
    quarterNumber,
    startMonth,
    endMonth,
    startYear,
    endYear,
    period
  };
}

/**
 * Get the current Indian fiscal quarter
 */
export function getCurrentFiscalQuarter(): QuarterInfo {
  const now = new Date();
  return getIndianFiscalQuarter(now.getMonth() + 1, now.getFullYear());
}

/**
 * Get N previous quarters from a given quarter
 */
export function getPreviousQuarters(fromQuarter: QuarterInfo, count: number): QuarterInfo[] {
  const quarters: QuarterInfo[] = [];
  let currentFY = fromQuarter.fiscalYear;
  let currentQ = fromQuarter.quarterNumber;

  for (let i = 0; i < count; i++) {
    // Move to previous quarter
    currentQ--;
    if (currentQ < 1) {
      currentQ = 4;
      currentFY--;
    }

    const quarterStr = `Q${currentQ} FY${currentFY}`;
    const quarterInfo = parseQuarterString(quarterStr);
    if (quarterInfo) {
      quarters.push(quarterInfo);
    }
  }

  return quarters;
}
