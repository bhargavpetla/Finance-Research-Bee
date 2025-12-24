import axios from 'axios';

/**
 * Normalize company name by removing common suffixes and cleaning up
 */
export function normalizeCompanyName(name: string): string {
  let normalized = name.trim();
  
  // Remove common suffixes (case-insensitive)
  const suffixes = [
    'Limited',
    'Ltd.',
    'Ltd',
    'Private Limited',
    'Pvt. Ltd.',
    'Pvt Ltd',
    'Pvt.',
    'Pvt',
    'Private',
    'Corporation',
    'Corp.',
    'Corp',
    'Incorporated',
    'Inc.',
    'Inc',
    'Company',
    'Co.',
    'Co'
  ];
  
  for (const suffix of suffixes) {
    const regex = new RegExp(`\\s+${suffix}\\s*$`, 'i');
    normalized = normalized.replace(regex, '');
  }
  
  // Clean up extra whitespace
  normalized = normalized.trim().replace(/\s+/g, ' ');
  
  return normalized;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[s2.length][s1.length];
}

/**
 * Calculate similarity score between two strings (0-1, higher is more similar)
 */
function similarityScore(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  
  const distance = levenshteinDistance(str1, str2);
  return 1.0 - distance / maxLen;
}

export interface CompanySearchResult {
  name: string;
  url: string;
  score: number;
}

/**
 * Search for companies on Screener.in with fuzzy matching
 */
export async function fuzzySearchCompanies(
  query: string,
  limit: number = 10
): Promise<CompanySearchResult[]> {
  try {
    // First try exact search
    const searchUrl = `https://www.screener.in/api/company/search/?q=${encodeURIComponent(query)}`;
    console.log(`[CompanyValidator] Searching for "${query}"...`);
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 20000, // Increased from 10s to 20s
    });

    if (!Array.isArray(response.data)) {
      console.warn(`[CompanyValidator] Invalid response format for "${query}"`);
      return [];
    }

    // Calculate similarity scores for each result
    const normalizedQuery = normalizeCompanyName(query);
    const results: CompanySearchResult[] = response.data.map((item: any) => {
      const normalizedName = normalizeCompanyName(item.name);
      const score = similarityScore(normalizedQuery, normalizedName);
      
      return {
        name: item.name,
        url: `https://www.screener.in${item.url}`,
        score,
      };
    });

    // Sort by score (highest first) and limit results
    results.sort((a, b) => b.score - a.score);
    console.log(`[CompanyValidator] Found ${results.length} results for "${query}"`);
    return results.slice(0, limit);
    
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      console.warn(`[CompanyValidator] Timeout searching for "${query}" - Screener.in API is slow`);
    } else {
      console.warn(`[CompanyValidator] Search failed for "${query}":`, error.message);
    }
    return [];
  }
}

/**
 * Validate if a company exists and suggest alternatives
 */
export async function validateCompanyName(name: string): Promise<{
  exists: boolean;
  exactMatch?: string;
  suggestions: CompanySearchResult[];
  normalizedName: string;
}> {
  console.log(`[CompanyValidator] Validating company: "${name}"`);
  
  const normalizedName = normalizeCompanyName(name);
  
  // Search for the company
  const results = await fuzzySearchCompanies(name, 5);
  
  if (results.length === 0) {
    // Try again with normalized name if original search failed
    if (normalizedName !== name) {
      const normalizedResults = await fuzzySearchCompanies(normalizedName, 5);
      return {
        exists: normalizedResults.length > 0 && normalizedResults[0].score > 0.7,
        exactMatch: normalizedResults.length > 0 && normalizedResults[0].score > 0.9 
          ? normalizedResults[0].name 
          : undefined,
        suggestions: normalizedResults,
        normalizedName,
      };
    }
    
    return {
      exists: false,
      suggestions: [],
      normalizedName,
    };
  }
  
  // Check if we have a very close match (score > 0.9 = exact match)
  const exactMatch = results[0].score > 0.9 ? results[0].name : undefined;
  
  // Consider it exists if we have a good match (score > 0.7)
  // This is more lenient to catch variations like "Reliance Industries Ltd" vs "Reliance Industries"
  const exists = results[0].score > 0.7;
  
  console.log(`[CompanyValidator] Validation result: exists=${exists}, exactMatch=${exactMatch}, topScore=${results[0].score}, suggestions=${results.length}`);
  
  return {
    exists,
    exactMatch,
    suggestions: results,
    normalizedName,
  };
}

/**
 * Search for a company with retry logic
 */
export async function searchScreenerCompanyWithRetry(
  query: string,
  maxRetries: number = 3
): Promise<{ url: string; name: string } | null> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Try exact query first
      const searchUrl = `https://www.screener.in/api/company/search/?q=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 20000, // Increased from 10s to 20s
      });

      if (Array.isArray(response.data) && response.data.length > 0) {
        const match = response.data[0];
        return {
          url: `https://www.screener.in${match.url}`,
          name: match.name,
        };
      }
      
      // If no exact match, try normalized name
      const normalizedQuery = normalizeCompanyName(query);
      if (normalizedQuery !== query) {
        const normalizedUrl = `https://www.screener.in/api/company/search/?q=${encodeURIComponent(normalizedQuery)}`;
        const normalizedResponse = await axios.get(normalizedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 20000, // Increased from 10s to 20s
        });

        if (Array.isArray(normalizedResponse.data) && normalizedResponse.data.length > 0) {
          const match = normalizedResponse.data[0];
          return {
            url: `https://www.screener.in${match.url}`,
            name: match.name,
          };
        }
      }
      
      return null;
      
    } catch (error) {
      lastError = error;
      console.warn(`[CompanyValidator] Search attempt ${attempt}/${maxRetries} failed for "${query}"`);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`[CompanyValidator] All search attempts failed for "${query}":`, lastError);
  return null;
}
