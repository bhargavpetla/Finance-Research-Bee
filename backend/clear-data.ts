import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { scrapingJobs, financialDataCache } from "./drizzle/schema";
import { sql } from "drizzle-orm";

async function clearAllData() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found in environment variables");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  try {
    console.log("Clearing scraping_jobs table...");
    await db.execute(sql`TRUNCATE TABLE scraping_jobs`);
    console.log("✓ scraping_jobs cleared");

    console.log("Clearing financial_data_cache table...");
    await db.execute(sql`TRUNCATE TABLE financial_data_cache`);
    console.log("✓ financial_data_cache cleared");

    console.log("\n✅ All data cleared successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing data:", error);
    process.exit(1);
  }
}

clearAllData();
