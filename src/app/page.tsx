import { redirect } from 'next/navigation';
import { getLocale } from '@/components/internationalization/locale';

export default async function RootPage() {
  const locale = await getLocale();
  redirect(`/${locale}`);
}