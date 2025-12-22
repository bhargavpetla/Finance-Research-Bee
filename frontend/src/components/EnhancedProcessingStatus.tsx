import { CheckCircle2, XCircle, Loader2, Download, AlertCircle, Clock, Database, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CompanyDetail {
  company: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage?: string;
  dataSource?: 'moneycontrol' | 'perplexity' | 'perplexity-url';
  estimatedTime?: number;
  progress?: number;
  liveData?: any[];
  reasoning?: string;
  switchedSource?: boolean;
  fallbackStep?: number;
}

interface EnhancedProcessingStatusProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progressData?: {
    currentCompany?: string;
    completedCompanies?: string[];
    failedCompanies?: string[];
    totalCompanies?: number;
    currentStep?: string;
    companyDetails?: CompanyDetail[];
  };
  errorLog?: Array<{
    company: string;
    error: string;
    timestamp: number;
  }>;
  outputFileUrl?: string;
  onDownload?: () => void;
}

export function EnhancedProcessingStatus({
  status,
  progressData,
  errorLog,
  outputFileUrl,
  onDownload
}: EnhancedProcessingStatusProps) {
  const completedCount = progressData?.completedCompanies?.length || 0;
  const failedCount = progressData?.failedCompanies?.length || 0;
  const totalCount = progressData?.totalCompanies || 13;
  const progressPercent = Math.round(((completedCount + failedCount) / totalCount) * 100);

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'processing':
        return <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />;
      default:
        return <Loader2 className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Processing Completed';
      case 'failed':
        return 'Processing Failed';
      case 'processing':
        return 'Processing...';
      default:
        return 'Pending';
    }
  };

  const getDataSourceIcon = (source?: string) => {
    if (source === 'moneycontrol') {
      return <Database className="h-3 w-3" />;
    } else if (source === 'perplexity' || source === 'perplexity-url') {
      return <Brain className="h-3 w-3" />;
    }
    return null;
  };

  const getDataSourceLabel = (source?: string) => {
    if (source === 'moneycontrol') return 'MoneyControl';
    if (source === 'perplexity') return 'Perplexity AI';
    if (source === 'perplexity-url') return 'Perplexity URL';
    return 'Unknown';
  };

  const formatEstimatedTime = (seconds?: number) => {
    if (!seconds) return 'Calculating...';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle>{getStatusText()}</CardTitle>
              <CardDescription>
                {progressData?.currentStep || 'Waiting to start...'}
              </CardDescription>
            </div>
          </div>
          {status === 'completed' && outputFileUrl && (
            <Button onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Excel
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        {status === 'processing' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} />
            <p className="text-sm text-muted-foreground">
              {completedCount} completed, {failedCount} failed out of {totalCount} companies
            </p>
          </div>
        )}

        {/* Real-time Company Processing Details */}
        {status === 'processing' && progressData?.companyDetails && progressData.companyDetails.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Real-time Processing Activity</h4>
            <ScrollArea className="h-96 border rounded-lg p-3">
              <div className="space-y-3">
                {progressData.companyDetails.map((detail, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      detail.status === 'processing'
                        ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                        : detail.status === 'completed'
                        ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                        : detail.status === 'failed'
                        ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {detail.status === 'processing' && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        )}
                        {detail.status === 'completed' && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        {detail.status === 'failed' && (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        {detail.status === 'pending' && (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="font-medium text-sm">{detail.company}</span>
                      </div>
                      {detail.dataSource && (
                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                          {getDataSourceIcon(detail.dataSource)}
                          {getDataSourceLabel(detail.dataSource)}
                        </Badge>
                      )}
                    </div>

                    {detail.stage && (
                      <p className="text-xs text-muted-foreground mb-2">
                        <span className="font-medium">Stage:</span> {detail.stage}
                      </p>
                    )}

                    {detail.status === 'processing' && detail.progress !== undefined && (
                      <div className="space-y-1">
                        <Progress value={detail.progress} className="h-1.5" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{detail.progress}%</span>
                          {detail.estimatedTime !== undefined && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatEstimatedTime(detail.estimatedTime)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Completed Companies */}
        {progressData?.completedCompanies && progressData.completedCompanies.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Completed ({progressData.completedCompanies.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {progressData.completedCompanies.map((company) => (
                <Badge key={company} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  {company}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Failed Companies */}
        {progressData?.failedCompanies && progressData.failedCompanies.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Failed ({progressData.failedCompanies.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {progressData.failedCompanies.map((company) => (
                <Badge key={company} variant="destructive">
                  {company}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Error Log */}
        {errorLog && errorLog.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Error Log
            </h4>
            <ScrollArea className="h-40 border rounded-lg p-3">
              <div className="space-y-2">
                {errorLog.map((error, idx) => (
                  <div key={idx} className="text-sm p-2 bg-red-50 dark:bg-red-950 rounded">
                    <p className="font-medium text-red-900 dark:text-red-100">
                      {error.company}
                    </p>
                    <p className="text-red-700 dark:text-red-300 text-xs mt-1">
                      {error.error}
                    </p>
                    <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                      {new Date(error.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Success Message */}
        {status === 'completed' && (
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-sm text-green-900 dark:text-green-100">
              ✓ Financial data has been successfully extracted and processed for all companies.
              The Excel file is ready for download.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
