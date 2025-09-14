import { redirect } from 'next/navigation';
import { i18n } from '@/components/internationalization/config';

export default async function RootPage() {
  // Redirect to default locale
  redirect(`/${i18n.defaultLocale}`);
}