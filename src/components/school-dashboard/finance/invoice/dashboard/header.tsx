import Link from "next/link"

export function DashboardHeader() {
  return (
    <div className="mb-6 flex items-center gap-4">
      <Link href="/invoice/list" className="muted text-primary hover:underline">
        List
      </Link>
      <Link
        href="/invoice/settings"
        className="muted text-primary hover:underline"
      >
        Settings
      </Link>
    </div>
  )
}
