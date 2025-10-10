import { KanbanContent } from '@/components/operator/kanban/content';
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: 'Kanban',
  description: 'Project management kanban board'
};

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Kanban({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <KanbanContent dictionary={dictionary} lang={lang} />;
}
