import { describe, expect, it } from "vitest";
import { getIndianFiscalQuarter, parseQuarterString, getPreviousQuarters } from "../shared/fiscalQuarter";

describe("Indian Fiscal Quarter Mapping", () => {
  it("should map Apr-Jun 2025 to Q1 FY2026", () => {
    const quarter = getIndianFiscalQuarter(4, 2025); // April 2025
    expect(quarter.quarter).toBe("Q1 FY2026");
    expect(quarter.fiscalYear).toBe(2026);
    expect(quarter.quarterNumber).toBe(1);
    expect(quarter.period).toBe("Apr-Jun 2025");
  });

  it("should map Jul-Sep 2025 to Q2 FY2026", () => {
    const quarter = getIndianFiscalQuarter(7, 2025); // July 2025
    expect(quarter.quarter).toBe("Q2 FY2026");
    expect(quarter.fiscalYear).toBe(2026);
    expect(quarter.quarterNumber).toBe(2);
    expect(quarter.period).toBe("Jul-Sep 2025");
  });

  it("should map Oct-Dec 2025 to Q3 FY2026", () => {
    const quarter = getIndianFiscalQuarter(10, 2025); // October 2025
    expect(quarter.quarter).toBe("Q3 FY2026");
    expect(quarter.fiscalYear).toBe(2026);
    expect(quarter.quarterNumber).toBe(3);
    expect(quarter.period).toBe("Oct-Dec 2025");
  });

  it("should map Jan-Mar 2026 to Q4 FY2026", () => {
    const quarter = getIndianFiscalQuarter(1, 2026); // January 2026
    expect(quarter.quarter).toBe("Q4 FY2026");
    expect(quarter.fiscalYear).toBe(2026);
    expect(quarter.quarterNumber).toBe(4);
    expect(quarter.period).toBe("Jan-Mar 2026");
  });

  it("should parse 'Q1 FY2026' correctly", () => {
    const quarter = parseQuarterString("Q1 FY2026");
    expect(quarter).not.toBeNull();
    expect(quarter?.quarter).toBe("Q1 FY2026");
    expect(quarter?.fiscalYear).toBe(2026);
    expect(quarter?.quarterNumber).toBe(1);
  });

  it("should parse \"Q2'FY26\" correctly", () => {
    const quarter = parseQuarterString("Q2'FY26");
    expect(quarter).not.toBeNull();
    expect(quarter?.quarter).toBe("Q2 FY2026");
    expect(quarter?.fiscalYear).toBe(2026);
    expect(quarter?.quarterNumber).toBe(2);
  });

  it("should get previous quarters correctly", () => {
    const currentQuarter = parseQuarterString("Q1 FY2026");
    expect(currentQuarter).not.toBeNull();

    const previousQuarters = getPreviousQuarters(currentQuarter!, 3);
    expect(previousQuarters.length).toBe(3);
    expect(previousQuarters[0]?.quarter).toBe("Q4 FY2025");
    expect(previousQuarters[1]?.quarter).toBe("Q3 FY2025");
    expect(previousQuarters[2]?.quarter).toBe("Q2 FY2025");
  });

  it("should handle year transitions correctly", () => {
    const q4 = parseQuarterString("Q4 FY2025");
    const previous = getPreviousQuarters(q4!, 1);
    expect(previous[0]?.quarter).toBe("Q3 FY2025");
  });
});
