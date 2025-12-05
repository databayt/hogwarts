import { KanbanContent } from '@/components/operator/kanban/content';
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import { PageHeadingSetter } from '@/components/platform/context/page-heading-setter';
import { PageNav, type PageNavItem } from '@/components/atom/page-nav';

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
  const d = dictionary?.operator;

  // Define kanban page navigation (linked with dashboard)
  const kanbanPages: PageNavItem[] = [
    { name: 'Overview', href: `/${lang}/dashboard` },
    { name: 'Analytics', href: `/${lang}/analytics` },
    { name: 'Kanban', href: `/${lang}/kanban` },
  ];

  return (
    <div className="space-y-6">
      <PageHeadingSetter title="Kanban" />
      <PageNav pages={kanbanPages} />
      <KanbanContent dictionary={dictionary} lang={lang} />
    </div>
  );
}
