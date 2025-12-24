import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createScrapingJob, getScrapingJob, getUserScrapingJobs, updateScrapingJob } from "./db";
import { storagePut } from "./storage";
import { parseInputExcel } from "./excelProcessor";
import { orchestrateFinancialDataScraping } from "./scrapingOrchestrator";
import { COMPANIES } from "@shared/companies";
import { validateCompanyName, fuzzySearchCompanies } from "./companyValidator";


export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  scraper: router({
    // Get list of companies
    getCompanies: publicProcedure.query(() => {
      return COMPANIES.map(c => ({ name: c.name, url: c.moneyControlUrl }));
    }),

    // Upload file and start scraping
    uploadFile: publicProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        selectedQuarters: z.array(z.string()).default(['Q1', 'Q2', 'Q3', 'Q4']),
        selectedFiscalYears: z.array(z.number()).default([2025, 2026]),
        selectedCompanies: z.array(z.string()).optional(), // Add selectedCompanies
        testMode: z.boolean().default(true), // Start in test mode by default
        testCompany: z.string().optional() // Company to test with in test mode
      }))
      .mutation(async ({ input }) => {
        // Decode base64 file data
        const fileBuffer = Buffer.from(input.fileData, 'base64');

        // Validate Excel structure
        const validation = await parseInputExcel(fileBuffer);
        if (!validation.hasValidStructure) {
          throw new Error('Invalid Excel file structure');
        }

        // Upload to S3
        const anonymousUserId = 0; // Anonymous user
        const fileKey = `anonymous/uploads/${Date.now()}-${input.fileName}`;
        const { url: fileUrl } = await storagePut(fileKey, fileBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Determine total companies count
        let totalCompanies = COMPANIES.length;
        if (input.testMode) {
          totalCompanies = 1;
        } else if (input.selectedCompanies && input.selectedCompanies.length > 0) {
          totalCompanies = input.selectedCompanies.length;
        }

        // Create scraping job
        const jobId = await createScrapingJob({
          userId: anonymousUserId,
          status: 'pending',
          inputFileUrl: fileUrl,
          inputFileKey: fileKey,
          selectedQuarters: input.selectedQuarters,
          selectedFiscalYears: input.selectedFiscalYears,
          progressData: {
            currentCompany: '',
            completedCompanies: [],
            failedCompanies: [],
            totalCompanies: totalCompanies,
            currentStep: 'Initializing...',
            companyDetails: []
          },
          errorLog: []
        });

        // Start scraping in background (don't await)
        processScrapingJob(jobId, input.selectedQuarters, input.selectedFiscalYears, input.testMode, input.testCompany, input.selectedCompanies).catch(error => {
          console.error(`Background scraping job ${jobId} failed:`, error);
        });

        return {
          jobId,
          message: 'File uploaded successfully. Processing started.'
        };
      }),

    // Get job status
    getJobStatus: publicProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ ctx, input }) => {
        const job = await getScrapingJob(input.jobId);

        if (!job) {
          throw new Error('Job not found');
        }

        return {
          id: job.id,
          status: job.status,
          progressData: job.progressData,
          errorLog: job.errorLog,
          outputFileUrl: job.outputFileUrl,
          extractedData: job.extractedData,
          createdAt: job.createdAt,
          completedAt: job.completedAt
        };
      }),

    // Get user's scraping jobs
    getMyJobs: publicProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id || 0; // Use 0 for anonymous users
      const jobs = await getUserScrapingJobs(userId);
      return jobs.map(job => ({
        id: job.id,
        status: job.status,
        progressData: job.progressData,
        outputFileUrl: job.outputFileUrl,
        createdAt: job.createdAt,
        completedAt: job.completedAt
      }));
    }),

    // Download output file
    downloadOutput: publicProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        const job = await getScrapingJob(input.jobId);

        if (!job) {
          throw new Error('Job not found');
        }

        if (!job.outputFileUrl) {
          throw new Error('Output file not ready yet');
        }

        return {
          url: job.outputFileUrl,
          fileName: `financial_data_${job.id}.xlsx`
        };
      }),

    // Quick test scraping - no file upload required
    testScraping: publicProcedure
      .input(z.object({
        companyName: z.string(),
        quarters: z.number().default(4)
      }))
      .mutation(async ({ input }) => {
        const { extractFinancialDataWithPerplexity } = await import('./perplexity');

        console.log(`[Test Scraping] Starting test for ${input.companyName}`);

        try {
          const result = await extractFinancialDataWithPerplexity(input.companyName, input.quarters);

          return {
            success: true,
            company: input.companyName,
            quartersExtracted: result.quarters?.length || 0,
            data: result.quarters,
            reasoning: result.reasoning?.substring(0, 500) + '...' // Truncate for response
          };
        } catch (error) {
          return {
            success: false,
            company: input.companyName,
            quartersExtracted: 0,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }),

    // Start scraping without file upload (uses default template)
    startScraping: publicProcedure
      .input(z.object({
        selectedQuarters: z.array(z.string()).default(['Q1', 'Q2', 'Q3', 'Q4']),
        selectedFiscalYears: z.array(z.number()).default([2025, 2026]),
        selectedCompanies: z.array(z.string()).optional(), // Add selectedCompanies
        testMode: z.boolean().default(true),
        testCompany: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        // Determine total companies count
        let totalCompanies = COMPANIES.length;
        if (input.testMode) {
          totalCompanies = 1;
        } else if (input.selectedCompanies && input.selectedCompanies.length > 0) {
          totalCompanies = input.selectedCompanies.length;
        }

        // Create scraping job without file
        const jobId = await createScrapingJob({
          userId: 0, // Anonymous user
          status: 'pending',
          inputFileUrl: '', // No file upload required
          inputFileKey: '',
          selectedQuarters: input.selectedQuarters,
          selectedFiscalYears: input.selectedFiscalYears,
          progressData: {
            currentCompany: '',
            completedCompanies: [],
            failedCompanies: [],
            totalCompanies: totalCompanies,
            currentStep: 'Initializing...',
            companyDetails: []
          },
          errorLog: []
        });

        // Start scraping in background
        processScrapingJob(jobId, input.selectedQuarters, input.selectedFiscalYears, input.testMode, input.testCompany, input.selectedCompanies).catch(error => {
          console.error(`Background scraping job ${jobId} failed:`, error);
        });

        return {
          jobId,
          message: `Scraping started for ${input.testMode ? input.testCompany || 'TCS' : 'selected companies'}`
        };
      }),

    // Validate company name
    validateCompany: publicProcedure
      .input(z.object({ companyName: z.string() }))
      .query(async ({ input }) => {
        const result = await validateCompanyName(input.companyName);
        return result;
      }),

    // Search companies with fuzzy matching
    searchCompanies: publicProcedure
      .input(z.object({ 
        query: z.string(),
        limit: z.number().default(10).optional()
      }))
      .query(async ({ input }) => {
        const results = await fuzzySearchCompanies(input.query, input.limit || 10);
        return results;
      })
  })
});

