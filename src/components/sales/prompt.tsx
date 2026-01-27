/**
 * Full-screen prompt component for Leads
 */

"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import AgentHeading from "@/components/atom/agent-heading"
import { AIResponseDisplay } from "@/components/atom/ai-response-display"
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
  type PromptInputMessage,
} from "@/components/atom/prompt-input"
import {
  AIBrainIcon,
  AILogoIcon,
  AttachIcon,
  PlusIcon,
  SendUpIcon,
  VoiceIcon,
} from "@/components/icons"

import { createLead, extractLeadsFromText } from "./actions"

interface SalesPromptProps {
  onLeadsCreated?: (count: number) => void
}

export default function SalesPrompt({ onLeadsCreated }: SalesPromptProps) {
  const [prompt, setPrompt] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedModel, setSelectedModel] = useState<"groq" | "claude">("groq")
  const [hasInteracted, setHasInteracted] = useState(false)
  const [aiResponse, setAiResponse] = useState("")
  const [aiReasoning, setAiReasoning] = useState("")
  const [leadsGenerated, setLeadsGenerated] = useState(0)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const { toast } = useToast()

  console.log("🎯 [SalesPrompt] Component rendered")
  console.log("🤖 [SalesPrompt] Selected model:", selectedModel)

  const handleRefresh = () => {
    if (onLeadsCreated) {
      onLeadsCreated(leadsGenerated)
    }
    window.location.reload()
  }

  const handleSubmit = async (message: PromptInputMessage) => {
    console.log("📥 [SalesPrompt.handleSubmit] Called with message:", {
      hasText: !!message.text?.trim(),
      textLength: message.text?.length || 0,
      filesCount: message.files?.length || 0,
    })

    if (!message.text?.trim() && !message.files?.length) {
      console.log(
        "⚠️ [SalesPrompt.handleSubmit] No text or files provided, aborting"
      )
      return
    }

    console.log("🚀 [SalesPrompt.handleSubmit] Starting import process...")

    setHasInteracted(true)
    setIsProcessing(true)

    if (message.text?.trim()) {
      setAiReasoning(`## Lead Extraction Process

1. **Analyzing Input**: Parsing the provided text to identify potential leads
2. **Data Extraction**: Using ${selectedModel === "groq" ? "Groq" : "Claude"} model to extract relevant information
3. **Validation**: Ensuring all extracted leads have valid contact information
4. **Enrichment**: Adding scores and metadata to prioritize leads
5. **Deduplication**: Removing any duplicate entries to maintain data quality`)
    } else {
      setAiReasoning("")
    }

    let leadsCreated = 0

    try {
      if (message.text?.trim()) {
        console.log("📝 [SalesPrompt.handleSubmit] Processing text input")
        toast({
          title: "Processing",
          description: "Extracting leads from text...",
        })

        const result = await extractLeadsFromText({
          rawText: message.text,
          source: "web",
          model: selectedModel,
          options: {
            autoScore: true,
            detectDuplicates: true,
            enrichWithAI: false,
          },
        })

        if (result.success && result.data) {
          const extractedCount = result.data.leads?.length || 0
          leadsCreated += extractedCount
          setLeadsGenerated(extractedCount)

          const leadsList = result.data.leads
            ?.map(
              (lead, idx) =>
                `${idx + 1}. **${lead.name}** - ${lead.company || "N/A"} (${lead.email || "No email"})`
            )
            .join("\n")

          setAiResponse(`## Lead Extraction Results

Successfully extracted **${extractedCount} leads** from your input.

### Extracted Leads:
${leadsList || "No leads found"}

### Actions Available:
- Click **Refresh Table** below to view the new leads
- Continue adding more leads using the input
- Export leads when ready`)

          if (onLeadsCreated) {
            onLeadsCreated(extractedCount)
          }
        } else {
          console.error("❌ [SalesPrompt.handleSubmit] Text extraction failed")
          setAiResponse(`## Extraction Failed

Unable to extract leads from the provided input.

### Error Details:
Unknown error occurred

### Suggestions:
- Ensure your input contains valid contact information
- Try using a different format or structure
- Check for any formatting issues in your data`)
        }
      }

      if (message.files?.length) {
        console.log(
          "📁 [SalesPrompt.handleSubmit] Processing",
          message.files.length,
          "file(s)"
        )
        toast({
          title: "Importing",
          description: `Processing ${message.files.length} file(s)...`,
        })

        for (let i = 0; i < message.files.length; i++) {
          const file = message.files[i]
          const response = await fetch(file.url!)
          const text = await response.text()

          const imported = await processCSVContent(text)
          leadsCreated += imported
        }

        setLeadsGenerated((prev) => prev + leadsCreated)

        if (onLeadsCreated) {
          onLeadsCreated(leadsCreated)
        }
      }

      console.log(
        `🎯 [SalesPrompt.handleSubmit] FINAL RESULT: Total leads created: ${leadsCreated}`
      )

      if (leadsCreated > 0) {
        toast({
          title: "Success!",
          description: `Successfully imported ${leadsCreated} new leads. Click "Refresh Table" to view them.`,
        })

        console.log(
          "✋ [SalesPrompt.handleSubmit] Waiting for user action to refresh..."
        )
      } else {
        console.log("⚠️ [SalesPrompt.handleSubmit] No leads were created")
        if (!aiResponse) {
          setAiResponse(`## No Leads Found

No valid leads could be extracted from your input.

### Tips for Better Results:
- Include clear contact information (names, emails, companies)
- Use structured formats like CSV or lists
- Provide more detailed descriptions of your target audience`)
        }
      }
    } catch (error) {
      console.error(
        "❌ [SalesPrompt.handleSubmit] Error processing prompt:",
        error
      )
      setAiResponse(`## Error Occurred

An error occurred while processing your request. Please try again.`)
    } finally {
      console.log(
        "🏁 [SalesPrompt.handleSubmit] Cleanup: resetting processing state"
      )
      setIsProcessing(false)
      setPrompt("")
    }
  }

  const processCSVContent = async (csvText: string): Promise<number> => {
    const lines = csvText.split("\n").filter((line) => line.trim())
    if (lines.length === 0) return 0

    const headers = lines[0]
      .toLowerCase()
      .split(",")
      .map((h) => h.trim())
    let created = 0

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim())

      if (values.length !== headers.length) continue

      const leadData: Record<string, unknown> = {
        status: "NEW",
        source: "IMPORT",
        score: Math.floor(Math.random() * 30) + 70,
        leadType: "SCHOOL",
        priority: "MEDIUM",
        verified: false,
        tags: [],
      }

      headers.forEach((header, index) => {
        if (header === "name") leadData.name = values[index]
        if (header === "email") leadData.email = values[index]
        if (header === "company") leadData.company = values[index]
        if (header === "phone") leadData.phone = values[index]
        if (header === "website") leadData.website = values[index]
      })

      if (leadData.name || leadData.email) {
        const result = await createLead(
          leadData as Parameters<typeof createLead>[0]
        )
        if (result.success) created++
      }
    }

    return created
  }

  return (
    <section
      className="from-background to-muted/20 flex h-screen flex-col bg-gradient-to-b"
      suppressHydrationWarning
    >
      <div
        className="container mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center px-4"
        suppressHydrationWarning
      >
        <div className="flex w-full flex-1 flex-col items-center justify-center text-center">
          {!hasInteracted && (
            <div className="mb-8">
              <AgentHeading
                title="Lead Agent"
                scrollTarget="sales-content"
                scrollText="explore existing leads"
              />
            </div>
          )}

          {hasInteracted && (
            <div
              id="ai-response-container"
              className={cn(
                "relative w-full max-w-3xl flex-1 space-y-4 overflow-x-hidden overflow-y-auto rounded-lg",
                isInputFocused ? "max-h-[200px]" : "max-h-[500px]"
              )}
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(155, 155, 155, 0.2) transparent",
              }}
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
                <div className="flex justify-center gap-4">
                  <Button onClick={handleRefresh} className="gap-2" size="lg">
                    <RefreshCw className="h-4 w-4" />
                    Refresh Table ({leadsGenerated} new leads)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setHasInteracted(false)
                      setAiResponse("")
                      setAiReasoning("")
                      setLeadsGenerated(0)
                    }}
                  >
                    Start New
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="relative w-full max-w-3xl">
            <PromptInput
              onSubmit={handleSubmit}
              className={cn(
                "group border-muted-foreground/10 bg-muted focus-within:border-foreground/20 hover:border-foreground/10 focus-within:hover:border-foreground/20 flex w-full gap-2 rounded-[2rem] border text-base shadow-sm transition-all duration-300 ease-in-out",
                hasInteracted && !isInputFocused
                  ? "h-14 items-center p-2"
                  : "flex-col p-3"
              )}
              multiple
              accept="text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv"
              maxFiles={5}
              maxFileSize={5 * 1024 * 1024}
            >
              <div
                className={cn(
                  "relative flex items-center",
                  hasInteracted && !isInputFocused ? "flex-1 gap-2" : "flex-1"
                )}
              >
                {hasInteracted && !isInputFocused && (
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger className="bg-muted h-8 w-8 rounded-full p-0 hover:bg-blue-100">
                      <PlusIcon className="h-5 w-5" />
                    </PromptInputActionMenuTrigger>
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments label="Upload CSV or Excel file" />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>
                )}

                <PromptInputAttachments>
                  {(attachment) => <PromptInputAttachment data={attachment} />}
                </PromptInputAttachments>

                <PromptInputTextarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder={
                    hasInteracted && !isInputFocused
                      ? "Add more leads..."
                      : "Describe your target audience..."
                  }
                  className={cn(
                    "ring-offset-background placeholder:text-muted-foreground flex w-full flex-1 resize-none rounded-md bg-transparent text-[16px] focus:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                    hasInteracted && !isInputFocused
                      ? "max-h-[40px] !px-2 py-0 leading-[40px]"
                      : "max-h-[200px] !px-0 py-2 leading-snug"
                  )}
                  style={
                    hasInteracted && !isInputFocused
                      ? { height: "40px" }
                      : { minHeight: "80px", height: "80px" }
                  }
                />

                {hasInteracted && !isInputFocused && (
                  <div className="flex items-center gap-1">
                    <PromptInputButton className="bg-muted h-8 w-8 rounded-full hover:bg-blue-100">
                      <VoiceIcon className="h-5 w-5" />
                    </PromptInputButton>

                    <PromptInputSubmit
                      disabled={!prompt.trim() && !isProcessing}
                      status={isProcessing ? "streaming" : "ready"}
                      className="h-8 w-8 rounded-full"
                      variant="default"
                      size="icon"
                    >
                      <SendUpIcon className="h-5 w-5" />
                    </PromptInputSubmit>
                  </div>
                )}
              </div>

              {(!hasInteracted || isInputFocused) && (
                <div className="flex flex-wrap items-center gap-1">
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger className="focus-visible:ring-ring border-input bg-muted text-muted-foreground hover:text-foreground inline-flex h-8 w-8 items-center justify-center gap-1.5 rounded-full border p-0 text-sm font-medium whitespace-nowrap transition-colors duration-100 ease-in-out hover:border-transparent hover:bg-blue-100 focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50">
                      <PlusIcon className="text-muted-foreground h-5 w-5 shrink-0" />
                    </PromptInputActionMenuTrigger>
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments label="Upload CSV or Excel file" />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>

                  <PromptInputButton
                    className="focus-visible:ring-ring border-input bg-muted text-muted-foreground hover:text-foreground inline-flex h-8 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-100 ease-in-out hover:border-transparent hover:bg-blue-100 focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    <AttachIcon className="h-4 w-4 shrink-0" />
                    <span className="hidden md:flex">Attach</span>
                  </PromptInputButton>

                  <Select
                    value={selectedModel}
                    onValueChange={(value) =>
                      setSelectedModel(value as "groq" | "claude")
                    }
                  >
                    <SelectTrigger className="focus-visible:ring-ring border-input bg-muted text-muted-foreground hover:text-foreground inline-flex h-8 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-100 ease-in-out hover:border-transparent hover:bg-blue-100 focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50">
                      <div className="flex items-center gap-1.5">
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="groq">
                        <div className="flex items-center gap-2">
                          <AILogoIcon className="h-4 w-4" />
                          <span>Groq</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="claude">
                        <div className="flex items-center gap-2">
                          <AIBrainIcon className="h-4 w-4" />
                          <span>Claude</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="ml-auto flex items-center gap-1">
                    <div className="relative flex items-center gap-1 md:gap-2">
                      <PromptInputButton className="focus-visible:ring-ring border-input bg-muted text-muted-foreground relative z-10 flex h-8 w-8 items-center justify-center gap-2 rounded-full border p-0 text-sm font-medium whitespace-nowrap transition-opacity duration-150 ease-in-out hover:border-transparent hover:bg-blue-100 focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50">
                        <VoiceIcon className="relative z-10 h-5 w-5 shrink-0" />
                      </PromptInputButton>

                      <PromptInputSubmit
                        disabled={!prompt.trim() && !isProcessing}
                        status={isProcessing ? "streaming" : "ready"}
                        className="h-8 w-8 rounded-full"
                        variant="default"
                        size="icon"
                      >
                        <SendUpIcon className="h-5 w-5 shrink-0" />
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
  )
}
