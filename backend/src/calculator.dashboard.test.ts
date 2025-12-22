import { describe, expect, it } from "vitest";
import { calculateDerivedMetrics, RawFinancialData } from "./calculator";

describe("Dashboard Metrics Calculation", () => {
  it("calculates Revenue from Net Sales", () => {
    const rawData: RawFinancialData = {
      'Net Sales / Income from Operations': 1000,
      'Total Income From Operations': 1050,
      'Employees Cost': 300,
      'Other Expenses': 200,
      'Depreciation': 50,
    };

    const { calculated } = calculateDerivedMetrics(rawData);
    
    expect(calculated.Revenue).toBe(1000);
  });

  it("falls back to Total Income when Net Sales not available", () => {
    const rawData: RawFinancialData = {
      'Total Income From Operations': 1050,
      'Employees Cost': 300,
      'Other Expenses': 200,
      'Depreciation': 50,
    };

    const { calculated } = calculateDerivedMetrics(rawData);
    
    expect(calculated.Revenue).toBe(1050);
  });

  it("calculates Op. EBITDA% correctly", () => {
    const rawData: RawFinancialData = {
      'Net Sales / Income from Operations': 1000,
      'Total Income From Operations': 1000,
      'Employees Cost': 300,
      'Other Expenses': 200,
      'Depreciation': 50,
    };

    const { calculated } = calculateDerivedMetrics(rawData);
    
    // Contribution = 1000 - 0 - 0 = 1000
    // Op. EBITDA = 1000 - 300 - 200 = 500
    // Op. EBITDA% = (500 / 1000) * 100 = 50%
    expect(calculated['Op. EBITDA']).toBe(500);
    expect(calculated['Op. EBITDA%']).toBe(50);
  });

  it("calculates Op. EBIT% correctly", () => {
    const rawData: RawFinancialData = {
      'Net Sales / Income from Operations': 1000,
      'Total Income From Operations': 1000,
      'Employees Cost': 300,
      'Other Expenses': 200,
      'Depreciation': 50,
    };

    const { calculated } = calculateDerivedMetrics(rawData);
    
    // Op. EBIT = 500 - 50 = 450
    // Op. EBIT% = (450 / 1000) * 100 = 45%
    expect(calculated['Op. EBIT']).toBe(450);
    expect(calculated['Op. EBIT%']).toBe(45);
  });

  it("calculates Op. PBT correctly", () => {
    const rawData: RawFinancialData = {
      'Net Sales / Income from Operations': 1000,
      'Total Income From Operations': 1000,
      'Employees Cost': 300,
      'Other Expenses': 200,
      'Depreciation': 50,
      'Interest': 20,
    };

    const { calculated } = calculateDerivedMetrics(rawData);
    
    // Op. PBT = Op. EBIT - Interest = 450 - 20 = 430
    expect(calculated['Op. PBT']).toBe(430);
  });

  it("calculates PBT correctly", () => {
    const rawData: RawFinancialData = {
      'Net Sales / Income from Operations': 1000,
      'Total Income From Operations': 1000,
      'Employees Cost': 300,
      'Other Expenses': 200,
      'Depreciation': 50,
      'Interest': 20,
      'Other Income': 30,
    };

    const { calculated } = calculateDerivedMetrics(rawData);
    
    // PBT = Op. PBT + Other Income = 430 + 30 = 460
    expect(calculated.PBT).toBe(460);
  });

  it("handles all dashboard metrics together", () => {
    const rawData: RawFinancialData = {
      'Net Sales / Income from Operations': 2000,
      'Total Income From Operations': 2100,
      'Purchase of Traded Goods': 100,
      'Increase / Decrease in Stocks': 50,
      'Employees Cost': 600,
      'Other Expenses': 400,
      'Depreciation': 100,
      'Interest': 50,
      'Other Income': 80,
    };

    const { calculated } = calculateDerivedMetrics(rawData);
    
    // Revenue = Net Sales = 2000
    expect(calculated.Revenue).toBe(2000);
    
    // Contribution = Total Income - Purchase - Stock = 2100 - 100 - 50 = 1950
    expect(calculated.Contribution).toBe(1950);
    
    // Op. EBITDA = Contribution - Employee - Other = 1950 - 600 - 400 = 950
    expect(calculated['Op. EBITDA']).toBe(950);
    
    // Op. EBITDA% = (950 / 2000) * 100 = 47.5%
    expect(calculated['Op. EBITDA%']).toBe(47.5);
    
    // Op. EBIT = Op. EBITDA - Depreciation = 950 - 100 = 850
    expect(calculated['Op. EBIT']).toBe(850);
    
    // Op. EBIT% = (850 / 2000) * 100 = 42.5%
    expect(calculated['Op. EBIT%']).toBe(42.5);
    
    // Op. PBT = Op. EBIT - Interest = 850 - 50 = 800
    expect(calculated['Op. PBT']).toBe(800);
    
    // PBT = Op. PBT + Other Income = 800 + 80 = 880
    expect(calculated.PBT).toBe(880);
  });
});
