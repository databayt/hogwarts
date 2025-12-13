import DocumentsContent from "@/components/site/apply/documents/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Documents | Apply",
  description: "Upload required documents for your application.",
};

interface Props {
  params: Promise<{ lang: Locale }>;
}

export default async function DocumentsPage({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <DocumentsContent dictionary={dictionary} />;
}
