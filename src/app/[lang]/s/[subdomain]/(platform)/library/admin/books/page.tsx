import LibraryAdminBooksContent from "@/components/library/admin/books/content";
import { auth } from "@/auth";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Manage Books - Library Admin",
  description: "View and manage all library books",
};

export default async function LibraryAdminBooks() {
  const session = await auth();

  // TODO: Check if user has admin role when integrating with main project
  if (!session?.user?.id) {
    notFound();
  }

  return <LibraryAdminBooksContent />;
}
