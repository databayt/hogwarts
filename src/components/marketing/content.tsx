
import Hero from "./hero";
import type { getDictionary } from '@/components/internationalization/dictionaries';
import type { Locale } from '@/components/internationalization/config';

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
}

export default function HomeContent(props: Props) {
  const { dictionary, lang } = props;
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Hero dictionary={dictionary} lang={lang} />
    </main>
  );
}
