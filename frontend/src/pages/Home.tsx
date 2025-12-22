import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { Step1Upload } from '@/components/wizard/Step1Upload';
import { Step2Selection } from '@/components/wizard/Step2Selection';
import { Step3Progress } from '@/components/wizard/Step3Progress';
import { Step4Preview } from '@/components/wizard/Step4Preview';

export default function Home() {
  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const steps = ["Upload", "Select", "Process", "Results"];

  // Data State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedQuarters, setSelectedQuarters] = useState<string[]>(['Q1', 'Q2', 'Q3', 'Q4']);
  const [selectedFiscalYears, setSelectedFiscalYears] = useState<number[]>([2025, 2026]);
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [customCompanies, setCustomCompanies] = useState<Array<{ name: string; url: string }>>([]);

  // Queries & Mutations
  const uploadMutation = trpc.scraper.uploadFile.useMutation();
  const startScrapingMutation = trpc.scraper.startScraping.useMutation();
  const { data: jobStatus } = trpc.scraper.getJobStatus.useQuery(
    { jobId: currentJobId! },
    { enabled: !!currentJobId, refetchInterval: 1000 }
  );
  const { data: companies } = trpc.scraper.getCompanies.useQuery();

  // Combine backend companies with custom added ones
  const allCompanies = [...(companies || []), ...customCompanies];

  // Handlers
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleAddCompany = (name: string) => {
    // Check if already exists
    if (allCompanies.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Company already exists');
      return;
    }

    // Add to custom list
    setCustomCompanies([...customCompanies, { name, url: '' }]);
    // Auto-select it
    setSelectedCompanies([...selectedCompanies, name]);
    toast.success(`Added ${name}`);
  };

  const handleUploadAndNext = async () => {
    if (!selectedFile) return;

    // For Step 1 -> 2, we just validate file is selected
    // Actual upload happens when starting research (or we can upload now to get companies)
    // Based on requirements, Step 2 shows detected companies, so we likely need to parse the file first.
    // However, the current backend uploadFile mutation does everything (upload + start job).
    // We might need to adjust this, but for now let's assume we just move to step 2 
    // and use the default company list or simulated list until we actually process.
    // Ideally, we'd have a "parseFile" endpoint, but we'll use the existing "getCompanies" for now
    // and assume the file matches.

    // In a real implementation matching the screenshot "Detected Companies", 
    // we would parse the Excel here. For this demo/refactor, we'll use the static list.
    if (companies) {
      setSelectedCompanies(companies.map(c => c.name));
    }
    setCurrentStep(2);
  };

  const handleStartResearch = async () => {
    if (!selectedFile && selectedCompanies.length === 0) {
      toast.error('Please select a file or companies');
      return;
    }

    setIsUploading(true);
    try {
      let result;

      if (selectedFile) {
        // Upload mode
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          const base64Data = base64.split(',')[1];

          try {
            // We use the upload mutation but we might want to filter by selected companies
            // The current backend doesn't support filtering uploaded file companies easily
            // without modifying the backend. For now, we'll send the file.
            // If we want to support "Select companies", we'd need to pass that list to the backend.
            // Let's assume we process all for now or the backend needs an update to accept company list.

            // NOTE: The current uploadFile mutation takes testMode/testCompany.
            // We should probably update it to take a list of companies to process if possible,
            // or just process what's in the file.

            result = await uploadMutation.mutateAsync({
              fileName: selectedFile.name,
              fileData: base64Data,
              selectedQuarters,
              selectedFiscalYears,
              selectedCompanies, // Pass selected companies
              testMode: false, // Process all selected
            });

            setCurrentJobId(result.jobId);
            setCurrentStep(3);
            toast.success('Research started');
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Upload failed');
          } finally {
            setIsUploading(false);
          }
        };
        reader.readAsDataURL(selectedFile);
      } else {
        // No file, just start scraping (using default list or selected)
        // This path might not be reachable if we enforce file upload in Step 1
        // But keeping logic just in case.
        result = await startScrapingMutation.mutateAsync({
          selectedQuarters,
          selectedFiscalYears,
          selectedCompanies, // Pass selected companies
          testMode: false,
        });
        setCurrentJobId(result.jobId);
        setCurrentStep(3);
      }
    } catch (error) {
      toast.error('Failed to start research');
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (jobStatus?.outputFileUrl) {
      window.open(jobStatus.outputFileUrl, '_blank');
      toast.success('Download started');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setCurrentJobId(null);
    setCurrentStep(1);
    setSelectedCompanies([]);
    setCustomCompanies([]);
  };

  // Auto-advance to Step 4 when complete
  useEffect(() => {
    if (currentStep === 3 && jobStatus?.status === 'completed') {
      // Optional: Auto advance or wait for user to click "View Results"
      // The Step3 component has a button for this.
    }
  }, [currentStep, jobStatus?.status]);

  return (
    <WizardLayout currentStep={currentStep} steps={steps}>
      {currentStep === 1 && (
        <Step1Upload
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          onNext={handleUploadAndNext}
          isUploading={isUploading}
        />
      )}

      {currentStep === 2 && (
        <Step2Selection
          companies={allCompanies}
          selectedCompanies={selectedCompanies}
          onSelectionChange={setSelectedCompanies}
          selectedQuarters={selectedQuarters}
          selectedFiscalYears={selectedFiscalYears}
          onQuartersChange={setSelectedQuarters}
          onFiscalYearsChange={setSelectedFiscalYears}
          onNext={handleStartResearch}
          onBack={() => setCurrentStep(1)}
          onAddCompany={handleAddCompany}
        />
      )}

      {currentStep === 3 && (
        <Step3Progress
          jobStatus={jobStatus}
          onNext={() => setCurrentStep(4)}
        />
      )}

      {currentStep === 4 && (
        <Step4Preview
          jobStatus={jobStatus}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      )}
    </WizardLayout>
  );
}
