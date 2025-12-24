
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuarterSelector } from "@/components/QuarterSelector";
import { ArrowLeft, ArrowRight, Plus, Search, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Step2SelectionProps {
    companies: Array<{ name: string; url: string }>;
    selectedCompanies: string[];
    onSelectionChange: (companies: string[]) => void;
    selectedQuarters: string[];
    selectedFiscalYears: number[];
    onQuartersChange: (quarters: string[]) => void;
    onFiscalYearsChange: (years: number[]) => void;
    onNext: () => void;
    onBack: () => void;
    onAddCompany: (name: string) => void;
}

export function Step2Selection({
    companies,
    selectedCompanies,
    onSelectionChange,
    selectedQuarters,
    selectedFiscalYears,
    onQuartersChange,
    onFiscalYearsChange,
    onNext,
    onBack,
    onAddCompany,
}: Step2SelectionProps) {
    const [newCompany, setNewCompany] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    // Debounce search term to avoid excessive API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(newCompany);
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(timer);
    }, [newCompany]);

    // Search companies with debounced term
    const { data: searchResults, isLoading: isSearching } = trpc.scraper.searchCompanies.useQuery(
        { query: debouncedSearchTerm, limit: 5 },
        { enabled: debouncedSearchTerm.length >= 2 && showSuggestions }
    );

    const handleToggleAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(companies.map((c) => c.name));
        } else {
            onSelectionChange([]);
        }
    };

    const handleToggleCompany = (name: string) => {
        if (selectedCompanies.includes(name)) {
            onSelectionChange(selectedCompanies.filter((c) => c !== name));
        } else {
            onSelectionChange([...selectedCompanies, name]);
        }
    };

    const handleAddCompany = async () => {
        if (!newCompany.trim()) return;

        // Just add the company directly without validation
        // Autocomplete still provides suggestions, but we don't block on validation
        onAddCompany(newCompany.trim());
        setNewCompany("");
        setShowSuggestions(false);
    };

    const handleSelectSuggestion = (suggestion: string) => {
        setNewCompany(suggestion);
        setShowSuggestions(false);
    };

    const filteredCompanies = companies.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-primary">Detected Companies</h2>
                    <p className="text-muted-foreground">
                        We found {companies.length} companies in your Excel file. Select the ones you want to research.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggleAll(true)}>
                        Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggleAll(false)}>
                        Deselect All
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredCompanies.map((company) => (
                    <div
                        key={company.name}
                        className={`
              relative p-4 rounded-lg border transition-all cursor-pointer flex items-center gap-3
              ${selectedCompanies.includes(company.name)
                                ? "bg-primary/5 border-primary ring-1 ring-primary"
                                : "bg-white dark:bg-gray-800 border-gray-200 hover:border-primary/50"
                            }
            `}
                        onClick={() => handleToggleCompany(company.name)}
                    >
                        <Checkbox
                            checked={selectedCompanies.includes(company.name)}
                            onCheckedChange={() => handleToggleCompany(company.name)}
                        />
                        <span className="font-medium truncate" title={company.name}>
                            {company.name}
                        </span>
                    </div>
                ))}
            </div>

            <div className="flex gap-4 items-end border-t pt-6">
                <div className="flex-1 space-y-2 relative">
                    <label className="text-sm font-medium">Add another company</label>
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Input
                                placeholder="Type IT company name (e.g. TCS, Infosys)"
                                value={newCompany}
                                onChange={(e) => {
                                    setNewCompany(e.target.value);
                                    setShowSuggestions(e.target.value.length >= 2);
                                }}
                                onFocus={() => setShowSuggestions(newCompany.length >= 2)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            />
                            {isSearching && (
                                <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" />
                            )}
                            {showSuggestions && searchResults && searchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-60 overflow-auto">
                                    {searchResults.map((result, idx) => (
                                        <div
                                            key={idx}
                                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                                            onClick={() => handleSelectSuggestion(result.name)}
                                        >
                                            <span>{result.name}</span>
                                            {result.score > 0.9 && (
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={handleAddCompany} 
                            disabled={!newCompany.trim() || isValidating}
                        >
                            {isValidating ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4 mr-2" />
                            )}
                            Add
                        </Button>
                    </div>
                </div>
            </div>

            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Select Time Period</h3>
                <QuarterSelector
                    selectedQuarters={selectedQuarters}
                    selectedFiscalYears={selectedFiscalYears}
                    onQuartersChange={onQuartersChange}
                    onFiscalYearsChange={onFiscalYearsChange}
                />
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={onBack} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Button>
                <Button
                    size="lg"
                    onClick={onNext}
                    disabled={selectedCompanies.length === 0 || selectedQuarters.length === 0 || selectedFiscalYears.length === 0}
                    className="gap-2"
                >
                    Start Research
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
