
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/FileUpload";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, FileSpreadsheet } from "lucide-react";

interface Step1UploadProps {
    onFileSelect: (file: File) => void;
    selectedFile: File | null;
    onNext: () => void;
    isUploading: boolean;
}

export function Step1Upload({ onFileSelect, selectedFile, onNext, isUploading }: Step1UploadProps) {
    return (
        <div className="max-w-2xl mx-auto space-y-8 py-8">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-primary">Upload Your Excel Template</h2>
                <p className="text-muted-foreground">
                    Upload your Excel file containing company names. We'll extract them and fetch quarterly financial data automatically.
                </p>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 mt-4">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        ⚠️ Only upload the <strong>Format-NEW</strong> Excel file
                    </p>
                </div>
            </div>

            <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
                <CardContent className="p-8">
                    <FileUpload
                        onFileSelect={onFileSelect}
                        disabled={isUploading}
                    />
                </CardContent>
            </Card>

            {selectedFile && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400">
                        <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-green-900 dark:text-green-100">Ready to process</p>
                        <p className="text-sm text-green-700 dark:text-green-300">{selectedFile.name}</p>
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-4">
                <Button
                    size="lg"
                    onClick={onNext}
                    disabled={!selectedFile || isUploading}
                    className="gap-2"
                >
                    {isUploading ? "Uploading..." : "Next: Select Companies"}
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
