"use client"

interface AgentHeadingProps {
  title: string
  scrollTarget?: string
  scrollText?: string
}

export default function AgentHeading({
  title,
  scrollTarget = "content",
  scrollText = "explore existing data",
}: AgentHeadingProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-lg">
        Process data, or{" "}
        <button
          onClick={() => {
            document.getElementById(scrollTarget)?.scrollIntoView({
              behavior: "smooth",
            })
          }}
          className="text-primary inline hover:underline"
        >
          {scrollText} →
        </button>
      </p>
    </div>
  )
}
