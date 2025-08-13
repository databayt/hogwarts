import Link from "next/link";

export function DashboardHeader() {
    return (
    <div className="flex items-center gap-4 mb-6">
      <Link
        href="/invoice/list"
        className="text-sm font-medium text-primary hover:underline"
      >
        List
      </Link>
      <Link
        href="/invoice/settings"
        className="text-sm font-medium text-primary hover:underline"
      >
        Settings
      </Link>
    </div>
  );
}