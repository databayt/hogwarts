"use client"

import React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { Prompt } from "./prompt-types"

interface PromptCardProps {
  prompt: Prompt
}

export function PromptCard({ prompt }: PromptCardProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  React.useEffect(() => {
    if (hasCopied) {
      const timeout = setTimeout(() => {
        setHasCopied(false)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [hasCopied])

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content)
    setHasCopied(true)
  }

  return (
    <Card id={prompt.id} className="scroll-mt-20">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {prompt.name}
              {prompt.source === "command" && (
                <Badge variant="secondary">Command</Badge>
              )}
              {prompt.source === "agent" && (
                <Badge variant="outline">Agent</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-2">
              {prompt.description}
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="shrink-0"
            title="Copy prompt to clipboard"
          >
            {hasCopied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            <span className="sr-only">Copy prompt</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Variables */}
        {prompt.variables.length > 0 && (
          <div>
            <h4>Variables</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {prompt.variables.map((variable) => (
                <code
                  key={variable}
                  className="bg-muted rounded px-2 py-1 font-mono text-sm"
                >
                  {variable}
                </code>
              ))}
            </div>
          </div>
        )}

        {/* Usage Example */}
        {prompt.usageExample && (
          <div>
            <h4>Usage Example</h4>
            <pre className="bg-muted mt-2 overflow-x-auto rounded-lg p-4">
              <code className="text-sm">{prompt.usageExample}</code>
            </pre>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {prompt.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface PromptSectionProps {
  category: string
  prompts: Prompt[]
}

export function PromptSection({ category, prompts }: PromptSectionProps) {
  return (
    <section id={category.toLowerCase()} className="scroll-mt-20">
      <h2>{category}</h2>
      <div className="mt-6 space-y-4">
        {prompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </div>
    </section>
  )
}
