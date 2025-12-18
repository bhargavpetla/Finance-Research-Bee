import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Scraping jobs table - tracks each Excel processing request
 */
export const scrapingJobs = mysqlTable("scraping_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  inputFileUrl: text("inputFileUrl").notNull(),
  inputFileKey: varchar("inputFileKey", { length: 512 }).notNull(),
  outputFileUrl: text("outputFileUrl"),
  outputFileKey: varchar("outputFileKey", { length: 512 }),
  selectedQuarters: json("selectedQuarters").$type<string[]>(), // e.g., ["Q1", "Q2"]
  selectedFiscalYears: json("selectedFiscalYears").$type<number[]>(), // e.g., [2024, 2025]
  extractedData: json("extractedData").$type<Array<{
    companyName: string;
    dataSource: 'screener' | 'moneycontrol' | 'perplexity' | 'perplexity-url';
    quarters: Array<{
      quarter: string;
      period: string;
      rawData: Record<string, number | string>;
      calculatedMetrics: any;
    }>;
  }>>(), // Stores the extracted data for preview
  progressData: json("progressData").$type<{
    currentCompany?: string;
    completedCompanies?: string[];
    failedCompanies?: string[];
    totalCompanies?: number;
    currentStep?: string;
    companyDetails?: Array<{
      company: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      stage?: string;
      dataSource?: 'screener' | 'moneycontrol' | 'perplexity' | 'perplexity-url';
      estimatedTime?: number;
      progress?: number;
      liveData?: any;
      reasoning?: string;
      switchedSource?: boolean;
      fallbackStep?: number;
    }>;
    isTestMode?: boolean;
    testCompanyCompleted?: boolean;
  }>(),
  errorLog: json("errorLog").$type<Array<{
    company: string;
    error: string;
    timestamp: number;
  }>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type ScrapingJob = typeof scrapingJobs.$inferSelect;
export type InsertScrapingJob = typeof scrapingJobs.$inferInsert;

/**
 * Financial data cache - stores scraped data to avoid re-scraping
 */
export const financialDataCache = mysqlTable("financial_data_cache", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 100 }).notNull(),
  quarter: varchar("quarter", { length: 20 }).notNull(), // e.g., "Q1 FY2026"
  dataSource: mysqlEnum("dataSource", ["screener", "moneycontrol", "perplexity", "perplexity-url"]).notNull(),
  rawData: json("rawData").$type<Record<string, number | string>>().notNull(),
  calculatedMetrics: json("calculatedMetrics").$type<Record<string, number>>(),
  validationFlags: json("validationFlags").$type<Array<{
    metric: string;
    issue: string;
    severity: "warning" | "error";
  }>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinancialDataCache = typeof financialDataCache.$inferSelect;
export type InsertFinancialDataCache = typeof financialDataCache.$inferInsert;
