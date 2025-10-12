import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function LibraryAdminContent() {
  const { schoolId } = await getTenantContext();

  if (!schoolId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-semibold mb-4">School context not found</h2>
        <p className="text-muted-foreground">
          Unable to load admin dashboard. Please contact support.
        </p>
      </div>
    );
  }

  // Fetch statistics
  const [totalBooks, totalBorrows, activeBorrows, overdueBooks] = await Promise.all([
    db.book.count({ where: { schoolId } }),
    db.borrowRecord.count({ where: { schoolId } }),
    db.borrowRecord.count({
      where: { schoolId, status: "BORROWED" },
    }),
    db.borrowRecord.count({
      where: {
        schoolId,
        status: "BORROWED",
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  return (
    <div className="library-admin-container">
      <div className="library-admin-header">
        <h1 className="library-admin-title">Library Admin Dashboard</h1>
        <Button asChild>
          <Link href="/library/admin/books/new">+ Add New Book</Link>
        </Button>
      </div>

      {/* Statistics Grid */}
      <div className="library-admin-stats-grid">
        <div className="library-admin-stat-card">
          <h3 className="library-admin-stat-label">Total Books</h3>
          <p className="library-admin-stat-value">{totalBooks}</p>
        </div>

        <div className="library-admin-stat-card">
          <h3 className="library-admin-stat-label">Total Borrows</h3>
          <p className="library-admin-stat-value">{totalBorrows}</p>
        </div>

        <div className="library-admin-stat-card">
          <h3 className="library-admin-stat-label">Active Borrows</h3>
          <p className="library-admin-stat-value">{activeBorrows}</p>
        </div>

        <div className="library-admin-stat-card">
          <h3 className="library-admin-stat-label">Overdue Books</h3>
          <p className="library-admin-stat-value text-red-600">{overdueBooks}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="library-admin-actions">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="library-admin-actions-grid">
          <Button asChild variant="outline" className="w-full">
            <Link href="/library/admin/books">View All Books</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/library/admin/books/new">Add New Book</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
