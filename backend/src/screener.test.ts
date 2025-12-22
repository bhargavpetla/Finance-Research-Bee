import { describe, it, expect } from 'vitest';
import { scrapeScreener, getScreenerUrl, isCompanySupported, getSupportedCompanies } from './screenerScraper';

describe('Screener.in Scraper', () => {
  describe('URL Generation', () => {
    it('should generate correct URL for Wipro', () => {
      const url = getScreenerUrl('Wipro');
      expect(url).toBe('https://www.screener.in/company/WIPRO/consolidated/');
    });

    it('should generate correct URL for TCS', () => {
      const url = getScreenerUrl('TCS');
      expect(url).toBe('https://www.screener.in/company/TCS/consolidated/');
    });

    it('should return null for unknown company', () => {
      const url = getScreenerUrl('Unknown Company');
      expect(url).toBeNull();
    });
  });

  describe('Company Support', () => {
    it('should support all 13 IT companies', () => {
      const companies = getSupportedCompanies();
      expect(companies.length).toBe(13);
      expect(companies).toContain('TCS');
      expect(companies).toContain('Wipro');
      expect(companies).toContain('Infosys');
    });

    it('should correctly identify supported companies', () => {
      expect(isCompanySupported('TCS')).toBe(true);
      expect(isCompanySupported('Wipro')).toBe(true);
      expect(isCompanySupported('Unknown')).toBe(false);
    });
  });

  describe('Data Extraction', () => {
    it('should extract quarterly data for Wipro', async () => {
      const result = await scrapeScreener('Wipro');
      
      console.log(`[Test] Scraped ${result.quarters.length} quarters for ${result.companyName}`);
      
      expect(result.companyName).toBe('Wipro');
      expect(result.symbol).toBe('WIPRO');
      expect(result.dataSource).toBe('screener');
      expect(result.quarters.length).toBeGreaterThan(0);
      
      if (result.quarters.length > 0) {
        const firstQuarter = result.quarters[0];
        console.log(`[Test] First quarter: ${firstQuarter.quarter}`);
        console.log(`[Test] Raw data keys: ${Object.keys(firstQuarter.rawData).join(', ')}`);
        console.log(`[Test] Sample data:`, firstQuarter.rawData);
        
        // Check that we have key metrics
        expect(firstQuarter.quarter).toMatch(/Q\d'\d{2}/);
        expect(Object.keys(firstQuarter.rawData).length).toBeGreaterThan(0);
      }
    }, 30000);

    it('should extract quarterly data for TCS', async () => {
      const result = await scrapeScreener('TCS');
      
      console.log(`[Test] Scraped ${result.quarters.length} quarters for ${result.companyName}`);
      
      expect(result.companyName).toBe('TCS');
      expect(result.symbol).toBe('TCS');
      expect(result.quarters.length).toBeGreaterThan(0);
      
      if (result.quarters.length > 0) {
        const firstQuarter = result.quarters[0];
        console.log(`[Test] TCS First quarter: ${firstQuarter.quarter}`);
        console.log(`[Test] TCS Raw data:`, firstQuarter.rawData);
      }
    }, 30000);

    it('should return error for unknown company', async () => {
      const result = await scrapeScreener('Unknown Company');
      
      expect(result.quarters.length).toBe(0);
      expect(result.error).toBeDefined();
    });
  });
});
