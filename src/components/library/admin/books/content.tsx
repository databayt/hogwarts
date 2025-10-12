import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BookTableActions from "./book-table-actions";

export default async function LibraryAdminBooksContent() {
  const { schoolId } = await getTenantContext();

  if (!schoolId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-semibold mb-4">School context not found</h2>
        <p className="text-muted-foreground">
          Unable to load books. Please contact support.
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
        <h2 className="library-admin-books-title">All Books</h2>
        <Button asChild>
          <Link href="/library/admin/books/new">+ Create a New Book</Link>
        </Button>
      </div>

      <div className="library-admin-books-table-wrapper">
        {books.length === 0 ? (
          <div className="library-admin-books-empty">
            <p>No books found. Create your first book!</p>
            <Button asChild className="mt-4">
              <Link href="/library/admin/books/new">Add Book</Link>
            </Button>
          </div>
        ) : (
          <table className="library-admin-books-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Genre</th>
                <th>Copies</th>
                <th>Available</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td className="font-medium">{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.genre}</td>
                  <td>{book.totalCopies}</td>
                  <td>{book.availableCopies}</td>
                  <td>⭐ {book.rating}/5</td>
                  <td>
                    <BookTableActions bookId={book.id} schoolId={schoolId} />
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
