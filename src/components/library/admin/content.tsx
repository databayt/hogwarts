import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { type Locale } from "@/components/internationalization/config";

interface LibraryAdminContentProps {
  dictionary: any;
  lang: Locale;
}

export default async function LibraryAdminContent({
  dictionary,
  lang,
}: LibraryAdminContentProps) {
  const { schoolId } = await getTenantContext();
  const t = dictionary.school;

  if (!schoolId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="mb-4">{t.library.messages.schoolContextNotFound}</h2>
        <p className="muted">
          {t.common.messages.errorOccurred}
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
        <h1 className="library-admin-title">{t.library.admin.dashboard}</h1>
        <Button asChild>
          <Link href="/library/admin/books/new">+ {t.library.admin.addBook}</Link>
        </Button>
      </div>

      {/* Statistics Grid */}
      <div className="library-admin-stats-grid">
        <div className="library-admin-stat-card">
          <h3 className="library-admin-stat-label">{t.library.admin.totalBooks}</h3>
          <p className="library-admin-stat-value">{totalBooks}</p>
        </div>

        <div className="library-admin-stat-card">
          <h3 className="library-admin-stat-label">{t.library.admin.totalBorrows}</h3>
          <p className="library-admin-stat-value">{totalBorrows}</p>
        </div>

        <div className="library-admin-stat-card">
          <h3 className="library-admin-stat-label">{t.library.admin.activeBorrows}</h3>
          <p className="library-admin-stat-value">{activeBorrows}</p>
        </div>

        <div className="library-admin-stat-card">
          <h3 className="library-admin-stat-label">{t.library.admin.overdueBooks}</h3>
          <p className="library-admin-stat-value text-destructive">{overdueBooks}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="library-admin-actions">
        <h4 className="mb-4">{t.library.admin.quickActions}</h4>
        <div className="library-admin-actions-grid">
          <Button asChild variant="outline" className="w-full">
            <Link href="/library/admin/books">{t.library.admin.viewAllBooks}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/library/admin/books/new">{t.library.admin.addBook}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
