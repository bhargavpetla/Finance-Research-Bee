import { scrapeMoneyControl, QuarterlyData } from './moneyControlScraper';

import { extractFinancialDataWithPerplexity, getMoneyControlUrlFromPerplexity } from './perplexity';
import { scrapeScreener } from './screenerScraper';
import { calculateDerivedMetrics, RawFinancialData } from './calculator';
import { CompanyQuarterlyData, generateOutputExcel } from './excelProcessor';
import { updateScrapingJob } from './db';

/**
 * Utility function to add delay between requests (rate limiting)
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export interface CompanyDetail {
  company: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage?: string;
  dataSource?: 'screener' | 'moneycontrol' | 'perplexity' | 'perplexity-url';
  estimatedTime?: number;
  progress?: number;
  liveData?: any;
  reasoning?: string;
  switchedSource?: boolean;
  fallbackStep?: number; // 1 = MoneyControl, 2 = Perplexity URL lookup, 3 = Perplexity Finance
}

export interface ScrapingProgress {
  currentCompany: string;
  completedCompanies: string[];
  failedCompanies: string[];
  totalCompanies: number;
  currentStep: string;
  companyDetails?: CompanyDetail[];
  isTestMode?: boolean;
  testCompanyCompleted?: boolean;
  logs?: string[];
}

export interface ScrapingResult {
  success: boolean;
  outputBuffer?: Buffer;
  errors: Array<{
    company: string;
    error: string;
    timestamp: number;
  }>;
  extractedData?: CompanyQuarterlyData[];
}

export async function orchestrateFinancialDataScraping(
  jobId: number,
  selectedQuarters: string[],
  selectedFiscalYears: number[],
  testMode: boolean = false, // If true, only process first company
  testCompany?: string, // Specific company to test with
  selectedCompanies?: string[], // List of companies to process
  onProgress?: (progress: ScrapingProgress) => void
): Promise<ScrapingResult> {
  const allCompanyData: CompanyQuarterlyData[] = [];
  const errors: Array<{ company: string; error: string; timestamp: number }> = [];
  const completedCompanies: string[] = [];
  const failedCompanies: string[] = [];

  // Determine companies to process
  let companiesToProcess: { name: string; url: string; moneyControlUrl: string }[] = [];

  if (testMode) {
    if (testCompany) {
      companiesToProcess = [{ name: testCompany, url: '', moneyControlUrl: '' }];
    } else {
      // Default test company if none provided
      companiesToProcess = [{ name: 'TCS', url: '', moneyControlUrl: '' }];
    }
  } else if (selectedCompanies && selectedCompanies.length > 0) {
    // Filter companies based on user selection
    // We map from selectedCompanies to ensure we include custom added companies
    companiesToProcess = selectedCompanies.map(name => {
      // For custom companies, we create a basic object. 
      // The scrapers will handle URL generation based on the name.
      return { name, url: '', moneyControlUrl: '' };
    });
  } else {
    console.warn('No companies selected for scraping.');
    return {
      success: false,
      errors: [{ company: 'System', error: 'No companies selected', timestamp: Date.now() }],
      extractedData: []
    };
  }
  const totalCompanies = companiesToProcess.length;
  const startTime = Date.now();

  const logs: string[] = [];
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    logs.push(logMessage);
    // Keep only last 50 logs to prevent payload getting too large
    if (logs.length > 50) logs.shift();
  };

  // Initialize company details
  const companyDetails: CompanyDetail[] = companiesToProcess.map(c => ({
    company: c.name,
    status: 'pending' as const,
    stage: 'Waiting to start',
    progress: 0,
    fallbackStep: 1
  }));

  for (let idx = 0; idx < companiesToProcess.length; idx++) {
    const company = companiesToProcess[idx];
    const companyStartTime = Date.now();

    try {
      // Update company status to processing
      companyDetails[idx].status = 'processing';
      companyDetails[idx].stage = 'Initializing scraper';
      companyDetails[idx].progress = 0;
      addLog(`Starting process for ${company.name}...`);

      // Calculate estimated time based on previous companies
      const avgTimePerCompany = completedCompanies.length > 0
        ? (Date.now() - startTime) / completedCompanies.length
        : 30000; // Default 30 seconds
      companyDetails[idx].estimatedTime = Math.round(avgTimePerCompany / 1000);

      // Update progress
      const progress: ScrapingProgress = {
        currentCompany: company.name,
        completedCompanies,
        failedCompanies,
        totalCompanies,
        currentStep: `Processing ${company.name}...`,
        companyDetails: [...companyDetails],
        isTestMode: testMode,
        testCompanyCompleted: false,
        logs: [...logs]
      };

      if (onProgress) {
        onProgress(progress);
      }

      await updateScrapingJob(jobId, {
        progressData: progress
      });

      let quarterlyData: QuarterlyData[] = [];
      let dataSource: 'screener' | 'moneycontrol' | 'perplexity' | 'perplexity-url' = 'screener';

      // Calculate total quarters needed
      const totalQuarters = Math.max(selectedQuarters.length * selectedFiscalYears.length, 8);

      // ========== SCREENER-FIRST APPROACH ==========
      // Screener.in has well-structured HTML tables that are easy to scrape
      // Use Screener as primary source for accurate raw data

      // STEP 1: Try Screener.in scraping (primary source)
      companyDetails[idx].stage = 'Step 1: Extracting data from Screener.in';
      companyDetails[idx].dataSource = 'screener';
      companyDetails[idx].fallbackStep = 1;
      companyDetails[idx].progress = 10;
      addLog(`[Step 1] Attempting to scrape ${company.name} from Screener.in`);
      await updateScrapingJob(jobId, { progressData: { ...progress, companyDetails: [...companyDetails], logs: [...logs] } });

      try {
        const screenerData = await scrapeScreener(company.name);

        if (screenerData && screenerData.quarters && screenerData.quarters.length > 0) {
          quarterlyData = screenerData.quarters.map((q: any) => ({
            quarter: q.quarter || q.period,
            period: q.quarter || q.period,
            indicators: q.rawData || {}
          }));
        }

        // Verify we got actual data
        if (quarterlyData.length === 0 || !hasValidData(quarterlyData)) {
          throw new Error('No valid data extracted from Screener.in');
        }

        dataSource = 'screener';
        companyDetails[idx].progress = 50;
        addLog(`[Step 1] SUCCESS: Got ${quarterlyData.length} quarters for ${company.name} from Screener.in`);

      } catch (step1Error) {
        addLog(`[Step 1] Screener.in failed for ${company.name}: ${step1Error}`);

        // STEP 2: Try MoneyControl scraping as fallback (only if URL is configured)
        if (!company.moneyControlUrl) {
          addLog(`[Step 2] Skipping MoneyControl - no URL configured for ${company.name}`);
          // Don't throw - let the outer catch handle this as a failed company
          throw new Error(`No data sources available for ${company.name}. Screener failed and no MoneyControl URL configured.`);
        }

        companyDetails[idx].stage = 'Step 2: Trying MoneyControl scraping';
        companyDetails[idx].dataSource = 'moneycontrol';
        companyDetails[idx].fallbackStep = 2;
        companyDetails[idx].switchedSource = true;
        companyDetails[idx].progress = 25;
        addLog(`[Step 2] Falling back to MoneyControl for ${company.name}`);
        await updateScrapingJob(jobId, { progressData: { ...progress, companyDetails: [...companyDetails], logs: [...logs] } });

        try {
          quarterlyData = await scrapeMoneyControl(company.moneyControlUrl, totalQuarters, company.name);

          if (quarterlyData.length === 0 || !hasValidData(quarterlyData)) {
            throw new Error('No valid data from MoneyControl scraping');
          }

          dataSource = 'moneycontrol';
          companyDetails[idx].progress = 50;
          addLog(`[Step 2] SUCCESS: Got ${quarterlyData.length} quarters from MoneyControl`);

        } catch (step2Error) {
          addLog(`[Step 2] MoneyControl scraping failed: ${step2Error}`);

          // STEP 3: Ask Perplexity for correct MoneyControl URL
          companyDetails[idx].stage = 'Step 3: Getting URL from Perplexity AI';
          companyDetails[idx].dataSource = 'perplexity-url';
          companyDetails[idx].fallbackStep = 3;
          companyDetails[idx].progress = 40;
          addLog(`[Step 3] Asking Perplexity for correct URL for ${company.name}`);
          await updateScrapingJob(jobId, { progressData: { ...progress, companyDetails: [...companyDetails], logs: [...logs] } });

          try {
            const perplexityUrl = await getMoneyControlUrlFromPerplexity(company.name);

            if (perplexityUrl) {
              addLog(`[Step 3] Perplexity found URL: ${perplexityUrl}`);
              quarterlyData = await scrapeMoneyControl(perplexityUrl, totalQuarters, company.name);
            }

            if (quarterlyData.length === 0 || !hasValidData(quarterlyData)) {
              throw new Error('No valid data from Perplexity-provided URL');
            }

            dataSource = 'perplexity-url';
            companyDetails[idx].progress = 50;
            addLog(`[Step 3] SUCCESS: Got ${quarterlyData.length} quarters from Perplexity URL`);

          } catch (step3Error) {
            addLog(`[Step 3] Perplexity Finance also failed: ${step3Error}`);

            // All 3 steps failed
            companyDetails[idx].status = 'failed';
            companyDetails[idx].stage = `All 3 fallback steps failed`;
            companyDetails[idx].progress = 0;
            failedCompanies.push(company.name);
            errors.push({
              company: company.name,
              error: `All fallback steps failed: ${String(step3Error).substring(0, 100)}`,
              timestamp: Date.now()
            });
            await updateScrapingJob(jobId, { progressData: { ...progress, companyDetails: [...companyDetails], logs: [...logs] } });
            continue; // Skip to next company
          }
        }
      }

      // Store live extracted data for frontend display
      companyDetails[idx].liveData = quarterlyData;
      companyDetails[idx].stage = 'Processing extracted data';
      companyDetails[idx].progress = 60;
      await updateScrapingJob(jobId, { progressData: { ...progress, companyDetails: [...companyDetails], logs: [...logs] } });

      // Process and calculate metrics for each quarter
      companyDetails[idx].stage = 'Calculating derived metrics';
      companyDetails[idx].progress = 75;
      await updateScrapingJob(jobId, { progressData: { ...progress, companyDetails: [...companyDetails], logs: [...logs] } });

      const processedQuarters = quarterlyData.map(q => {
        const { calculated, issues } = calculateDerivedMetrics(q.indicators as RawFinancialData);

        if (issues.length > 0) {
          // Log issues but don't fail
          console.warn(`[Validation] Issues for ${company.name} ${q.quarter}:`, issues);
        }

        return {
          quarter: q.quarter,
          period: q.period,
          rawData: q.indicators,
          calculatedMetrics: calculated
        };
      }).filter(q => {
        // Filter based on selected quarters and fiscal years
        // q.period format is typically "Q2'26" or similar
        const match = q.period.match(/Q(\d)'(\d{2})/);
        if (!match) return true; // Keep if format doesn't match (safety)

        const quarterNum = `Q${match[1]}`;
        const yearShort = parseInt(match[2], 10);
        const fiscalYear = 2000 + yearShort;

        // Check if quarter is selected
        const isQuarterSelected = selectedQuarters.includes(quarterNum);

        // Check if fiscal year is selected
        const isYearSelected = selectedFiscalYears.includes(fiscalYear);

        return isQuarterSelected && isYearSelected;
      });

      allCompanyData.push({
        companyName: company.name,
        dataSource,
        quarters: processedQuarters
      });

      // Mark company as completed
      companyDetails[idx].status = 'completed';
      companyDetails[idx].stage = `Completed (${dataSource})`;
      companyDetails[idx].progress = 100;
      completedCompanies.push(company.name);

      const elapsedTime = Math.round((Date.now() - companyStartTime) / 1000);
      addLog(`[Complete] ${company.name} processed in ${elapsedTime}s via ${dataSource}`);

      await updateScrapingJob(jobId, {
        progressData: {
          ...progress,
          companyDetails: [...companyDetails],
          completedCompanies: [...completedCompanies],
          testCompanyCompleted: testMode && idx === 0
        }
      });

    } catch (error) {
      console.error(`Unexpected error processing ${company.name}:`, error);
      companyDetails[idx].status = 'failed';
      companyDetails[idx].stage = `Error: ${String(error).substring(0, 100)}`;
      companyDetails[idx].progress = 0; // Reset progress to show it's done (failed)
      failedCompanies.push(company.name);
      errors.push({
        company: company.name,
        error: String(error),
        timestamp: Date.now()
      });
      
      // Update progress immediately so UI shows error state instead of buffering
      await updateScrapingJob(jobId, {
        progressData: {
          currentCompany: company.name,
          completedCompanies,
          failedCompanies,
          totalCompanies,
          currentStep: `Failed: ${company.name}`,
          companyDetails: [...companyDetails],
          isTestMode: testMode,
          logs: [...logs]
        },
        errorLog: errors
      });
      
      addLog(`[Error] ${company.name} failed: ${String(error).substring(0, 100)}`);
    }
    
    // Rate limiting: Add delay between companies to avoid overwhelming APIs
    // Skip delay for the last company
    if (idx < companiesToProcess.length - 1) {
      const rateLimitDelay = 2000; // 2 seconds between companies
      addLog(`[Rate Limit] Waiting ${rateLimitDelay}ms before next company...`);
      await delay(rateLimitDelay);
    }
  }

  // Update final progress after all companies are processed
  const finalStatus = completedCompanies.length > 0 ? 'Processing complete' : 'All companies failed';
  addLog(`[Complete] Processed ${completedCompanies.length} companies successfully, ${failedCompanies.length} failed`);
  
  await updateScrapingJob(jobId, {
    progressData: {
      currentCompany: '',
      completedCompanies,
      failedCompanies,
      totalCompanies,
      currentStep: finalStatus,
      companyDetails: [...companyDetails],
      isTestMode: testMode,
      logs: [...logs]
    }
  });

  // Generate output Excel if we have data
  let outputBuffer: Buffer | undefined;
  if (allCompanyData.length > 0) {
    try {
      outputBuffer = await generateOutputExcel(allCompanyData);
    } catch (excelError) {
      console.error('Error generating Excel:', excelError);
      errors.push({
        company: 'Excel Generation',
        error: String(excelError),
        timestamp: Date.now()
      });
    }
  }

  return {
    success: completedCompanies.length > 0,
    outputBuffer,
    errors,
    extractedData: allCompanyData
  };
}

/**
 * Check if quarterly data has valid financial values
 */
function hasValidData(data: QuarterlyData[]): boolean {
  if (data.length === 0) return false;

  for (const quarter of data) {
    const indicators = quarter.indicators;
    if (!indicators) continue;

    // Check if we have at least some key financial metrics
    // Support multiple naming conventions
    const revenueKeys = ['Net Sales / Income from Operations', 'Revenue', 'Net Sales', 'Sales', 'Income'];
    const profitKeys = ['Net Profit / (Loss) for the Period', 'Net Profit', 'Profit', 'PAT', 'Net_Profit'];

    const hasRevenue = revenueKeys.some(key => {
      const val = indicators[key];
      return val !== undefined && val !== '--' && val !== null;
    });

    const hasProfit = profitKeys.some(key => {
      const val = indicators[key];
      return val !== undefined && val !== '--' && val !== null;
    });

    if (hasRevenue || hasProfit) return true;
  }

  return false;
}
