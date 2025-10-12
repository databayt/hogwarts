import { Metadata } from "next";
import LibraryAdminBooksContent from "@/components/library/admin/books/content";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
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
    title: dictionary.school.library.admin.manageBooks || "Manage Books - Library Admin",
    description: "View and manage all library books",
  };
}

export default async function LibraryAdminBooks({ params }: Props) {
  const session = await auth();

  // Check authentication
  if (!session?.user?.id) {
    notFound();
  }

  // Check if user has admin role
  const userRole = session.user.role;
  if (userRole !== "ADMIN" && userRole !== "DEVELOPER") {
    redirect("/library");
  }

  return <LibraryAdminBooksContent />;
}
