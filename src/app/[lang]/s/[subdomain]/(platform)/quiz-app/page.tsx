import QuizAppContent from "@/components/quiz-app/content";
import type { Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Quizy - Test Your Knowledge!",
  description: "A Quiz App built using Next JS",
};

export default async function QuizApp({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  return <QuizAppContent lang={lang} />;
}
