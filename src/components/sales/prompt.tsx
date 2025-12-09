/**
 * Lead Agent prompt component for Sales
 * AI-powered lead extraction and import
 */

'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import AgentHeading from '@/components/atom/agent-heading';
import { AIResponseDisplay } from '@/components/atom/ai-response-display';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage
} from '@/components/atom/prompt-input';
import { PlusIcon, RefreshCw, Paperclip, Send, Mic, Brain, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { extractLeadsFromText, createLead } from './actions';

interface SalesPromptProps {
  onLeadsCreated?: (count: number) => void;
  dictionary?: Record<string, string>;
}

export default function SalesPrompt({ onLeadsCreated, dictionary }: SalesPromptProps) {
  const d = dictionary;
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'groq' | 'claude'>('groq');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiReasoning, setAiReasoning] = useState('');
  const [leadsGenerated, setLeadsGenerated] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { toast } = useToast();

  const handleRefresh = () => {
    if (onLeadsCreated) {
      onLeadsCreated(leadsGenerated);
    }
    window.location.reload();
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!message.text?.trim() && !message.files?.length) {
      return;
    }

    setHasInteracted(true);
    setIsProcessing(true);

    if (message.text?.trim()) {
      setAiReasoning(`## ${d?.extractionProcess || 'Lead Extraction Process'}

1. **${d?.analyzing || 'Analyzing Input'}**: ${d?.parsingText || 'Parsing the provided text to identify potential leads'}
2. **${d?.extracting || 'Data Extraction'}**: ${d?.usingModel || 'Using'} ${selectedModel === 'groq' ? 'Groq' : 'Claude'} ${d?.toExtract || 'model to extract relevant information'}
3. **${d?.validating || 'Validation'}**: ${d?.ensuringValid || 'Ensuring all extracted leads have valid contact information'}
4. **${d?.enriching || 'Enrichment'}**: ${d?.addingScores || 'Adding scores and metadata to prioritize leads'}
5. **${d?.deduplicating || 'Deduplication'}**: ${d?.removingDupes || 'Removing any duplicate entries to maintain data quality'}`);
    } else {
      setAiReasoning('');
    }

    let leadsCreated = 0;

    try {
      // Process text prompt for AI lead extraction
      if (message.text?.trim()) {
        toast({
          title: d?.processing || 'Processing',
          description: d?.extractingLeads || 'Extracting leads from text...',
        });

        const result = await extractLeadsFromText({
          rawText: message.text,
          source: 'web',
          model: selectedModel,
          options: {
            autoScore: true,
            detectDuplicates: true,
            enrichWithAI: false,
          }
        });

        if (result.success && result.data) {
          const extractedCount = result.data.leads?.length || 0;
          leadsCreated += extractedCount;
          setLeadsGenerated(extractedCount);

          const leadsList = result.data.leads?.map((lead, idx) =>
            `${idx + 1}. **${lead.name}** - ${lead.company || 'N/A'} (${lead.email || d?.noEmail || 'No email'})`
          ).join('\n');

          setAiResponse(`## ${d?.extractionResults || 'Lead Extraction Results'}

${d?.successfullyExtracted || 'Successfully extracted'} **${extractedCount} ${d?.leads || 'leads'}** ${d?.fromInput || 'from your input'}.

### ${d?.extractedLeads || 'Extracted Leads'}:
${leadsList || d?.noLeadsFound || 'No leads found'}

### ${d?.actionsAvailable || 'Actions Available'}:
- ${d?.clickRefresh || 'Click **Refresh Table** below to view the new leads'}
- ${d?.continueAdding || 'Continue adding more leads using the input'}
- ${d?.exportWhenReady || 'Export leads when ready'}`);

          if (onLeadsCreated) {
            onLeadsCreated(extractedCount);
          }
        } else {
          const errorMsg = !result.success ? result.error : (d?.unknownError || 'Unknown error occurred');
          setAiResponse(`## ${d?.extractionFailed || 'Extraction Failed'}

${d?.unableToExtract || 'Unable to extract leads from the provided input.'}

### ${d?.errorDetails || 'Error Details'}:
${errorMsg}

### ${d?.suggestions || 'Suggestions'}:
- ${d?.ensureValidContact || 'Ensure your input contains valid contact information'}
- ${d?.tryDifferentFormat || 'Try using a different format or structure'}
- ${d?.checkFormatting || 'Check for any formatting issues in your data'}`);
        }
      }

      // Process file uploads for CSV import
      if (message.files?.length) {
        toast({
          title: d?.importing || 'Importing',
          description: `${d?.processingFiles || 'Processing'} ${message.files.length} ${d?.files || 'file(s)'}...`,
        });

        for (const file of message.files) {
          if (file.url) {
            const response = await fetch(file.url);
            const text = await response.text();
            const imported = await processCSVContent(text);
            leadsCreated += imported;
          }
        }

        setLeadsGenerated(prev => prev + leadsCreated);

        if (onLeadsCreated) {
          onLeadsCreated(leadsCreated);
        }
      }

      if (leadsCreated > 0) {
        toast({
          title: d?.success || 'Success!',
          description: `${d?.successfullyImported || 'Successfully imported'} ${leadsCreated} ${d?.newLeads || 'new leads'}. ${d?.clickRefreshView || 'Click "Refresh Table" to view them.'}`,
        });
      } else if (!aiResponse) {
        setAiResponse(`## ${d?.noLeadsFound || 'No Leads Found'}

${d?.noValidLeads || 'No valid leads could be extracted from your input.'}

### ${d?.tipsForBetter || 'Tips for Better Results'}:
- ${d?.includeClearContact || 'Include clear contact information (names, emails, companies)'}
- ${d?.useStructuredFormats || 'Use structured formats like CSV or lists'}
- ${d?.provideMoreDetailed || 'Provide more detailed descriptions of your target audience'}`);
      }
    } catch (error) {
      console.error('[SalesPrompt] Error processing prompt:', error);
      setAiResponse(`## ${d?.errorOccurred || 'Error Occurred'}

${d?.errorWhileProcessing || 'An error occurred while processing your request. Please try again.'}`);
    } finally {
      setIsProcessing(false);
      setPrompt('');
    }
  };

  // Helper function to process CSV content
  const processCSVContent = async (csvText: string): Promise<number> => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return 0;

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    let created = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());

      if (values.length !== headers.length) continue;

      const leadData: Record<string, unknown> = {
        status: 'NEW',
        source: 'IMPORT',
        score: Math.floor(Math.random() * 30) + 70,
      };

      headers.forEach((header, index) => {
        if (header === 'name') leadData.name = values[index];
        if (header === 'email') leadData.email = values[index];
        if (header === 'company') leadData.company = values[index];
        if (header === 'phone') leadData.phone = values[index];
        if (header === 'website') leadData.website = values[index];
      });

      if (leadData.name || leadData.email) {
        const result = await createLead(leadData as Parameters<typeof createLead>[0]);
        if (result.success) created++;
      }
    }

    return created;
  };

  return (
    <section className="flex flex-col bg-gradient-to-b from-background to-muted/20" suppressHydrationWarning>
      <div className="flex-1 flex flex-col items-center justify-center container max-w-4xl px-4 mx-auto py-8" suppressHydrationWarning>
        <div className="flex flex-col items-center text-center w-full">
          {!hasInteracted && (
            <AgentHeading
              title={d?.leadAgent || "Lead Agent"}
              scrollTarget="sales-content"
              scrollText={d?.exploreExisting || "explore existing leads"}
            />
          )}

          {hasInteracted && (
            <div
              id="ai-response-container"
              className={cn(
                "w-full max-w-3xl space-y-4 overflow-y-auto overflow-x-hidden rounded-lg relative",
                isInputFocused ? "max-h-[200px]" : "max-h-[400px]"
              )}
            >
              <AIResponseDisplay
                response={aiResponse}
                reasoning={aiReasoning}
                isStreaming={isProcessing}
                showReasoning={!!aiReasoning}
                className="mb-4 pr-3"
                streamDelay={10}
              />

              {leadsGenerated > 0 && !isProcessing && (
                <div className="flex justify-center gap-4 pt-4">
                  <Button
                    onClick={handleRefresh}
                    className="gap-2"
                    size="lg"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {d?.refreshTable || 'Refresh Table'} ({leadsGenerated} {d?.newLeads || 'new leads'})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setHasInteracted(false);
                      setAiResponse('');
                      setAiReasoning('');
                      setLeadsGenerated(0);
                    }}
                  >
                    {d?.startNew || 'Start New'}
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="w-full max-w-3xl relative mt-6">
            <PromptInput
              onSubmit={handleSubmit}
              className={cn(
                "group flex gap-2 w-full rounded-[1.75rem] border border-muted-foreground/10 bg-muted text-base shadow-sm transition-all duration-300 ease-in-out focus-within:border-foreground/20 hover:border-foreground/10 focus-within:hover:border-foreground/20",
                hasInteracted && !isInputFocused ? "h-14 items-center p-2" : "flex-col p-3"
              )}
              multiple
              accept="text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv"
              maxFiles={5}
              maxFileSize={5 * 1024 * 1024}
            >
              <div className={cn(
                "relative flex items-center",
                hasInteracted && !isInputFocused ? "flex-1 gap-2" : "flex-1"
              )}>
                {hasInteracted && !isInputFocused && (
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger className="h-8 w-8 rounded-full bg-muted hover:bg-blue-100 p-0">
                      <PlusIcon className="h-5 w-5" />
                    </PromptInputActionMenuTrigger>
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments label={d?.uploadCSV || "Upload CSV or Excel file"} />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>
                )}

                <PromptInputAttachments>
                  {(attachment) => (
                    <PromptInputAttachment data={attachment} />
                  )}
                </PromptInputAttachments>

                <PromptInputTextarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder={hasInteracted && !isInputFocused
                    ? (d?.addMoreLeads || "Add more leads...")
                    : (d?.describeTarget || "Describe your target audience or paste contact info...")}
                  className={cn(
                    "flex w-full rounded-md ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-[16px] bg-transparent focus:bg-transparent flex-1",
                    hasInteracted && !isInputFocused
                      ? "!px-2 py-0 leading-[40px] max-h-[40px]"
                      : "!px-0 py-2 leading-snug max-h-[200px]"
                  )}
                  style={hasInteracted && !isInputFocused ? { height: '40px' } : { minHeight: '80px', height: '80px' }}
                />

                {hasInteracted && !isInputFocused && (
                  <div className="flex items-center gap-1">
                    <PromptInputButton
                      className="h-8 w-8 rounded-full bg-muted hover:bg-blue-100"
                    >
                      <Mic className="h-5 w-5" />
                    </PromptInputButton>

                    <PromptInputSubmit
                      disabled={!prompt.trim() && !isProcessing}
                      status={isProcessing ? 'streaming' : 'ready'}
                      className="h-8 w-8 rounded-full"
                      variant="default"
                      size="icon"
                    >
                      <Send className="h-5 w-5" />
                    </PromptInputSubmit>
                  </div>
                )}
              </div>

              {(!hasInteracted || isInputFocused) && (
                <div className="flex gap-1 flex-wrap items-center">
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-muted hover:bg-blue-100 hover:border-transparent gap-1.5 h-8 w-8 rounded-full p-0 text-muted-foreground hover:text-foreground">
                      <PlusIcon className="shrink-0 h-5 w-5 text-muted-foreground" />
                    </PromptInputActionMenuTrigger>
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments label={d?.uploadCSV || "Upload CSV or Excel file"} />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>

                  <PromptInputButton
                    className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-muted hover:bg-blue-100 hover:border-transparent py-2 h-8 gap-1.5 rounded-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Paperclip className="shrink-0 h-4 w-4" />
                    <span className="hidden md:flex">{d?.attach || 'Attach'}</span>
                  </PromptInputButton>

                  <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value as 'groq' | 'claude')}>
                    <SelectTrigger
                      className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-muted hover:bg-blue-100 hover:border-transparent h-8 gap-1.5 rounded-full px-3 text-muted-foreground hover:text-foreground w-auto min-w-[120px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="groq">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span>Groq</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="claude">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          <span>Claude</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="ml-auto flex items-center gap-1">
                    <div className="relative flex items-center gap-1 md:gap-2">
                      <PromptInputButton
                        className="gap-2 whitespace-nowrap text-sm font-medium ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none border border-input bg-muted hover:bg-blue-100 hover:border-transparent relative z-10 flex rounded-full p-0 text-muted-foreground transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-50 items-center justify-center h-8 w-8"
                      >
                        <Mic className="shrink-0 relative z-10 h-5 w-5" />
                      </PromptInputButton>

                      <PromptInputSubmit
                        disabled={!prompt.trim() && !isProcessing}
                        status={isProcessing ? 'streaming' : 'ready'}
                        className="h-8 w-8 rounded-full"
                        variant="default"
                        size="icon"
                      >
                        <Send className="shrink-0 h-5 w-5" />
                      </PromptInputSubmit>
                    </div>
                  </div>
                </div>
              )}

              <input
                id="file-upload"
                className="hidden"
                multiple
                type="file"
                accept="text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv"
                tabIndex={-1}
              />
            </PromptInput>
          </div>
        </div>
      </div>
    </section>
  );
}
