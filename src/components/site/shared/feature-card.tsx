import { cn } from "@/lib/utils"

interface FeatureCardProps {
  number: string
  title: string
  description?: string
  className?: string
  borderColor?: string
  strokeColor?: string
}

export function FeatureCard({
  number,
  title,
  description,
  className,
  borderColor = "border-purple-500",
  strokeColor = "#a855f7",
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "flex aspect-auto flex-col justify-center rounded-2xl border bg-transparent px-6 py-6",
        borderColor,
        className
      )}
    >
      <div className="flex flex-col space-y-3">
        <div
          className="text-5xl font-bold"
          style={{
            WebkitTextStroke: `2px ${strokeColor}`,
            color: "transparent",
          }}
        >
          {number}
        </div>
        <h3 className="min-h-[3.5rem] text-lg leading-7 font-semibold">
          {title}
        </h3>
        {description && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
