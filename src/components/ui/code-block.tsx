"use client"

import { CodeBlockWrapper } from "@/components/docs/code-block-wrapper"

interface CodeBlockProps {
  language: string;
  value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
  return (
    <CodeBlockWrapper>
      <code className={`language-${language}`}>{value}</code>
    </CodeBlockWrapper>
  )
}
