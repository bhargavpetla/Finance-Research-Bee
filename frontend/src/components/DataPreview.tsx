import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, Database, Brain, Globe } from 'lucide-react';

interface QuarterData {
  quarter: string;
  period?: string;
  rawData: Record<string, number | string>;
  calculatedMetrics: Record<string, number | string>;
}

interface CompanyData {
  companyName: string;
  dataSource?: 'moneycontrol' | 'perplexity' | 'perplexity-url';
  quarters: QuarterData[];
}

interface DataPreviewProps {
  data: CompanyData[];
}

export function DataPreview({ data }: DataPreviewProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const formatValue = (value: number | string | undefined): string => {
    if (value === undefined || value === '--' || value === 'NA' || value === null) return '--';
    if (typeof value === 'number') {
      if (isNaN(value)) return '--';
      // Format percentage values
      if (Math.abs(value) < 100) {
        return value.toFixed(2);
      }
      return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    }
    return String(value);
  };

  const getDataSourceIcon = (source?: string) => {
    switch (source) {
      case 'moneycontrol':
        return <Globe className="h-3 w-3" />;
      case 'perplexity':
        return <Brain className="h-3 w-3" />;
      case 'perplexity-url':
        return <Database className="h-3 w-3" />;
      default:
        return <Database className="h-3 w-3" />;
    }
  };

  const getDataSourceLabel = (source?: string) => {
    switch (source) {
      case 'moneycontrol':
        return 'MoneyControl';
      case 'perplexity':
        return 'Perplexity AI';
      case 'perplexity-url':
        return 'Perplexity URL';
      default:
        return 'Unknown';
    }
  };

  // Get all unique quarters across all companies
  const allQuarters = new Set<string>();
  data.forEach(company => {
    company.quarters.forEach(q => allQuarters.add(q.period || q.quarter));
  });
  const quartersList = Array.from(allQuarters).sort().reverse();

  // Dashboard metrics
  const dashboardMetrics = ['Revenue', 'Op. EBITDA', 'Op. EBITDA%', 'Op. EBIT', 'Op. EBIT%', 'Op. PBT', 'PBT'];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Data Preview
        </CardTitle>
        <CardDescription>
          Review extracted financial data for {data.length} companies across {quartersList.length} quarters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard">Dashboard View</TabsTrigger>
            <TabsTrigger value="companies">Company Details</TabsTrigger>
          </TabsList>

          {/* Dashboard View - Consolidated Table */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
              Consolidated view of key metrics across all companies (values in ₹ Cr, percentages as %)
            </div>
            
            <ScrollArea className="w-full">
              <div className="min-w-[1200px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-600 hover:bg-blue-600">
                      <TableHead className="text-white font-bold sticky left-0 bg-blue-600 z-10">Companies</TableHead>
                      {dashboardMetrics.map(metric => (
                        quartersList.slice(0, 6).map((quarter, qIdx) => (
                          <TableHead 
                            key={`${metric}-${quarter}`} 
                            className={`text-white text-center text-xs ${qIdx === 0 ? 'border-l border-blue-400' : ''}`}
                          >
                            {qIdx === 0 ? (
                              <div>
                                <div className="font-bold">{metric}</div>
                                <div className="font-normal">{quarter}</div>
                              </div>
                            ) : (
                              <div>{quarter}</div>
                            )}
                          </TableHead>
                        ))
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((company, idx) => (
                      <TableRow key={company.companyName} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                        <TableCell className="font-medium sticky left-0 bg-inherit z-10 flex items-center gap-2">
                          {company.companyName}
                          <Badge variant="outline" className="text-xs">
                            {getDataSourceIcon(company.dataSource)}
                          </Badge>
                        </TableCell>
                        {dashboardMetrics.map(metric => (
                          quartersList.slice(0, 6).map((quarter, qIdx) => {
                            const quarterData = company.quarters.find(q => (q.period || q.quarter) === quarter);
                            let value: number | string | undefined;
                            
                            if (quarterData) {
                              // Support multiple data formats from different sources
                              const raw = quarterData.rawData || {};
                              const calc = quarterData.calculatedMetrics || {};
                              
                              if (metric === 'Revenue') {
                                value = calc?.Revenue ?? raw?.Revenue ?? raw?.['Net Sales / Income from Operations'] ?? raw?.['Net Sales'] ?? raw?.Sales;
                              } else if (metric === 'Op. EBITDA') {
                                value = calc?.['Op. EBITDA'] ?? raw?.['Operating Profit'] ?? raw?.EBITDA;
                              } else if (metric === 'Op. EBITDA%') {
                                value = calc?.['Op. EBITDA%'];
                              } else if (metric === 'Op. EBIT') {
                                value = calc?.['Op. EBIT'] ?? raw?.['Operating Profit'] ?? raw?.EBIT;
                              } else if (metric === 'Op. EBIT%') {
                                value = calc?.['Op. EBIT%'];
                              } else if (metric === 'Op. PBT') {
                                value = calc?.['Op. PBT'] ?? raw?.PBT ?? raw?.['Profit Before Tax'];
                              } else if (metric === 'PBT') {
                                value = calc?.PBT ?? raw?.PBT ?? raw?.['P/L Before Tax'] ?? raw?.['Profit Before Tax'];
                              }
                            }
                            
                            return (
                              <TableCell 
                                key={`${company.companyName}-${metric}-${quarter}`} 
                                className={`text-center text-sm ${qIdx === 0 ? 'border-l' : ''}`}
                              >
                                {formatValue(value)}
                              </TableCell>
                            );
                          })
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </TabsContent>

          {/* Company Details View */}
          <TabsContent value="companies" className="space-y-4">
            <Tabs defaultValue={data[0]?.companyName || ''} className="w-full">
              <ScrollArea className="w-full">
                <TabsList className="inline-flex w-max mb-4">
                  {data.map((companyData) => (
                    <TabsTrigger key={companyData.companyName} value={companyData.companyName} className="text-xs">
                      {companyData.companyName}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {data.map((companyData) => (
                <TabsContent key={companyData.companyName} value={companyData.companyName} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{companyData.companyName}</h3>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {getDataSourceIcon(companyData.dataSource)}
                        {getDataSourceLabel(companyData.dataSource)}
                      </Badge>
                    </div>
                    <Badge variant="outline">
                      {companyData.quarters.length} quarter(s)
                    </Badge>
                  </div>

                  {/* Quarterly Data Table */}
                  <ScrollArea className="w-full border rounded-lg">
                    <div className="min-w-[800px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted">
                            <TableHead className="font-bold">Indicator</TableHead>
                            {companyData.quarters.map((q, idx) => (
                              <TableHead key={idx} className="text-center font-bold">
                                {q.period || q.quarter}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Raw Data Indicators */}
                          {companyData.quarters[0] && Object.keys(companyData.quarters[0].rawData).map(indicator => (
                            <TableRow key={indicator}>
                              <TableCell className="font-medium text-xs">{indicator}</TableCell>
                              {companyData.quarters.map((q, qIdx) => (
                                <TableCell key={qIdx} className="text-center">
                                  {formatValue(q.rawData[indicator])}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                          
                          {/* Separator */}
                          <TableRow className="bg-blue-50 dark:bg-blue-950">
                            <TableCell colSpan={companyData.quarters.length + 1} className="font-bold text-blue-900 dark:text-blue-100 text-center">
                              Calculated Metrics
                            </TableCell>
                          </TableRow>
                          
                          {/* Calculated Metrics */}
                          {companyData.quarters[0] && Object.keys(companyData.quarters[0].calculatedMetrics || {}).map(metric => (
                            <TableRow key={metric} className="bg-blue-50/50 dark:bg-blue-950/50">
                              <TableCell className="font-medium text-xs text-blue-900 dark:text-blue-100">{metric}</TableCell>
                              {companyData.quarters.map((q, qIdx) => (
                                <TableCell key={qIdx} className="text-center font-semibold text-blue-900 dark:text-blue-100">
                                  {formatValue(q.calculatedMetrics?.[metric])}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
