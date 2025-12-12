"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ChevronRight, ChevronLeft, Bookmark, Clock } from "lucide-react";
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
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const isRTL = lang === 'ar';
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaign(campaignId);
  };

  const handleStartApplication = () => {
    if (selectedCampaign) {
      router.push(`/${lang}/apply/${selectedCampaign}`);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (campaigns.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto px-3 sm:px-4 space-y-3 sm:space-y-4">
        {/* Header */}
        <div>
          <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl lg:text-2xl">
            {lang === "ar" ? "تقديم طلب الالتحاق" : "Apply for Admission"}
          </h3>
        </div>

        {/* No campaigns message */}
        <div className="space-y-2 sm:space-y-3">
          <div className="py-8 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" />
            </div>
            <h5 className="text-base sm:text-lg font-semibold mb-1">
              {lang === "ar" ? "لا توجد برامج قبول متاحة" : "No Admission Programs Available"}
            </h5>
            <p className="text-sm text-muted-foreground">
              {lang === "ar"
                ? "يرجى التحقق مرة أخرى لاحقًا"
                : "Please check back later"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-4 space-y-3 sm:space-y-4">
      {/* Header */}
      <div>
        <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl lg:text-2xl">
          {lang === "ar" ? "تقديم طلب الالتحاق" : "Apply for Admission"}
        </h3>
      </div>

      {/* Campaign Cards */}
      <div className="space-y-2 sm:space-y-3">
        <h5 className="text-base sm:text-lg font-semibold">
          {lang === "ar" ? "اختر برنامج القبول" : "Select an admission program"}
        </h5>

        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className={`border py-2 sm:py-3 bg-card transition-all cursor-pointer shadow-none hover:shadow-none rounded-lg min-h-[50px] sm:min-h-[60px] ${
                selectedCampaign === campaign.id
                  ? "border-foreground bg-accent"
                  : "hover:border-foreground/50 hover:bg-accent"
              }`}
              onClick={() => handleCampaignSelect(campaign.id)}
            >
              <CardContent className="flex items-center px-2 sm:px-3">
                <div className="flex items-center space-x-2 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs sm:text-sm font-medium truncate">
                        {campaign.name}
                      </h5>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          campaign.availableSeats > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {campaign.availableSeats > 0
                          ? lang === "ar"
                            ? `${campaign.availableSeats} مقعد`
                            : `${campaign.availableSeats} seats`
                          : lang === "ar"
                          ? "مكتمل"
                          : "Full"}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                      </p>
                      {campaign.applicationFee && campaign.applicationFee > 0 && (
                        <p className="text-xs text-muted-foreground">
                          <span className="hidden sm:inline">•</span> ${campaign.applicationFee}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Start Application Button */}
      {selectedCampaign && (
        <div className="space-y-2 sm:space-y-3">
          <h5>
            {lang === "ar" ? "متابعة" : "Continue"}
          </h5>

          <div className="space-y-2">
            <button
              onClick={handleStartApplication}
              disabled={campaigns.find(c => c.id === selectedCampaign)?.availableSeats === 0}
              className="w-full flex items-center justify-between h-auto py-2 sm:py-3 border-b border-border transition-all group min-h-[50px] sm:min-h-[60px] disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                </div>
                <div className={`min-w-0 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <h5>
                    {lang === "ar" ? "ابدأ الطلب" : "Start Application"}
                  </h5>
                  <p className="muted mt-0.5">
                    {lang === "ar" ? "ابدأ طلب التحاق جديد" : "Begin a new application"}
                  </p>
                </div>
              </div>
              <ChevronIcon className="w-4 h-4 sm:w-5 sm:h-5 text-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* Other Options */}
      <div className="space-y-2 sm:space-y-3">
        <h5>
          {lang === "ar" ? "خيارات أخرى" : "Other options"}
        </h5>

        <div className="space-y-2">
          {/* Track Existing Application */}
          <button
            onClick={() => router.push(`/${lang}/apply/status`)}
            className="w-full flex items-center justify-between h-auto py-2 sm:py-3 border-b border-border transition-all group min-h-[50px] sm:min-h-[60px]"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
              </div>
              <div className={`min-w-0 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <h5>
                  {lang === "ar" ? "تتبع طلب موجود" : "Track Existing Application"}
                </h5>
                <p className="muted mt-0.5">
                  {lang === "ar" ? "تحقق من حالة طلبك" : "Check your application status"}
                </p>
              </div>
            </div>
            <ChevronIcon className="w-4 h-4 sm:w-5 sm:h-5 text-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </button>

          {/* Resume Saved Application */}
          <button
            onClick={() => router.push(`/${lang}/apply/continue`)}
            className="w-full flex items-center justify-between h-auto py-2 sm:py-3 border-b border-border transition-all group min-h-[50px] sm:min-h-[60px]"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
              </div>
              <div className={`min-w-0 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <h5>
                  {lang === "ar" ? "استئناف طلب محفوظ" : "Resume Saved Application"}
                </h5>
                <p className="muted mt-0.5">
                  {lang === "ar" ? "أكمل طلبًا بدأته سابقًا" : "Continue where you left off"}
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
