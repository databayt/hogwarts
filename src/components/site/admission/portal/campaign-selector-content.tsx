"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ChevronRight, ChevronLeft, FileText, Clock } from "lucide-react";
import type { School } from "../../types";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import type { PublicCampaign } from "../types";

interface SavedApplication {
  id: string;
  sessionToken: string;
  campaignName: string;
  step: string;
  lastUpdated: string;
}

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
  const [savedApplications, setSavedApplications] = useState<SavedApplication[]>([]);

  // Check for saved applications in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`apply_sessions_${subdomain}`);
      if (saved) {
        const sessions = JSON.parse(saved);
        setSavedApplications(sessions);
      }
    } catch (e) {
      console.error('Failed to load saved applications:', e);
    }
  }, [subdomain]);

  const handleCampaignClick = (campaignId: string) => {
    router.push(`/${lang}/apply/${campaignId}`);
  };

  const handleResumeApplication = (sessionToken: string, campaignId: string) => {
    sessionStorage.setItem('apply_session_token', sessionToken);
    router.push(`/${lang}/apply/${campaignId}/personal`);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const hasSavedApplications = savedApplications.length > 0;

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-4 space-y-3 sm:space-y-4">
      {/* Welcome Header */}
      <div>
        <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl lg:text-2xl">
          {lang === "ar" ? "مرحباً" : "Welcome"}
        </h3>
      </div>

      {/* Complete your application section - shows saved/in-progress applications */}
      {hasSavedApplications && (
        <div className="space-y-2 sm:space-y-3">
          <h5 className="text-base sm:text-lg font-semibold">
            {lang === "ar" ? "أكمل طلبك" : "Complete your application"}
          </h5>

          <div className="space-y-2">
            {savedApplications.map((app) => (
              <Card
                key={app.id}
                className="border hover:border-foreground/50 py-2 sm:py-3 bg-card hover:bg-accent transition-all cursor-pointer shadow-none hover:shadow-none rounded-lg min-h-[50px] sm:min-h-[60px]"
                onClick={() => handleResumeApplication(app.sessionToken, app.id)}
              >
                <CardContent className="flex items-center px-2 sm:px-3">
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs sm:text-sm font-medium truncate">
                          {app.campaignName}
                        </h5>
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          {lang === "ar" ? "مسودة" : "Draft"}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          {lang === "ar" ? `الخطوة: ${app.step}` : `Step: ${app.step}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="hidden sm:inline">•</span> {app.lastUpdated}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Start a new application section */}
      <div className="space-y-2 sm:space-y-3">
        <h5>
          {lang === "ar" ? "ابدأ طلباً جديداً" : "Start a new application"}
        </h5>

        {campaigns.length === 0 ? (
          <div className="py-6 text-center border rounded-lg">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {lang === "ar"
                ? "لا توجد برامج قبول متاحة حالياً"
                : "No admission programs available at the moment"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {campaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => handleCampaignClick(campaign.id)}
                disabled={campaign.availableSeats === 0}
                className="w-full flex items-center justify-between h-auto py-2 sm:py-3 border-b border-border transition-all group min-h-[50px] sm:min-h-[60px] disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                  </div>
                  <div className={`min-w-0 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <h5>
                      {campaign.name}
                    </h5>
                    <p className="muted mt-0.5">
                      {campaign.availableSeats > 0
                        ? lang === "ar"
                          ? `${campaign.availableSeats} مقعد متاح • ${formatDate(campaign.startDate)} - ${formatDate(campaign.endDate)}`
                          : `${campaign.availableSeats} seats available • ${formatDate(campaign.startDate)} - ${formatDate(campaign.endDate)}`
                        : lang === "ar"
                        ? "لا توجد مقاعد متاحة"
                        : "No seats available"}
                    </p>
                  </div>
                </div>
                <ChevronIcon className="w-4 h-4 sm:w-5 sm:h-5 text-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
