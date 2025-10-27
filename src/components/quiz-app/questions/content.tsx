import QuestionsInteractive from "./interactive";
import type { Question } from "../types";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  questions: Question[];
  limit: number;
  category: string;
  lang: Locale;
}

export default function QuestionsContent(props: Props) {
  return (
    <QuestionsInteractive
      questions={props.questions}
      limit={props.limit}
      category={props.category}
      lang={props.lang}
    />
  );
}
