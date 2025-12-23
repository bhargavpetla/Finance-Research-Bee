
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

interface Step4PreviewProps {
    jobStatus: any;
    onDownload: () => void;
    onReset: () => void;
}

export function Step4Preview({ jobStatus, onDownload, onReset }: Step4PreviewProps) {
    const extractedData = jobStatus?.extractedData || [];
    const [selectedYear, setSelectedYear] = useState<string>("All Years");
    const [selectedQuarter, setSelectedQuarter] = useState<string>("All Quarters");

    // Get unique years from data
    const availableYears = Array.from(new Set(
        extractedData.flatMap((c: any) => c.quarters.map((q: any) => {
            // Extract year from period (e.g., "Q2'26" -> 2026)
            const match = q.period.match(/'(\d{2})/);
            return match ? `20${match[1]}` : null;
        })).filter(Boolean)
    )).sort().reverse() as string[];

    // Filter data based on selection
    const filteredData = extractedData.map((company: any) => {
        const filteredQuarters = company.quarters.filter((q: any) => {
            const match = q.period.match(/'(\d{2})/);
            const year = match ? `20${match[1]}` : "";

            const yearMatch = selectedYear === "All Years" || year === selectedYear;
            const quarterMatch = selectedQuarter === "All Quarters" || q.period.startsWith(selectedQuarter);

            return yearMatch && quarterMatch;
        });
        return { ...company, quarters: filteredQuarters };
    });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-primary">Data Preview</h2>
                    <p className="text-muted-foreground">
                        Review the extracted financial data before downloading.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onReset}>
                        Start Over
                    </Button>
                    <Button onClick={onDownload} className="gap-2 bg-green-600 hover:bg-green-700">
                        <Download className="w-4 h-4" />
                        Download Excel
                    </Button>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg flex gap-4 items-center">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Year</span>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[120px] bg-white dark:bg-gray-800">
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All Years">All Years</SelectItem>
                            {availableYears.map(year => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Quarter</span>
                    <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                        <SelectTrigger className="w-[140px] bg-white dark:bg-gray-800">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All Quarters">All Quarters</SelectItem>
                            <SelectItem value="Q1">Q1</SelectItem>
                            <SelectItem value="Q2">Q2</SelectItem>
                            <SelectItem value="Q3">Q3</SelectItem>
                            <SelectItem value="Q4">Q4</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-8">
                {filteredData.map((company: any) => (
                    <div key={company.companyName} className="space-y-4">
                        <h3 className="text-xl font-bold">{company.companyName}</h3>
                        <p className="text-sm text-muted-foreground">{company.companyName} Financial Data</p>

                        <ScrollArea className="w-full rounded-md border">
                            <div className="min-w-[800px]">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-900">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium sticky left-0 bg-gray-50 dark:bg-gray-900 z-10">Metric</th>
                                            {company.quarters.map((q: any) => (
                                                <th key={q.period} className="px-4 py-3 text-right font-medium whitespace-nowrap">{q.period}</th>
                                            ))}
                                            <th className="px-4 py-3 text-center font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {[
                                            { label: 'Revenue', key: 'Revenue', format: 'currency' },
                                            { label: 'Op. EBITDA%', key: 'Op. EBITDA%', format: 'percent' },
                                            { label: 'Op. PBT', key: 'Op. PBT', format: 'currency' },
                                            { label: 'PBT', key: 'PBT', format: 'currency' },
                                            { label: 'Op. EBIT%', key: 'Op. EBIT%', format: 'percent' },
                                        ].map((metric) => (
                                            <tr key={metric.label} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                                                <td className="px-4 py-3 font-medium sticky left-0 bg-white dark:bg-gray-950 z-10">{metric.label}</td>
                                                {company.quarters.map((q: any) => {
                                                    const val = q.calculatedMetrics[metric.key] ?? q.rawData[metric.key];
                                                    let displayVal = val;
                                                    if (typeof val === 'number') {
                                                        if (metric.format === 'currency') displayVal = `₹ ${val.toLocaleString()}`;
                                                        if (metric.format === 'percent') displayVal = `${val.toFixed(2)}%`;
                                                    }
                                                    return (
                                                        <td key={q.period} className="px-4 py-3 text-right whitespace-nowrap">
                                                            {displayVal ?? '--'}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                        High
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                ))}
            </div>
        </div>
    );
}
