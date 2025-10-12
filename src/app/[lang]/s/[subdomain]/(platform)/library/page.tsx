import LibraryContent from "@/components/library/content";
import { auth } from "@/auth";

export const metadata = {
  title: "Library",
  description: "Browse and borrow books from the school library",
};

export default async function Library() {
  const session = await auth();

  return <LibraryContent userId={session?.user?.id as string} />;
}