export type AppRouter = typeof appRouter;

/**
 * Background job processor
 */
async function processScrapingJob(jobId: number, selectedQuarters: string[], selectedFiscalYears: number[], testMode: boolean = true, testCompany?: string, selectedCompanies?: string[]): Promise<void> {
  try {
    await updateScrapingJob(jobId, { status: 'processing' });

    const result = await orchestrateFinancialDataScraping(jobId, selectedQuarters, selectedFiscalYears, testMode, testCompany, selectedCompanies);

    if (result.outputBuffer) {
      // Upload output file to S3
      const outputKey = `outputs/${jobId}/financial_data_${Date.now()}.xlsx`;
      const { url: outputUrl } = await storagePut(
        outputKey,
        result.outputBuffer,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      await updateScrapingJob(jobId, {
        status: result.success ? 'completed' : 'failed',
        outputFileUrl: outputUrl,
        outputFileKey: outputKey,
        extractedData: result.extractedData,
        errorLog: result.errors,
        completedAt: new Date()
      });
    } else {
      await updateScrapingJob(jobId, {
        status: 'failed',
        errorLog: result.errors,
        completedAt: new Date()
      });
    }

  } catch (error) {
    console.error(`Job ${jobId} processing error:`, error);
    await updateScrapingJob(jobId, {
      status: 'failed',
      errorLog: [{
        company: 'System',
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      }],
      completedAt: new Date()
    });
  }
}
