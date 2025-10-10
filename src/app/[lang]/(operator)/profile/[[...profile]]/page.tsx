import { ProfileContent } from '@/components/operator/profile/content';
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: 'Profile',
  description: 'User profile management'
};

interface Props {
  params: Promise<{ lang: Locale; profile?: string[] }>
}

export default async function Profile({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <ProfileContent dictionary={dictionary} lang={lang} />;
}
