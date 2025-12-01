import { Metadata } from "next";
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return {
    title: `${dictionary.school.announcements.navConfig} - ${dictionary.school.announcements.title}`,
    description: dictionary.school.announcements.description,
  };
}

export default async function AnnouncementsConfigPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.announcements

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {d?.navConfig || 'Config'}
        </CardTitle>
        <CardDescription>
          {lang === 'ar' ? 'إعدادات الإعلانات والتفضيلات' : 'Announcement settings and preferences'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          {lang === 'ar'
            ? 'سيتم إضافة إعدادات الإعلانات هنا قريباً - إعدادات الإشعارات، القوالب، وقواعد النشر الافتراضية.'
            : 'Announcement configuration options coming soon - notification settings, templates, and default publishing rules.'}
        </p>
      </CardContent>
    </Card>
  )
}
