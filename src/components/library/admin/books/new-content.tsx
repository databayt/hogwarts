import { getTenantContext } from "@/lib/tenant-context";
import BookForm from "./book-form";

export default async function LibraryAdminBooksNewContent() {
  const { schoolId } = await getTenantContext();

  if (!schoolId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-semibold mb-4">School context not found</h2>
        <p className="text-muted-foreground">
          Unable to create book. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="library-admin-new-book-container">
      <h1 className="library-admin-new-book-title">Add New Book</h1>
      <BookForm schoolId={schoolId} />
    </div>
  );
}
