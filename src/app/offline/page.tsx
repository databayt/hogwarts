import { OfflineContent } from '@/components/offline/content';
import { getDictionary } from '@/components/internationalization/dictionaries';
import { i18n } from '@/components/internationalization/config';

// Note: This page is intentionally outside [lang] folder as it's a special offline fallback
// We use the default locale for consistency
export default async function Offline() {
  const dictionary = await getDictionary(i18n.defaultLocale);

  return <OfflineContent dictionary={dictionary} lang={i18n.defaultLocale} />;
}