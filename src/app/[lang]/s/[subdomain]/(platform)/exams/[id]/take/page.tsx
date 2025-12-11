import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import { getExamForTaking } from "@/components/platform/exams/manage/actions";
import { ExamTakingContent } from "@/components/platform/exams/take/content";
import { Skeleton } from "@/components/ui/skeleton";

interface TakeExamPageProps {
  params: Promise<{
    lang: Locale;
    id: string;
  }>;
}

export default async function TakeExamPage({ params }: TakeExamPageProps) {
  const { lang, id } = await params;
  const dictionary = await getDictionary(lang);

  const result = await getExamForTaking(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const { exam, questions, existingAnswers } = result.data;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ExamTakingContent
        exam={exam}
        questions={questions}
        existingAnswers={existingAnswers}
        dictionary={dictionary}
      />
    </Suspense>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Skeleton className="h-12 w-1/3" />
      <Skeleton className="h-6 w-1/2" />
      <div className="grid gap-4 mt-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  );
}
