import LibraryBookDetailContent from "@/components/library/book-detail/content";
import { auth } from "@/auth";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LibraryBookDetail({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  return <LibraryBookDetailContent bookId={id} userId={session.user.id} />;
}
