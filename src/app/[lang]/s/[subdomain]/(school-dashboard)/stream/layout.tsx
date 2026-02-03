import { ReactNode } from "react"

interface StreamLayoutProps {
  children: ReactNode
}

export default function StreamLayout({ children }: StreamLayoutProps) {
  return <div className="min-h-screen">{children}</div>
}
