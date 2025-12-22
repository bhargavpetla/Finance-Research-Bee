import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface QuarterSelectorProps {
  selectedQuarters: string[];
  selectedFiscalYears: number[];
  onQuartersChange: (quarters: string[]) => void;
  onFiscalYearsChange: (years: number[]) => void;
  disabled?: boolean;
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const FISCAL_YEARS = [2023, 2024, 2025, 2026];

export function QuarterSelector({
  selectedQuarters,
  selectedFiscalYears,
  onQuartersChange,
  onFiscalYearsChange,
  disabled
}: QuarterSelectorProps) {
  const handleQuarterToggle = (quarter: string) => {
    if (selectedQuarters.includes(quarter)) {
      onQuartersChange(selectedQuarters.filter(q => q !== quarter));
    } else {
      onQuartersChange([...selectedQuarters, quarter]);
    }
  };

  const handleFiscalYearToggle = (year: number) => {
    if (selectedFiscalYears.includes(year)) {
      onFiscalYearsChange(selectedFiscalYears.filter(y => y !== year));
    } else {
      onFiscalYearsChange([...selectedFiscalYears, year]);
    }
  };

  const handleSelectAllQuarters = () => {
    if (selectedQuarters.length === QUARTERS.length) {
      onQuartersChange([]);
    } else {
      onQuartersChange([...QUARTERS]);
    }
  };

  const handleSelectAllYears = () => {
    if (selectedFiscalYears.length === FISCAL_YEARS.length) {
      onFiscalYearsChange([]);
    } else {
      onFiscalYearsChange([...FISCAL_YEARS]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Quarters and Fiscal Years</CardTitle>
        <CardDescription>
          Choose which quarters and fiscal years to extract data for
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quarters Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">Quarters</Label>
            <button
              type="button"
              onClick={handleSelectAllQuarters}
              disabled={disabled}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              {selectedQuarters.length === QUARTERS.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {QUARTERS.map((quarter) => (
              <div key={quarter} className="flex items-center space-x-2">
                <Checkbox
                  id={`quarter-${quarter}`}
                  checked={selectedQuarters.includes(quarter)}
                  onCheckedChange={() => handleQuarterToggle(quarter)}
                  disabled={disabled}
                />
                <Label
                  htmlFor={`quarter-${quarter}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {quarter}
                </Label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
          </p>
        </div>

        {/* Fiscal Years Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">Fiscal Years</Label>
            <button
              type="button"
              onClick={handleSelectAllYears}
              disabled={disabled}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              {selectedFiscalYears.length === FISCAL_YEARS.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {FISCAL_YEARS.map((year) => (
              <div key={year} className="flex items-center space-x-2">
                <Checkbox
                  id={`fy-${year}`}
                  checked={selectedFiscalYears.includes(year)}
                  onCheckedChange={() => handleFiscalYearToggle(year)}
                  disabled={disabled}
                />
                <Label
                  htmlFor={`fy-${year}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  FY {year}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Selection Summary */}
        {(selectedQuarters.length > 0 || selectedFiscalYears.length > 0) && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Selected: {selectedQuarters.length} quarter(s) × {selectedFiscalYears.length} fiscal year(s) = {selectedQuarters.length * selectedFiscalYears.length} data points per company
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
