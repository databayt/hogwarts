"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ChevronRight, ChevronLeft, BookOpen, FileText } from "lucide-react";
import type { School } from "../../types";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import type { PublicCampaign } from "../types";

interface Props {
  school: School;
  campaigns: PublicCampaign[];
  dictionary: Dictionary;
  lang: Locale;
  subdomain: string;
}

export default function CampaignSelectorContent({
  school,
  campaigns,
  dictionary,
  lang,
  subdomain,
}: Props) {
  const router = useRouter();
  const isRTL = lang === 'ar';
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;
  const handleStartNew = (campaignId: string) => {
    router.push(`/${lang}/apply/${campaignId}`);
  };

  const activeCampaign = campaigns.find(c => c.availableSeats > 0) || campaigns[0];

  // Application info for the draft card
  const applicationInfo = {
    campaignName: activeCampaign?.name || (lang === 'ar' ? 'القبول 2025-2026' : 'Admissions 2025-2026'),
    step: lang === 'ar' ? 'المعلومات الشخصية' : 'Personal Information',
    stepNumber: '1/6',
  };

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-4 space-y-3 sm:space-y-4">
      {/* Welcome Header */}
      <div>
        <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl lg:text-2xl">
          {lang === "ar" ? "مرحباً" : "Welcome"}
        </h3>
      </div>

      {/* Complete your application section - shows draft like onboarding "Complete your school setup" */}
      <div className="space-y-2 sm:space-y-3">
        <h5 className="text-base sm:text-lg font-semibold">
          {lang === "ar" ? "أكمل طلبك" : "Complete your application"}
        </h5>

        <div className="space-y-2">
          <Card
            className="border hover:border-foreground/50 bg-card hover:bg-accent transition-all cursor-pointer shadow-none hover:shadow-none rounded-lg"
            onClick={() => activeCampaign && handleStartNew(activeCampaign.id)}
          >
            <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8 px-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-md flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h5 className="text-sm sm:text-base font-medium">
                  {applicationInfo.campaignName}
                </h5>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                  {lang === "ar" ? "مسودة" : "Draft"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {lang === "ar" ? "الخطوة" : "Step"} {applicationInfo.stepNumber} • {applicationInfo.step}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Start a new application section */}
      <div className="space-y-2 sm:space-y-3">
        <h5>
          {lang === "ar" ? "ابدأ طلباً جديداً" : "Start a new application"}
        </h5>

        <div className="space-y-2">
          {/* Start from scratch */}
          <button
            onClick={() => activeCampaign && handleStartNew(activeCampaign.id)}
            disabled={!activeCampaign || activeCampaign.availableSeats === 0}
            className="w-full flex items-center justify-between h-auto py-2 sm:py-3 border-b border-border transition-all group min-h-[50px] sm:min-h-[60px] disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
              </div>
              <div className={`min-w-0 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <h5>
                  {lang === "ar" ? "ابدأ من الصفر" : "Start from scratch"}
                </h5>
                <p className="muted mt-0.5">
                  {lang === "ar"
                    ? "ابدأ طلباً جديداً بالإعدادات الأساسية"
                    : "Begin a new application with basic setup"}
                </p>
              </div>
            </div>
            <ChevronIcon className="w-4 h-4 sm:w-5 sm:h-5 text-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </button>

          {/* Import from profile/documents */}
          <button
            onClick={() => activeCampaign && router.push(`/${lang}/apply/${activeCampaign.id}?import=true`)}
            disabled={!activeCampaign || activeCampaign.availableSeats === 0}
            className="w-full flex items-center justify-between h-auto py-2 sm:py-3 border-b border-border transition-all group min-h-[50px] sm:min-h-[60px] disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
              </div>
              <div className={`min-w-0 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <h5>
                  {lang === "ar" ? "استيراد من ملف شخصي" : "Import from profile"}
                </h5>
                <p className="muted mt-0.5">
                  {lang === "ar"
                    ? "استخرج البيانات من المستندات أو LinkedIn"
                    : "Auto-fill from documents or LinkedIn"}
                </p>
              </div>
            </div>
            <ChevronIcon className="w-4 h-4 sm:w-5 sm:h-5 text-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
