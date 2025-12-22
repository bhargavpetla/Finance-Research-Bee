import { describe, expect, it } from "vitest";
import { calculateDerivedMetrics, validateRequiredMetrics, RawFinancialData } from "./calculator";

describe("Financial Calculator", () => {
  it("should calculate Contribution correctly", () => {
    const rawData: RawFinancialData = {
      'Total Income From Operations': 22697,
      'Purchase of Traded Goods': 105,
      'Increase / Decrease in Stocks': -17,
      'Employees Cost': 13616,
      'Depreciation': 691,
      'Other Expenses': 4620
    };

    const { calculated } = calculateDerivedMetrics(rawData);

    // Contribution = Total Income - Purchase - Stock Change
    // 22697 - 105 - (-17) = 22609
    expect(calculated.Contribution).toBe(22609);
  });

  it("should calculate Op. EBITDA correctly", () => {
    const rawData: RawFinancialData = {
      'Total Income From Operations': 22697,
      'Purchase of Traded Goods': 105,
      'Increase / Decrease in Stocks': -17,
      'Employees Cost': 13616,
      'Depreciation': 691,
      'Other Expenses': 4620
    };

    const { calculated } = calculateDerivedMetrics(rawData);

    // Contribution = 22609
    // Op. EBITDA = Contribution - Employees Cost - Other Expenses
    // 22609 - 13616 - 4620 = 4373
    expect(calculated['Op. EBITDA']).toBe(4373);
  });

  it("should calculate Op. EBIT correctly", () => {
    const rawData: RawFinancialData = {
      'Total Income From Operations': 22697,
      'Purchase of Traded Goods': 105,
      'Increase / Decrease in Stocks': -17,
      'Employees Cost': 13616,
      'Depreciation': 691,
      'Other Expenses': 4620
    };

    const { calculated } = calculateDerivedMetrics(rawData);

    // Op. EBIT = Op. EBITDA - Depreciation
    // 4373 - 691 = 3682
    expect(calculated['Op. EBIT']).toBe(3682);
  });

  it("should calculate Op. PBT correctly", () => {
    const rawData: RawFinancialData = {
      'Total Income From Operations': 22697,
      'Purchase of Traded Goods': 105,
      'Increase / Decrease in Stocks': -17,
      'Employees Cost': 13616,
      'Depreciation': 691,
      'Other Expenses': 4620,
      'Interest': 50
    };

    const { calculated } = calculateDerivedMetrics(rawData);

    // Op. PBT = Op. EBIT - Interest
    // 3682 - 50 = 3632
    expect(calculated['Op. PBT']).toBe(3632);
  });

  it("should calculate PBT correctly", () => {
    const rawData: RawFinancialData = {
      'Total Income From Operations': 22697,
      'Purchase of Traded Goods': 105,
      'Increase / Decrease in Stocks': -17,
      'Employees Cost': 13616,
      'Depreciation': 691,
      'Other Expenses': 4620,
      'Interest': 50,
      'Other Income': 947
    };

    const { calculated } = calculateDerivedMetrics(rawData);

    // PBT = Op. PBT + Other Income
    // 3632 + 947 = 4579
    expect(calculated.PBT).toBe(4579);
  });

  it("should handle missing values correctly", () => {
    const rawData: RawFinancialData = {
      'Total Income From Operations': 22697,
      'Employees Cost': 13616,
      'Other Expenses': 4620
    };

    const { calculated, issues } = calculateDerivedMetrics(rawData);

    // Should still calculate with missing optional values treated as 0
    expect(calculated.Contribution).toBe(22697); // No purchase or stock change
    expect(calculated['Op. EBITDA']).toBe(4461); // 22697 - 13616 - 4620
  });

  it("should flag validation issues for missing required fields", () => {
    const rawData: RawFinancialData = {
      'Total Income From Operations': 22697
    };

    const issues = validateRequiredMetrics(rawData);

    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(i => i.metric === 'Employees Cost')).toBe(true);
    expect(issues.some(i => i.metric === 'Depreciation')).toBe(true);
  });

  it("should handle NA values correctly", () => {
    const rawData: RawFinancialData = {
      'Total Income From Operations': 22697,
      'Purchase of Traded Goods': '--',
      'Increase / Decrease in Stocks': '--',
      'Employees Cost': 13616,
      'Depreciation': 691,
      'Other Expenses': 4620
    };

    const { calculated } = calculateDerivedMetrics(rawData);

    // Should treat -- as 0
    expect(calculated.Contribution).toBe(22697);
  });
});
