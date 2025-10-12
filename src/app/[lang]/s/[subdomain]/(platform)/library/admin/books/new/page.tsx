import LibraryAdminBooksNewContent from "@/components/library/admin/books/new-content";
import { auth } from "@/auth";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Add New Book - Library Admin",
  description: "Create a new book entry in the library",
};

export default async function LibraryAdminBooksNew() {
  const session = await auth();

  // TODO: Check if user has admin role when integrating with main project
  if (!session?.user?.id) {
    notFound();
  }

  return <LibraryAdminBooksNewContent />;
}
