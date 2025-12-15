import { ReactNode } from "react"
import Link from "next/link"

interface CardProps {
  id: string
  title: string
  description: string
  icon: ReactNode
  href: string
  className?: string
  iconSize?: string
}

export default function Card({
  id,
  title,
  description,
  icon,
  href,
  className = "",
  iconSize = "w-8 h-8",
}: CardProps) {
  return (
    <Link
      key={id}
      href={href}
      className={`bg-background hover:border-primary relative overflow-hidden rounded-lg border p-2 transition-[border-color] hover:text-current ${className}`}
    >
      <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
        <div className={iconSize}>{icon}</div>
        <div className="space-y-2">
          <h4 className="hover:text-current">{title}</h4>
          <p className="text-muted-foreground hover:text-muted-foreground text-sm">
            {description}
          </p>
        </div>
      </div>
    </Link>
  )
}
