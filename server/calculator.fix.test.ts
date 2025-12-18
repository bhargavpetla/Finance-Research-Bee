
import { calculateDerivedMetrics, RawFinancialData } from './calculator';

const testCases: { name: string; input: RawFinancialData }[] = [
    {
        name: 'Standard Data (Screener format)',
        input: {
            'Net Sales / Income from Operations': 1000,
            'Total Income From Operations': 1050,
            'Purchase of Traded Goods': 100,
            'Increase / Decrease in Stocks': 50,
            'Employees Cost': 200,
            'Other Expenses': 100,
            'Depreciation': 50,
            'Interest': 20,
            'Other Income': 50,
            'P/L Before Tax': 530
        }
    },
    {
        name: 'Missing Net Sales (Should fallback to Total Income)',
        input: {
            'Total Income From Operations': 1000,
            'Purchase of Traded Goods': 0,
            'Increase / Decrease in Stocks': 0,
            'Employees Cost': 200,
            'Other Expenses': 100,
            'Depreciation': 50
        }
    },
    {
        name: 'Alternative Revenue Key (Sales)',
        input: {
            'Sales': 2000,
            'Total Income From Operations': 2000,
            'Employees Cost': 500,
            'Other Expenses': 200,
            'Depreciation': 100
        }
    }
];

console.log('Running Calculator Tests...\n');

testCases.forEach(test => {
    console.log(`--- ${test.name} ---`);
    const { calculated, issues } = calculateDerivedMetrics(test.input);

    console.log('Calculated Metrics:');
    console.log(`  Revenue: ${calculated.Revenue}`);
    console.log(`  Op. EBITDA: ${calculated['Op. EBITDA']}`);
    console.log(`  Op. EBITDA%: ${calculated['Op. EBITDA%']?.toFixed(2)}%`);
    console.log(`  Op. EBIT: ${calculated['Op. EBIT']}`);
    console.log(`  Op. EBIT%: ${calculated['Op. EBIT%']?.toFixed(2)}%`);

    if (issues.length > 0) {
        console.log('Issues:', issues.map(i => i.issue));
    }
    console.log('\n');
});
