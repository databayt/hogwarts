import type { Metadata } from "next";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata: Metadata = {
  title: "Sales | Import",
  description: "Import leads from CSV or Excel",
};

interface Props {
  params: Promise<{ lang: Locale }>;
}

export default async function SalesImport({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  const d = dictionary?.sales;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h2 className="text-lg font-medium text-muted-foreground">
        {lang === "ar" ? "استيراد العملاء المحتملين" : "Import Leads"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {lang === "ar"
          ? "قم باستيراد العملاء المحتملين من ملف CSV أو Excel"
          : "Import leads from CSV or Excel files"}
      </p>
    </div>
  );
}
