import { Metadata } from "next";
import DashboardContent from "@/components/platform/dashboard/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  params: Promise<{ subdomain: string; lang: Locale }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { lang } = await params;
    const dictionary = await getDictionary(lang);

    return {
      title: dictionary?.school?.dashboard?.title || "Dashboard",
      description: dictionary?.school?.dashboard?.welcome || "School management lab",
    };
  } catch (error) {
    console.error("[DashboardPage] Metadata error:", error);
    return {
      title: "Dashboard",
      description: "School management dashboard",
    };
  }
}

export default async function DashboardPage({ params }: Props) {
  try {
    const { lang } = await params;

    let dictionary;
    try {
      dictionary = await getDictionary(lang);
    } catch (dictError) {
      console.error("[DashboardPage] Dictionary error:", dictError);
      // Use undefined as fallback - DashboardContent handles undefined
      dictionary = undefined;
    }

    // Note: School data is already provided by the layout via SchoolProvider
    // We don't need to fetch it again here - just pass the dictionary and locale
    return <DashboardContent dictionary={dictionary?.school} locale={lang} />;
  } catch (error) {
    console.error("[DashboardPage] Page render error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4">Dashboard Page Error</h3>
            <p className="text-muted-foreground mb-2">
              An error occurred while loading the dashboard page.
            </p>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
              {errorMessage}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }
}