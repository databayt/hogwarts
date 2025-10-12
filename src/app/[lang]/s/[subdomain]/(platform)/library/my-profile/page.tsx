import LibraryMyProfileContent from "@/components/library/my-profile/content";
import { auth } from "@/auth";
import { notFound } from "next/navigation";

export const metadata = {
  title: "My Library Profile",
  description: "View your borrowed books and library activity",
};

export default async function LibraryMyProfile() {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  return <LibraryMyProfileContent userId={session.user.id} />;
}
