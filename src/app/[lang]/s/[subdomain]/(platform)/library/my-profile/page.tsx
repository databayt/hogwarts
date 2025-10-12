import { Metadata } from "next";
import LibraryMyProfileContent from "@/components/library/my-profile/content";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ subdomain: string; lang: Locale }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return {
    title: dictionary.school.library.myProfile || "My Library Profile",
    description: "View your borrowed books and library activity",
  };
}

export default async function LibraryMyProfile({ params }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  return <LibraryMyProfileContent userId={session.user.id} />;
}
