
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";

interface Step3ProgressProps {
    jobStatus: any;
    onNext: () => void;
}

export function Step3Progress({ jobStatus, onNext }: Step3ProgressProps) {
    const progress = jobStatus?.progressData?.companyDetails?.reduce((acc: number, curr: any) => acc + (curr.progress || 0), 0) / (jobStatus?.progressData?.totalCompanies || 1);
    const totalCompanies = jobStatus?.progressData?.totalCompanies || 0;
    const completedCount = jobStatus?.progressData?.completedCompanies?.length || 0;
    const isCompleted = jobStatus?.status === 'completed';

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                            {isCompleted ? (
                                <>
                                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    Research Complete
                                </>
                            ) : (
                                <>
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    Research in Progress
                                </>
                            )}
                        </h2>
                        <p className="text-muted-foreground">
                            {isCompleted
                                ? "All companies have been processed successfully."
                                : "Fetching quarterly financial data from Moneycontrol via Perplexity AI..."}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{Math.round(progress || 0)}%</div>
                        <div className="text-sm text-muted-foreground">
                            Processing {completedCount} of {totalCompanies} companies...
                        </div>
                    </div>
                </div>

                <Progress value={progress} className="h-3" />
            </div>

            <div className="space-y-4">
                {jobStatus?.progressData?.companyDetails?.map((company: any) => (
                    <Card key={company.company} className="overflow-hidden">
                        <div className="p-4 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                {company.status === 'completed' ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                ) : company.status === 'failed' ? (
                                    <XCircle className="w-6 h-6 text-red-500" />
                                ) : (
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between mb-1">
                                    <h3 className="font-semibold truncate">{company.company}</h3>
                                    <span className="text-sm text-muted-foreground">{company.status === 'completed' ? 'Done' : company.stage}</span>
                                </div>
                                {company.status === 'processing' && (
                                    <Progress value={company.progress} className="h-1.5" />
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Process Logs</h3>
                <ScrollArea className="h-48 w-full rounded-md border p-4 bg-muted/50 font-mono text-xs">
                    {jobStatus?.progressData?.logs?.map((log: string, index: number) => (
                        <div key={index} className="mb-1 last:mb-0">
                            {log}
                        </div>
                    )) || <div className="text-muted-foreground italic">Waiting for logs...</div>}
                </ScrollArea>
            </div>

            {isCompleted && (
                <div className="flex justify-end pt-4">
                    <Button size="lg" onClick={onNext} className="gap-2">
                        View Results
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
