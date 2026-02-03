import { Metadata } from "next"

import { AnthropicIcons } from "@/components/icons"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  getAnnouncementConfig,
  getAnnouncementTemplates,
} from "@/components/school-dashboard/listings/announcements/actions"
import { AnnouncementConfigForm } from "@/components/school-dashboard/listings/announcements/config-form"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: `${dictionary.school.announcements.navConfig} - ${dictionary.school.announcements.title}`,
    description: dictionary.school.announcements.description,
  }
}

export default async function AnnouncementsConfigPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.announcements

  // Fetch config and templates in parallel
  const [configResult, templatesResult] = await Promise.all([
    getAnnouncementConfig(),
    getAnnouncementTemplates(),
  ])

  // Handle errors
  if (!configResult.success) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">
          {lang === "ar" ? "فشل في تحميل الإعدادات" : "Failed to load settings"}
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          {configResult.error}
        </p>
      </div>
    )
  }

  const config = configResult.data
  const templates = templatesResult.success ? templatesResult.data : []

  // Dictionary for form labels (fallback to English)
  const configDictionary = {
    publishingDefaults: lang === "ar" ? "إعدادات النشر" : "Publishing Defaults",
    notifications: lang === "ar" ? "الإشعارات" : "Notifications",
    templates: lang === "ar" ? "القوالب" : "Templates",
    trackingRetention:
      lang === "ar" ? "التتبع والاحتفاظ" : "Tracking & Retention",
    defaultScope: lang === "ar" ? "النطاق الافتراضي" : "Default Scope",
    defaultPriority: lang === "ar" ? "الأولوية الافتراضية" : "Default Priority",
    autoPublish: lang === "ar" ? "النشر التلقائي" : "Auto-publish",
    autoPublishDesc:
      lang === "ar"
        ? "نشر الإعلانات الجديدة تلقائياً"
        : "Automatically publish new announcements",
    defaultExpiryDays:
      lang === "ar" ? "مدة الانتهاء (أيام)" : "Default Expiry (days)",
    emailOnPublish: lang === "ar" ? "البريد عند النشر" : "Email on Publish",
    emailOnPublishDesc:
      lang === "ar"
        ? "إرسال إشعار بريدي عند النشر"
        : "Send email notifications when published",
    pushNotifications: lang === "ar" ? "إشعارات الدفع" : "Push Notifications",
    pushNotificationsDesc:
      lang === "ar"
        ? "إرسال إشعارات دفع (قريباً)"
        : "Send push notifications (coming soon)",
    quietHoursStart: lang === "ar" ? "بداية ساعات الهدوء" : "Quiet Hours Start",
    quietHoursEnd: lang === "ar" ? "نهاية ساعات الهدوء" : "Quiet Hours End",
    digestFrequency: lang === "ar" ? "تكرار الملخص" : "Digest Frequency",
    defaultTemplate: lang === "ar" ? "القالب الافتراضي" : "Default Template",
    allowCustomTemplates:
      lang === "ar" ? "السماح بالقوالب المخصصة" : "Allow Custom Templates",
    allowCustomTemplatesDesc:
      lang === "ar"
        ? "السماح للمستخدمين بإنشاء قوالب مخصصة"
        : "Let users create custom announcement templates",
    readTracking: lang === "ar" ? "تتبع القراءة" : "Read Tracking",
    readTrackingDesc:
      lang === "ar"
        ? "تتبع قراءة المستخدمين للإعلانات"
        : "Track when users read announcements",
    retentionDays:
      lang === "ar" ? "فترة الاحتفاظ (أيام)" : "Retention Period (days)",
    autoArchive: lang === "ar" ? "الأرشفة التلقائية" : "Auto-archive",
    autoArchiveDesc:
      lang === "ar"
        ? "أرشفة الإعلانات المنتهية تلقائياً"
        : "Automatically archive expired announcements",
    archiveAfterDays:
      lang === "ar" ? "الأرشفة بعد (أيام)" : "Archive After (days)",
    saveChanges: lang === "ar" ? "حفظ التغييرات" : "Save Changes",
    saving: lang === "ar" ? "جاري الحفظ..." : "Saving...",
    saved:
      lang === "ar" ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully",
    saveFailed:
      lang === "ar" ? "فشل في حفظ الإعدادات" : "Failed to save settings",
    comingSoon: lang === "ar" ? "قريباً" : "Coming Soon",
    school: lang === "ar" ? "المدرسة" : "School",
    class: lang === "ar" ? "الفصل" : "Class",
    role: lang === "ar" ? "الدور" : "Role",
    low: lang === "ar" ? "منخفضة" : "Low",
    normal: lang === "ar" ? "عادية" : "Normal",
    high: lang === "ar" ? "عالية" : "High",
    urgent: lang === "ar" ? "عاجلة" : "Urgent",
    none: lang === "ar" ? "بدون" : "None",
    daily: lang === "ar" ? "يومي" : "Daily",
    weekly: lang === "ar" ? "أسبوعي" : "Weekly",
    noTemplate: lang === "ar" ? "بدون قالب افتراضي" : "No default template",
    templatesCount: lang === "ar" ? "قوالب متاحة" : "templates available",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-muted rounded-lg p-3">
          <AnthropicIcons.Gear className="text-muted-foreground h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {lang === "ar" ? "إعدادات الإعلانات" : "Announcement Settings"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {lang === "ar"
              ? "تكوين كيفية إنشاء الإعلانات وتسليمها"
              : "Configure how announcements are created and delivered"}
          </p>
        </div>
      </div>

      {/* Config Form */}
      <AnnouncementConfigForm
        initialConfig={config}
        templates={templates}
        dictionary={configDictionary}
      />
    </div>
  )
}
