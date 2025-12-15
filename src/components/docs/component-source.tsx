import * as React from "react"

import { highlightCode } from "@/lib/highlight-code"
import { cn } from "@/lib/utils"
import { CodeCollapsibleWrapper } from "@/components/docs/code-collapsible-wrapper"
import { CopyButton } from "@/components/docs/copy-button"

interface ComponentSourceProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  code?: string
  language?: string
  fileName?: string
  title?: string
  collapsible?: boolean
}

export async function ComponentSource({
  name,
  code: codeProp,
  language,
  fileName,
  title,
  collapsible = true,
  className,
  ...props
}: ComponentSourceProps) {
  let code = codeProp

  // If name provided but no code, we'd need a registry lookup
  // For now, just use the provided code
  if (!code) {
    return null
  }

  const lang = language ?? title?.split(".").pop() ?? "tsx"
  const highlightedCode = await highlightCode(code, lang)

  if (!collapsible) {
    return (
      <div className={cn("relative", className)} {...props}>
        <ComponentCode
          code={code}
          highlightedCode={highlightedCode}
          language={lang}
          title={title}
        />
      </div>
    )
  }

  return (
    <CodeCollapsibleWrapper className={className}>
      <ComponentCode
        code={code}
        highlightedCode={highlightedCode}
        language={lang}
        title={title}
      />
    </CodeCollapsibleWrapper>
  )
}

function ComponentCode({
  code,
  highlightedCode,
  language,
  title,
}: {
  code: string
  highlightedCode: string
  language: string
  title: string | undefined
}) {
  return (
    <figure data-rehype-pretty-code-figure="" className="[&>pre]:max-h-96">
      {title && (
        <figcaption
          data-rehype-pretty-code-title=""
          className="text-code-foreground [&_svg]:text-code-foreground flex items-center gap-2 [&_svg]:size-4 [&_svg]:opacity-70"
          data-language={language}
        >
          {title}
        </figcaption>
      )}
      <CopyButton value={code} />
      <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
    </figure>
  )
}
