import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Tajawal } from "next/font/google";
import { type Locale, localeConfig, i18n } from "@/components/internationalization/config";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/atom/theme-provider";
import { UserThemeProvider } from "@/components/theme/theme-provider";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AnalyticsProvider } from "@/components/monitoring/analytics-provider";
import { ServiceWorkerProvider } from "@/components/providers/service-worker-provider";
import { headers } from "next/headers";
import "leaflet/dist/leaflet.css";

// Configure fonts
const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  variable: '--font-tajawal',
  weight: ['200', '300', '400', '500', '700', '800', '900'],
  display: 'swap'
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang as Locale);
  const config = localeConfig[lang as Locale];

  return {
    title: dictionary.metadata?.title || "Hogwarts - School Management System",
    description: dictionary.metadata?.description || "A comprehensive school management platform",
    other: {
      'accept-language': lang,
    },
    alternates: {
      languages: {
        'en': '/en',
        'ar': '/ar',
        'x-default': '/en',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  const config = localeConfig[lang as Locale];
  const isRTL = config.dir === 'rtl';

  // Check if we're in a subdomain route
  const headersList = await headers();
  const subdomain = headersList.get("x-subdomain");
  const isSubdomain = !!subdomain;

  // Use dynamic font for subdomain pages, hardcoded fonts for marketing/lab pages
  const fontClass = isSubdomain
    ? 'font-sans'
    : (isRTL ? tajawal.className : GeistSans.className);

  return (
    <div className={`${fontClass} ${GeistSans.variable} ${tajawal.variable} antialiased layout-container [--header-height:calc(var(--spacing)*14)] [--footer-height:calc(var(--spacing)*14)] xl:[--footer-height:calc(var(--spacing)*24)]`}>
      <SessionProvider session={session}>
        <NuqsAdapter>
          <ThemeProvider>
            <UserThemeProvider>
              {children}
              <Toaster />
              <AnalyticsProvider />
              <ServiceWorkerProvider />
            </UserThemeProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </SessionProvider>
    </div>
  );
}

// Generate static params for all supported locales
export function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}
