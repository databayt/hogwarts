import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  userId: string;
}

export default async function LibraryMyProfileContent({ userId }: Props) {
  const { schoolId } = await getTenantContext();

  if (!schoolId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="mb-4">School context not found</h2>
        <p className="muted">
          Unable to load profile. Please contact support.
        </p>
      </div>
    );
  }

  // Fetch user's borrow records
  const borrowRecords = await db.borrowRecord.findMany({
    where: {
      userId,
      schoolId,
    },
    include: {
      book: true,
    },
    orderBy: {
      borrowDate: "desc",
    },
    take: 50,
  });

  const activeBorrows = borrowRecords.filter(
    (record) => record.status === "BORROWED"
  );

  const borrowHistory = borrowRecords.filter(
    (record) => record.status === "RETURNED"
  );

  return (
    <div className="library-profile-container">
      <h1 className="library-profile-title">My Library Profile</h1>

      {/* Active Borrows Section */}
      <section className="library-profile-section">
        <h2 className="library-profile-section-title">
          Currently Borrowed ({activeBorrows.length})
        </h2>

        {activeBorrows.length === 0 ? (
          <p className="muted">
            You haven't borrowed any books yet
          </p>
        ) : (
          <div className="library-profile-grid">
            {activeBorrows.map((record) => (
              <div key={record.id} className="library-profile-card">
                <div className="library-profile-card-image">
                  <Image
                    src={record.book.coverUrl}
                    alt={record.book.title}
                    width={150}
                    height={225}
                    className="rounded"
                  />
                </div>

                <div className="library-profile-card-content">
                  <h5>{record.book.title}</h5>
                  <p className="muted">
                    by {record.book.author}
                  </p>

                  <div className="library-profile-card-meta">
                    <small>
                      <strong>Borrowed:</strong>{" "}
                      {new Date(record.borrowDate).toLocaleDateString()}
                    </small>
                    <small>
                      <strong>Due:</strong>{" "}
                      {new Date(record.dueDate).toLocaleDateString()}
                    </small>

                    {new Date(record.dueDate) < new Date() && (
                      <small className="text-destructive">
                        Overdue!
                      </small>
                    )}
                  </div>

                  <Button asChild size="sm" className="mt-2">
                    <Link href={`/library/books/${record.book.id}`}>
                      View Book
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Borrow History Section */}
      <section className="library-profile-section">
        <h2 className="library-profile-section-title">
          Borrow History ({borrowHistory.length})
        </h2>

        {borrowHistory.length === 0 ? (
          <p className="muted">No borrow history yet</p>
        ) : (
          <div className="library-profile-history">
            {borrowHistory.map((record) => (
              <div key={record.id} className="library-profile-history-item">
                <div className="library-profile-history-image">
                  <Image
                    src={record.book.coverUrl}
                    alt={record.book.title}
                    width={80}
                    height={120}
                    className="rounded"
                  />
                </div>

                <div className="library-profile-history-content">
                  <h6>{record.book.title}</h6>
                  <p className="muted">
                    by {record.book.author}
                  </p>

                  <div className="library-profile-history-dates">
                    <small className="muted">
                      Borrowed: {new Date(record.borrowDate).toLocaleDateString()}
                    </small>
                    <small className="muted">
                      Returned: {record.returnDate ? new Date(record.returnDate).toLocaleDateString() : "N/A"}
                    </small>
                  </div>
                </div>

                <Button asChild variant="outline" size="sm">
                  <Link href={`/library/books/${record.book.id}`}>
                    View
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
