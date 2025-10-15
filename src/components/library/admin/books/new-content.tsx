import { getTenantContext } from "@/lib/tenant-context";
import BookForm from "./book-form";
import { type Locale } from "@/components/internationalization/config";

interface LibraryAdminBooksNewContentProps {
  dictionary: any;
  lang: Locale;
}

export default async function LibraryAdminBooksNewContent({
  dictionary,
  lang,
}: LibraryAdminBooksNewContentProps) {
  const { schoolId } = await getTenantContext();
  const t = dictionary.school;

  if (!schoolId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="mb-4">{t.library.messages.schoolContextNotFound}</h2>
        <p className="muted">
          {t.common.messages.errorOccurred}
        </p>
      </div>
    );
  }

  return (
    <div className="library-admin-new-book-container">
      <h1 className="library-admin-new-book-title">{t.library.admin.addBook}</h1>
      <BookForm schoolId={schoolId} dictionary={dictionary} lang={lang} />
    </div>
  );
}
