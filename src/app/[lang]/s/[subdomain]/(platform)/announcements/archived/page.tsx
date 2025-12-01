import { Metadata } from "next";
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive } from "lucide-react";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return {
    title: `${dictionary.school.announcements.navArchived} - ${dictionary.school.announcements.title}`,
    description: dictionary.school.announcements.description,
  };
}

export default async function AnnouncementsArchivedPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.announcements

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          {d?.navArchived || 'Archived'}
        </CardTitle>
        <CardDescription>
          {lang === 'ar' ? 'الإعلانات المؤرشفة والمنتهية الصلاحية' : 'Archived and expired announcements'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          {lang === 'ar'
            ? 'سيتم عرض الإعلانات المؤرشفة هنا قريباً - الإعلانات القديمة والمنتهية الصلاحية.'
            : 'Archived announcements coming soon - old and expired announcements will be displayed here.'}
        </p>
      </CardContent>
    </Card>
  )
}
