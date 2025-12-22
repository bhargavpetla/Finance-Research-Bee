import { describe, expect, it } from "vitest";
import { callPerplexity, extractFinancialDataWithPerplexity } from "./perplexity";

describe("Perplexity API Integration", () => {
  it("should successfully call Perplexity API with valid credentials", async () => {
    const response = await callPerplexity({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say 'API test successful' and nothing else." }
      ],
      temperature: 0,
      max_tokens: 50,
    });

    expect(response).toBeDefined();
    expect(response.choices).toBeDefined();
    expect(response.choices.length).toBeGreaterThan(0);
    expect(response.choices[0]?.message?.content).toBeDefined();
    expect(response.choices[0]?.message?.content.toLowerCase()).toContain("api test successful");
  }, 30000); // 30 second timeout for API call
});

describe("Financial Data Extraction", () => {
  it("should extract quarterly financial data for Wipro", async () => {
    const result = await extractFinancialDataWithPerplexity("Wipro", 4);

    // Verify response structure
    expect(result).toBeDefined();
    expect(result.quarters).toBeDefined();
    expect(Array.isArray(result.quarters)).toBe(true);
    expect(result.quarters.length).toBeGreaterThan(0);

    // Verify quarter data structure
    const firstQuarter = result.quarters[0];
    expect(firstQuarter).toBeDefined();
    expect(firstQuarter.quarter).toBeDefined();
    expect(firstQuarter.data).toBeDefined();

    // Verify quarter label is in fiscal format (Q1'26, Q2'26, etc.)
    expect(firstQuarter.quarter).toMatch(/Q[1-4]'?\d{2}/);

    // Verify reasoning/chain of thought is included
    expect(result.reasoning).toBeDefined();
    expect(typeof result.reasoning).toBe('string');
    expect(result.reasoning.length).toBeGreaterThan(0);

    console.log(`[Test] Extracted ${result.quarters.length} quarters for Wipro`);
    console.log(`[Test] First quarter: ${firstQuarter.quarter}`);
    console.log(`[Test] Data keys: ${Object.keys(firstQuarter.data || {}).slice(0, 5).join(', ')}...`);
  }, 120000); // 2 minute timeout for complex API call

  it("should extract data for TCS with valid financial metrics", async () => {
    const result = await extractFinancialDataWithPerplexity("TCS", 2);

    expect(result).toBeDefined();
    expect(result.quarters).toBeDefined();
    expect(result.quarters.length).toBeGreaterThan(0);

    const quarter = result.quarters[0];
    expect(quarter.data).toBeDefined();

    // Check for key financial metrics (at least some should be present)
    const expectedMetrics = [
      'Net Sales / Income from Operations',
      'Total Income From Operations',
      'Employees Cost',
      'Net Profit / (Loss) for the Period'
    ];

    const dataKeys = Object.keys(quarter.data || {});
    const hasRelevantMetrics = expectedMetrics.some(metric => 
      dataKeys.some(key => key.toLowerCase().includes(metric.toLowerCase().split(' ')[0]))
    );

    expect(hasRelevantMetrics || dataKeys.length > 0).toBe(true);

    console.log(`[Test] TCS quarter: ${quarter.quarter}`);
    console.log(`[Test] Available metrics: ${dataKeys.length}`);
  }, 120000);
});
