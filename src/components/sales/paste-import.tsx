/**
 * Paste Import component for leads
 * Allows users to paste text data to extract leads
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertCircle,
  CheckCircle2,
  Upload,
  FileText,
  Loader2,
  Sparkles,
  ArrowRight,
  Copy,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractMultipleLeads, extractLeadFromText } from '@/lib/text-extraction';
import { createLead } from './actions';

interface DetectedField {
  name: string;
  type: 'email' | 'phone' | 'name' | 'company' | 'custom';
  confidence: number;
  sampleValues: string[];
}

interface ImportProgress {
  current: number;
  total: number;
  status: 'idle' | 'detecting' | 'validating' | 'importing' | 'complete' | 'error';
  message?: string;
}

interface PasteImportProps {
  onComplete?: () => void;
  dictionary?: Record<string, string>;
}

export function PasteImport({ onComplete, dictionary }: PasteImportProps) {
  const d = dictionary;
  const [rawData, setRawData] = useState('');
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    status: 'idle'
  });

  // Detect fields from pasted data
  const detectFields = useCallback((text: string) => {
    setProgress({ current: 0, total: 100, status: 'detecting', message: d?.analyzingData || 'Analyzing data...' });

    if (!text.trim()) {
      return [];
    }

    const fields: DetectedField[] = [];
    const sampleLead = extractLeadFromText(text);

    if (sampleLead.email) {
      fields.push({
        name: d?.email || 'Email',
        type: 'email',
        confidence: 0.95,
        sampleValues: [sampleLead.email]
      });
    }

    if (sampleLead.phone) {
      fields.push({
        name: d?.phone || 'Phone',
        type: 'phone',
        confidence: 0.85,
        sampleValues: [sampleLead.phone]
      });
    }

    if (sampleLead.name) {
      fields.push({
        name: d?.fullName || 'Full Name',
        type: 'name',
        confidence: 0.85,
        sampleValues: [sampleLead.name]
      });
    }

    if (sampleLead.company) {
      fields.push({
        name: d?.company || 'Company',
        type: 'company',
        confidence: 0.8,
        sampleValues: [sampleLead.company]
      });
    }

    const multipleLeads = extractMultipleLeads(text);
    if (multipleLeads.length > 1) {
      fields.push({
        name: d?.multipleEntries || 'Multiple Entries',
        type: 'custom',
        confidence: 0.9,
        sampleValues: [`${multipleLeads.length} ${d?.entriesDetected || 'entries detected'}`]
      });
    }

    setProgress({ current: 100, total: 100, status: 'idle' });
    return fields;
  }, [d]);

  // Handle paste event
  const handlePaste = useCallback((text: string) => {
    setRawData(text);
    if (text.trim()) {
      const fields = detectFields(text);
      setDetectedFields(fields);

      const errors: string[] = [];
      if (fields.length === 0) {
        errors.push(d?.noPatterns || 'No recognizable patterns found');
      }
      if (!fields.find(f => f.type === 'email' || f.type === 'phone')) {
        errors.push(d?.noContact || 'No contact information detected');
      }
      setValidationErrors(errors);
    }
  }, [detectFields, d]);

  // Process and import data
  const handleImport = useCallback(async () => {
    if (!rawData.trim() || validationErrors.length > 0) {
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: 100, status: 'validating', message: d?.validatingData || 'Validating data...' });

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress({ current: 30, total: 100, status: 'validating', message: d?.checkingDuplicates || 'Checking for duplicates...' });

      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress({ current: 60, total: 100, status: 'importing', message: d?.importingLeads || 'Importing leads...' });

      const extractedLeads = extractMultipleLeads(rawData);
      let successCount = 0;
      let errorCount = 0;

      for (const lead of extractedLeads) {
        try {
          const leadData = {
            name: lead.name || 'Unknown',
            email: lead.email || '',
            company: lead.company || '',
            phone: lead.phone || '',
            website: lead.website || '',
            notes: lead.description || '',
            status: 'NEW' as const,
            source: 'IMPORT' as const,
            score: Math.floor(Math.random() * 30) + 70,
            leadType: 'SCHOOL' as const,
            priority: 'MEDIUM' as const,
            verified: false,
            tags: [],
          };

          const result = await createLead(leadData);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      const importMessage = `${d?.imported || 'Imported'} ${successCount} ${d?.newLeads || 'new lead(s)'}${errorCount > 0 ? ` (${errorCount} ${d?.failed || 'failed'})` : ''}`;

      setProgress({ current: 100, total: 100, status: 'complete', message: importMessage });

      setTimeout(() => {
        setRawData('');
        setDetectedFields([]);
        setProgress({ current: 0, total: 0, status: 'idle' });
        if (onComplete) {
          onComplete();
        }
      }, 3000);
    } catch (error) {
      setProgress({
        current: 0,
        total: 0,
        status: 'error',
        message: error instanceof Error ? error.message : (d?.importFailed || 'Import failed')
      });
    } finally {
      setIsProcessing(false);
    }
  }, [rawData, validationErrors, onComplete, d]);

  // Calculate import readiness
  const isReady = useMemo(() => {
    return rawData.trim().length > 0 &&
           detectedFields.length > 0 &&
           validationErrors.length === 0 &&
           !isProcessing;
  }, [rawData, detectedFields, validationErrors, isProcessing]);

  const getFieldBadgeVariant = (confidence: number): "default" | "secondary" | "outline" => {
    if (confidence >= 0.9) return 'default';
    if (confidence >= 0.7) return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>{d?.importLeads || 'Import Leads'}</CardTitle>
              <CardDescription>
                {d?.pasteDescription || 'Paste or type contact information to automatically extract leads'}
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <FileText className="h-3 w-3" />
              {d?.textImport || 'Text Import'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder={d?.pastePlaceholder || `Paste your text data here...
Example: John Doe - CEO - john@example.com`}
              value={rawData}
              onChange={(e) => handlePaste(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              disabled={isProcessing}
            />
            {rawData && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => {
                  setRawData('');
                  setDetectedFields([]);
                  setValidationErrors([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Sample Data Button */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePaste("John Doe, john@example.com, +1 555-0123, ABC Corp\nJane Smith, jane@example.com, +1 555-0124, XYZ Inc\nBob Johnson, bob@example.com, +1 555-0125, 123 Company")}
              disabled={isProcessing}
            >
              <Copy className="mr-2 h-3 w-3" />
              {d?.useSampleData || 'Use Sample Data'}
            </Button>
          </div>

          {/* Field Detection Preview */}
          {detectedFields.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">{d?.detectedFields || 'Detected Fields'}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {detectedFields.map((field, index) => (
                      <Badge
                        key={index}
                        variant={getFieldBadgeVariant(field.confidence)}
                        className="gap-1"
                      >
                        {field.name}
                        <span className="text-xs opacity-60">
                          {Math.round(field.confidence * 100)}%
                        </span>
                      </Badge>
                    ))}
                  </div>

                  <ScrollArea className="h-[100px] w-full rounded-md border p-3">
                    <div className="space-y-2">
                      {detectedFields.map((field, index) => (
                        <div key={index} className="text-xs">
                          <span className="font-medium text-muted-foreground">
                            {field.name}:
                          </span>
                          <span className="ml-2 font-mono">
                            {field.sampleValues.slice(0, 2).join(', ')}
                            {field.sampleValues.length > 2 && '...'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Alerts */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{d?.validationIssues || 'Validation Issues'}</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-inside list-disc text-sm">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Indicator */}
          {progress.status !== 'idle' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progress.message}</span>
                <span className="font-medium">
                  {progress.current}/{progress.total}
                </span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
              {progress.status === 'complete' && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {progress.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            {rawData.trim().split('\n').filter(l => l.trim()).length} {d?.linesDetected || 'lines detected'}
          </p>
          <Button
            onClick={handleImport}
            disabled={!isReady}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {d?.processing || 'Processing...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {d?.importLeads || 'Import Leads'}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
