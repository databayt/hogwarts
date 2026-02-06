"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Sparkles, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface AiPromptInputProps {
  onSubmit: (prompt: string) => void | Promise<void>
  placeholder?: string
  suggestions?: string[]
  templates?: { label: string; prompt: string }[]
  maxLength?: number
  disabled?: boolean
  loading?: boolean
  className?: string
  showModelSelector?: boolean
  model?: string
  onModelChange?: (model: string) => void
}

export function AiPromptInput({
  onSubmit,
  placeholder = "Enter your prompt...",
  suggestions = [],
  templates = [],
  maxLength = 2000,
  disabled = false,
  loading = false,
  className,
  showModelSelector = false,
  model,
  onModelChange,
}: AiPromptInputProps) {
  const [prompt, setPrompt] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [prompt])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!prompt.trim() || loading || disabled) return

    await onSubmit(prompt)
    setPrompt("")
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion)
    setShowSuggestions(false)
    textareaRef.current?.focus()
  }

  const handleTemplateClick = (template: string) => {
    setPrompt(template)
    setShowTemplates(false)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={cn("relative w-full space-y-2", className)}>
      {/* Templates */}
      {templates.length > 0 && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-xs"
          >
            <Sparkles className="me-1 h-3 w-3" />
            Templates
          </Button>
        </div>
      )}

      {showTemplates && templates.length > 0 && (
        <Card className="absolute bottom-full z-10 mb-2 max-h-48 w-full overflow-y-auto p-2">
          <div className="space-y-1">
            {templates.map((template, i) => (
              <button
                key={i}
                onClick={() => handleTemplateClick(template.prompt)}
                className="hover:bg-muted w-full rounded p-2 text-start text-sm transition-colors"
              >
                <div className="font-medium">{template.label}</div>
                <div className="text-muted-foreground truncate text-xs">
                  {template.prompt}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Main Input Area */}
      <form onSubmit={handleSubmit} className="relative">
        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled || loading}
          className={cn(
            "min-h-[80px] resize-none pe-12",
            "focus:ring-primary/20 focus:ring-2",
            loading && "opacity-50"
          )}
        />

        {/* Character count */}
        {maxLength && (
          <div className="text-muted-foreground absolute bottom-2 left-2 text-xs">
            {prompt.length}/{maxLength}
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          size="icon"
          disabled={!prompt.trim() || loading || disabled}
          className="absolute right-2 bottom-2 h-8 w-8"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full z-10 mt-2 w-full p-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">
              Suggestions
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={() => setShowSuggestions(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="hover:bg-secondary/80 cursor-pointer transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Model indicator */}
      {showModelSelector && model && (
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>Model: {model}</span>
        </div>
      )}
    </div>
  )
}
