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
import "../globals.css";
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
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  const config = localeConfig[lang];

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
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const session = await auth();
  const config = localeConfig[lang];
  const isRTL = config.dir === 'rtl';

  // Check if we're in a subdomain route
  // The middleware sets x-subdomain header for subdomain routes
  const headersList = await headers();
  const subdomain = headersList.get("x-subdomain");
  const isSubdomain = !!subdomain; // True if x-subdomain header exists

  // Use dynamic font (font-sans) for subdomain pages to allow theme system to work
  // Use hardcoded fonts for marketing/dashboard pages
  const fontClass = isSubdomain
    ? 'font-sans'
    : (isRTL ? tajawal.className : GeistSans.className);

  return (
    <html lang={lang} dir={config.dir} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'system';
                const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Restore custom theme CSS variables before React hydration to prevent flicker
                const root = document.documentElement;
                const mode = root.classList.contains('dark') ? 'dark' : 'light';

                // Try to get theme from Zustand store first
                let themeStyles = null;
                const editorStorage = localStorage.getItem('theme-editor-storage');

                if (editorStorage) {
                  try {
                    const parsed = JSON.parse(editorStorage);
                    if (parsed?.state?.themeState?.styles?.[mode]) {
                      themeStyles = parsed.state.themeState.styles[mode];
                    }
                  } catch (e) {}
                }

                // Fallback to simple theme storage
                if (!themeStyles) {
                  const simpleTheme = localStorage.getItem('user-theme-styles');
                  if (simpleTheme) {
                    try {
                      themeStyles = JSON.parse(simpleTheme);
                    } catch (e) {}
                  }
                }

                // Apply theme styles as CSS variables
                if (themeStyles && typeof themeStyles === 'object') {
                  Object.entries(themeStyles).forEach(([key, value]) => {
                    if (value && typeof value === 'string') {
                      // Direct mapping - key is the CSS variable name
                      root.style.setProperty('--' + key, value);
                    }
                  });
                }
              } catch (e) {
                // Silently fail to avoid breaking the page
              }
            `,
          }}
        />
      </head>
      <body
        className={`${fontClass} ${GeistSans.variable} ${tajawal.variable} antialiased layout-container`}
      >
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
      </body>
    </html>
  );
}

// Generate static params for all supported locales
export function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}