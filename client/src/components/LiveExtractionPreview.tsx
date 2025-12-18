import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, ArrowRight, Brain, Database } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CompanyDetail {
  company: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage?: string;
  dataSource?: 'moneycontrol' | 'perplexity' | 'perplexity-url';
  liveData?: any[];
  reasoning?: string;
  switchedSource?: boolean;
  fallbackStep?: number;
}

interface LiveExtractionPreviewProps {
  companyDetails?: CompanyDetail[];
}

export function LiveExtractionPreview({ companyDetails }: LiveExtractionPreviewProps) {
  if (!companyDetails || companyDetails.length === 0) {
    return null;
  }

  const processingCompany = companyDetails.find(c => c.status === 'processing');
  
  if (!processingCompany) {
    return null;
  }

  const formatValue = (value: number | string): string => {
    if (value === '--' || value === 'NA') return '--';
    if (typeof value === 'number') {
      return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    }
    return String(value);
  };

  return (
    <Card className="mt-6 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Live Extraction Preview
            </CardTitle>
            <CardDescription>
              Real-time view of data being extracted for {processingCompany.company}
            </CardDescription>
          </div>
          <Badge variant={processingCompany.dataSource === 'perplexity' ? 'secondary' : 'default'}>
            {processingCompany.dataSource === 'moneycontrol' ? 'MoneyControl' : 'Perplexity AI'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Source Switch Alert */}
        {processingCompany.switchedSource && (
          <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <span className="font-medium">Source Switched:</span>
              <span>MoneyControl</span>
              <ArrowRight className="h-4 w-4" />
              <span>Perplexity AI</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Perplexity Chain of Thought */}
        {processingCompany.reasoning && processingCompany.dataSource === 'perplexity' && (
          <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                Perplexity AI Chain of Thought
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <pre className="text-xs whitespace-pre-wrap text-purple-900 dark:text-purple-100 font-mono">
                  {processingCompany.reasoning}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Live Extracted Data */}
        {processingCompany.liveData && processingCompany.liveData.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Extracted Data ({processingCompany.liveData.length} quarter(s))
            </h4>
            <ScrollArea className="h-[400px] border rounded-lg bg-muted/30">
              <div className="p-4 space-y-4">
                {processingCompany.liveData.map((quarter: any, idx: number) => (
                  <Card key={idx} className="bg-background">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        {quarter.quarter} - {quarter.period}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {quarter.indicators && Object.entries(quarter.indicators).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex justify-between p-2 bg-muted/50 rounded">
                            <span className="text-muted-foreground truncate pr-2" title={key}>
                              {key}:
                            </span>
                            <span className="font-medium">{formatValue(value)}</span>
                          </div>
                        ))}
                        {quarter.data && Object.entries(quarter.data).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex justify-between p-2 bg-muted/50 rounded">
                            <span className="text-muted-foreground truncate pr-2" title={key}>
                              {key}:
                            </span>
                            <span className="font-medium">{formatValue(value)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Current Stage */}
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Current Stage:</span> {processingCompany.stage}
        </div>
      </CardContent>
    </Card>
  );
}
