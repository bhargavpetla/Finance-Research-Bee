import axios from 'axios';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * Normalize metric names from various Perplexity response formats
 */
function normalizeMetricName(key: string): string {
  const mappings: Record<string, string> = {
    // Net Profit variations
    'net_profit_crores': 'Net Profit / (Loss) for the Period',
    'net_profit': 'Net Profit / (Loss) for the Period',
    'netprofit': 'Net Profit / (Loss) for the Period',
    'profit': 'Net Profit / (Loss) for the Period',
    'pat': 'Net Profit / (Loss) for the Period',
    
    // Revenue variations
    'revenue': 'Net Sales / Income from Operations',
    'revenue_crores': 'Net Sales / Income from Operations',
    'net_sales': 'Net Sales / Income from Operations',
    'sales': 'Net Sales / Income from Operations',
    'income': 'Net Sales / Income from Operations',
    'total_income': 'Total Income From Operations',
    
    // Operating Profit variations
    'operating_profit': 'P/L Before Other Inc., Int., Excpt. Items & Tax',
    'operatingprofit': 'P/L Before Other Inc., Int., Excpt. Items & Tax',
    'ebit': 'P/L Before Interest, Excpt. Items & Tax',
    'op_ebit': 'P/L Before Interest, Excpt. Items & Tax',
    
    // PBT variations
    'pbt': 'P/L Before Tax',
    'profit_before_tax': 'P/L Before Tax',
    'profitbeforetax': 'P/L Before Tax',
    
    // Other metrics
    'tax': 'Tax',
    'depreciation': 'Depreciation',
    'employees_cost': 'Employees Cost',
    'employee_cost': 'Employees Cost',
    'employeecost': 'Employees Cost',
    'other_expenses': 'Other Expenses',
    'other_income': 'Other Income',
    'interest': 'Interest',
  };
  
  const lowerKey = key.toLowerCase().replace(/[\s-]/g, '_');
  return mappings[lowerKey] || key;
}

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityRequest {
  model?: string;
  messages: PerplexityMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call Perplexity API for financial data extraction
 */
export async function callPerplexity(request: PerplexityRequest): Promise<PerplexityResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not configured');
  }

  try {
    console.log(`[Perplexity] Calling API with model: ${request.model || 'sonar-pro'}`);
    const response = await axios.post<PerplexityResponse>(
      PERPLEXITY_API_URL,
      {
        model: request.model || 'sonar-pro',
        messages: request.messages,
        temperature: request.temperature ?? 0,
        max_tokens: request.max_tokens || 4000,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 90000, // 90 second timeout for complex queries
      }
    );

    console.log(`[Perplexity] API response received, tokens used: ${response.data.usage?.total_tokens || 'unknown'}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`[Perplexity] API error:`, error.response?.data || error.message);
      throw new Error(`Perplexity API error: ${error.response?.data?.error?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Ask Perplexity for the correct MoneyControl URL for a company
 */
export async function getMoneyControlUrlFromPerplexity(companyName: string): Promise<string | null> {
  console.log(`[Perplexity] Looking up MoneyControl URL for: ${companyName}`);
  
  const response = await callPerplexity({
    messages: [
      { 
        role: 'system', 
        content: 'You are a financial data expert. Return ONLY the exact MoneyControl quarterly results URL for the requested company. No explanation, just the URL.' 
      },
      { 
        role: 'user', 
        content: `What is the exact MoneyControl quarterly results page URL for ${companyName} (Indian listed company)? Return ONLY the URL in format: https://www.moneycontrol.com/financials/[company-name]/results/quarterly-results/[code]` 
      }
    ],
    temperature: 0,
    max_tokens: 200,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return null;

  // Extract URL from response
  const urlMatch = content.match(/https:\/\/www\.moneycontrol\.com\/[^\s"'<>]+/);
  console.log(`[Perplexity] Found URL: ${urlMatch ? urlMatch[0] : 'none'}`);
  return urlMatch ? urlMatch[0] : null;
}

/**
 * Convert calendar quarter to Indian fiscal quarter format
 * Indian Fiscal Year: Apr-Mar
 * Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
 */
function convertToFiscalQuarter(period: string): string {
  // Handle formats like "Jul-Sep 2024", "Sep 2024", "Q2 2024", etc.
  const monthMap: { [key: string]: { quarter: string; fyOffset: number } } = {
    'jan': { quarter: 'Q4', fyOffset: 0 },
    'feb': { quarter: 'Q4', fyOffset: 0 },
    'mar': { quarter: 'Q4', fyOffset: 0 },
    'apr': { quarter: 'Q1', fyOffset: 1 },
    'may': { quarter: 'Q1', fyOffset: 1 },
    'jun': { quarter: 'Q1', fyOffset: 1 },
    'jul': { quarter: 'Q2', fyOffset: 1 },
    'aug': { quarter: 'Q2', fyOffset: 1 },
    'sep': { quarter: 'Q2', fyOffset: 1 },
    'oct': { quarter: 'Q3', fyOffset: 1 },
    'nov': { quarter: 'Q3', fyOffset: 1 },
    'dec': { quarter: 'Q3', fyOffset: 1 },
  };

  // Try to extract month and year
  const periodLower = period.toLowerCase();
  const yearMatch = period.match(/20(\d{2})/);
  const year = yearMatch ? parseInt('20' + yearMatch[1]) : new Date().getFullYear();

  for (const [month, info] of Object.entries(monthMap)) {
    if (periodLower.includes(month)) {
      const fiscalYear = year + info.fyOffset;
      const shortYear = fiscalYear.toString().slice(-2);
      return `${info.quarter}'${shortYear}`;
    }
  }

  // If already in fiscal format, return as-is
  if (/Q[1-4]'?\d{2}/i.test(period)) {
    return period.replace(/FY/i, '').replace(/\s+/g, '');
  }

  return period;
}

/**
 * Extract quarterly financial data for a company using Perplexity
 * This is the PRIMARY data source since MoneyControl requires JavaScript rendering
 */
export async function extractFinancialDataWithPerplexity(
  companyName: string,
  numberOfQuarters: number = 8,
  selectedQuarters?: string[],
  selectedFiscalYears?: number[]
): Promise<any> {
  // Build specific quarter list if provided, filtering out future quarters
  let quartersList = '';
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();
  
  // Determine current fiscal quarter (Indian FY: Apr-Mar)
  // Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
  let currentFY: number;
  let currentFQ: number;
  if (currentMonth >= 4) {
    currentFY = currentYear + 1; // Apr 2025 onwards = FY2026
    if (currentMonth <= 6) currentFQ = 1;
    else if (currentMonth <= 9) currentFQ = 2;
    else currentFQ = 3;
  } else {
    currentFY = currentYear; // Jan-Mar 2025 = FY2025 Q4
    currentFQ = 4;
  }
  
  console.log(`[Perplexity] Current fiscal position: Q${currentFQ}'${currentFY.toString().slice(-2)} (${currentMonth}/${currentYear})`);
  
  if (selectedQuarters && selectedFiscalYears) {
    const quarters: string[] = [];
    for (const fy of selectedFiscalYears.sort((a, b) => b - a)) {
      const shortYear = fy.toString().slice(-2);
      for (const q of selectedQuarters) {
        const qNum = parseInt(q.replace('Q', ''));
        // Filter out future quarters
        if (fy > currentFY || (fy === currentFY && qNum > currentFQ)) {
          console.log(`[Perplexity] Skipping future quarter: ${q}'${shortYear}`);
          continue;
        }
        quarters.push(`${q}'${shortYear}`);
      }
    }
    quartersList = quarters.join(', ');
    console.log(`[Perplexity] Extracting specific quarters: ${quartersList} for: ${companyName}`);
  } else {
    console.log(`[Perplexity] Extracting ${numberOfQuarters} quarters of data for: ${companyName}`);
  }

  const systemPrompt = `You are a financial data extraction expert. Extract quarterly financial data from MoneyControl and Screener.in for Indian IT companies.

IMPORTANT: Return data for MULTIPLE quarters, not just the latest one.

FISCAL YEAR: India uses April-March fiscal year.
- Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar

RETURN: JSON only, no markdown.`;

  // Build user prompt with specific quarters if provided
  const quartersInstruction = quartersList 
    ? `Extract data for these SPECIFIC fiscal quarters: ${quartersList}` 
    : `Extract the latest ${numberOfQuarters} quarters`;

  const userPrompt = `Search for "${companyName} quarterly results FY2025 FY2026" on MoneyControl and Screener.in.

I need historical quarterly financial data for ${companyName}.

Find data for THESE SPECIFIC quarters:
1. Q2 FY26 (Jul-Sep 2025) - format as "Q2'26"
2. Q1 FY26 (Apr-Jun 2025) - format as "Q1'26"  
3. Q4 FY25 (Jan-Mar 2025) - format as "Q4'25"
4. Q3 FY25 (Oct-Dec 2024) - format as "Q3'25"
5. Q2 FY25 (Jul-Sep 2024) - format as "Q2'25"
6. Q1 FY25 (Apr-Jun 2024) - format as "Q1'25"

For each quarter, extract:
- Revenue (in ₹ Crores)
- Operating Profit (in ₹ Crores)
- Net Profit (in ₹ Crores)

Return JSON with ALL quarters you can find:
{
  "company": "${companyName}",
  "quarters": [
    { "quarter": "Q2'26", "data": { "Revenue": 65799, "Operating Profit": 16565, "Net Profit": 12075 } },
    { "quarter": "Q1'26", "data": { "Revenue": 62000, "Operating Profit": 15000, "Net Profit": 11500 } },
    { "quarter": "Q4'25", "data": { "Revenue": 61000, "Operating Profit": 14500, "Net Profit": 11000 } },
    { "quarter": "Q3'25", "data": { "Revenue": 60000, "Operating Profit": 14000, "Net Profit": 10500 } },
    { "quarter": "Q2'25", "data": { "Revenue": 59000, "Operating Profit": 13500, "Net Profit": 10000 } },
    { "quarter": "Q1'25", "data": { "Revenue": 58000, "Operating Profit": 13000, "Net Profit": 9500 } }
  ]
}

IMPORTANT: Include ALL 5-6 quarters with actual data from the sources.`;

  const response = await callPerplexity({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0,
    max_tokens: 8000, // Increased for multi-quarter requests
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from Perplexity API');
  }

  console.log(`[Perplexity] Received response for ${companyName}, parsing JSON...`);

  // Extract JSON from markdown code blocks if present
  let jsonString = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonString = jsonMatch[1];
  } else {
    // Try to find JSON object directly
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonString = objectMatch[0];
    }
  }

  try {
    // Try to repair truncated JSON if needed
    let repairedJson = jsonString;
    try {
      JSON.parse(repairedJson);
    } catch (parseError) {
      // Try to repair truncated JSON by closing brackets
      console.log('[Perplexity] Attempting to repair truncated JSON...');
      
      // Count open brackets and close them
      const openBraces = (repairedJson.match(/\{/g) || []).length;
      const closeBraces = (repairedJson.match(/\}/g) || []).length;
      const openBrackets = (repairedJson.match(/\[/g) || []).length;
      const closeBrackets = (repairedJson.match(/\]/g) || []).length;
      
      // Remove trailing incomplete data
      repairedJson = repairedJson.replace(/,\s*$/, ''); // Remove trailing comma
      repairedJson = repairedJson.replace(/,\s*"[^"]*"?\s*$/, ''); // Remove incomplete key
      repairedJson = repairedJson.replace(/,\s*\{[^}]*$/, ''); // Remove incomplete object
      
      // Close missing brackets
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        repairedJson += ']';
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        repairedJson += '}';
      }
      
      console.log('[Perplexity] JSON repair attempted');
    }
    
    const parsedData = JSON.parse(repairedJson);
    
    // Validate and normalize the data
    if (!parsedData.quarters || !Array.isArray(parsedData.quarters)) {
      throw new Error('Invalid response structure - missing quarters array');
    }

    // Convert quarter labels to fiscal format and normalize data structure
    parsedData.quarters = parsedData.quarters.map((q: any) => {
      // Handle different response formats from Perplexity
      const quarterName = q.quarter || q.quarter_name || q.period || '';
      
      // Build data object from various possible formats
      let data: Record<string, number | null> = {};
      
      if (q.data) {
        // Standard format with data object
        data = q.data;
      } else if (q.indicators) {
        // Alternative format with indicators
        data = q.indicators;
      } else {
        // Flat format - extract all numeric fields
        for (const [key, value] of Object.entries(q)) {
          if (key !== 'quarter' && key !== 'quarter_name' && key !== 'period') {
            // Map common field names to standard names
            const normalizedKey = normalizeMetricName(key);
            if (typeof value === 'number' || value === null) {
              data[normalizedKey] = value as number | null;
            }
          }
        }
      }
      
      return {
        quarter: convertToFiscalQuarter(quarterName),
        period: quarterName,
        data
      };
    });

    console.log(`[Perplexity] Successfully parsed ${parsedData.quarters.length} quarters for ${companyName}`);
    
    // Include the full response as reasoning/chain of thought
    return {
      ...parsedData,
      reasoning: content // Include full Perplexity response for transparency
    };
  } catch (error) {
    console.error(`[Perplexity] JSON parsing error:`, error);
    console.error(`[Perplexity] Raw content:`, content.substring(0, 500));
    throw new Error(`Invalid JSON in Perplexity response: ${error}`);
  }
}

/**
 * Extract specific financial metrics for a company
 * Used for targeted data extraction when full quarterly data is not needed
 */
export async function extractSpecificMetrics(
  companyName: string,
  metrics: string[],
  quarters: string[]
): Promise<any> {
  console.log(`[Perplexity] Extracting specific metrics for ${companyName}: ${metrics.join(', ')}`);

  const systemPrompt = `You are a financial data expert. Extract ONLY the requested metrics from MoneyControl quarterly results for Indian listed companies. Return exact values in ₹ Crores.`;

  const userPrompt = `For ${companyName}, extract these metrics: ${metrics.join(', ')}
For these quarters: ${quarters.join(', ')}

Return JSON:
{
  "company": "${companyName}",
  "data": {
    "Q2'26": { "metric1": value, "metric2": value },
    "Q1'26": { "metric1": value, "metric2": value }
  }
}

Use null for unavailable data. All values in ₹ Crores.`;

  const response = await callPerplexity({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from Perplexity API');
  }

  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON from Perplexity response');
  }

  return JSON.parse(jsonMatch[1]);
}
