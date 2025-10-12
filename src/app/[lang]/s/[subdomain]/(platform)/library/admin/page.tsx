import LibraryAdminContent from "@/components/library/admin/content";
import { auth } from "@/auth";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Library Admin Dashboard",
  description: "Manage library books and borrow records",
};

export default async function LibraryAdmin() {
  const session = await auth();

  // TODO: Check if user has admin role when integrating with main project
  if (!session?.user?.id) {
    notFound();
  }

  return <LibraryAdminContent />;
}
