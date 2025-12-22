
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardLayoutProps {
    currentStep: number;
    steps: string[];
    children: React.ReactNode;
}

export function WizardLayout({ currentStep, steps, children }: WizardLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-6">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header & Stepper */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-xl font-bold text-primary">AI</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">Financial Research AI</h1>
                            <p className="text-xs text-muted-foreground">Automated Data Extraction</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {steps.map((step, index) => {
                            const stepNumber = index + 1;
                            const isActive = stepNumber === currentStep;
                            const isCompleted = stepNumber < currentStep;

                            return (
                                <div key={step} className="flex items-center">
                                    <div
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-primary text-primary-foreground"
                                                : isCompleted
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-muted-foreground"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "flex items-center justify-center w-5 h-5 rounded-full text-[10px]",
                                                isActive
                                                    ? "bg-white text-primary"
                                                    : isCompleted
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-gray-200 dark:bg-gray-700"
                                            )}
                                        >
                                            {isCompleted ? <Check className="w-3 h-3" /> : stepNumber}
                                        </div>
                                        <span className="hidden sm:inline">{step}</span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className="w-8 h-[1px] bg-gray-200 dark:bg-gray-700 mx-2" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border min-h-[600px] p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
