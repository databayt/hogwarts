import { cn } from "@/lib/utils"

interface FeatureCardProps {
  number: string
  title: string
  description?: string
  className?: string
  variant?: "border" | "muted"
  borderColor?: string
  strokeColor?: string
}

export function FeatureCard({
  number,
  title,
  description,
  className,
  variant = "border",
  borderColor = "border-purple-500",
  strokeColor = "#a855f7",
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "flex aspect-auto flex-col justify-center rounded-2xl p-6",
        variant === "muted"
          ? "bg-muted"
          : cn("border bg-transparent", borderColor),
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
