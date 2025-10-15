import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BookTableActions from "./book-table-actions";
import { type Locale } from "@/components/internationalization/config";

interface LibraryAdminBooksContentProps {
  dictionary: any;
  lang: Locale;
}

export default async function LibraryAdminBooksContent({
  dictionary,
  lang,
}: LibraryAdminBooksContentProps) {
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

  const books = await db.book.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="library-admin-books-container">
      <div className="library-admin-books-header">
        <h2 className="library-admin-books-title">{t.library.admin.allBooks}</h2>
        <Button asChild>
          <Link href="/library/admin/books/new">+ {t.library.admin.createNewBook}</Link>
        </Button>
      </div>

      <div className="library-admin-books-table-wrapper">
        {books.length === 0 ? (
          <div className="library-admin-books-empty">
            <p>{t.library.admin.noBooks}</p>
            <Button asChild className="mt-4">
              <Link href="/library/admin/books/new">{t.library.admin.addFirstBook}</Link>
            </Button>
          </div>
        ) : (
          <table className="library-admin-books-table">
            <thead>
              <tr>
                <th>{t.library.admin.bookTitle}</th>
                <th>{t.library.admin.bookAuthor}</th>
                <th>{t.library.admin.bookGenre}</th>
                <th>{t.library.admin.totalCopies}</th>
                <th>{t.library.available}</th>
                <th>{t.library.rating}</th>
                <th>{t.library.admin.actions}</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td><strong>{book.title}</strong></td>
                  <td>{book.author}</td>
                  <td>{book.genre}</td>
                  <td>{book.totalCopies}</td>
                  <td>{book.availableCopies}</td>
                  <td>⭐ {book.rating}/5</td>
                  <td>
                    <BookTableActions bookId={book.id} schoolId={schoolId} dictionary={dictionary} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
