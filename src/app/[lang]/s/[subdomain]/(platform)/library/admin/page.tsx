import { Metadata } from "next";
import LibraryAdminContent from "@/components/library/admin/content";
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
    title: dictionary.school.library.admin.dashboard || "Library Admin Dashboard",
    description: "Manage library books and borrow records",
  };
}

export default async function LibraryAdmin({ params }: Props) {
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

  return <LibraryAdminContent />;
}
