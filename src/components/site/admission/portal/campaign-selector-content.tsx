"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnthropicIcons } from "@/components/icons/anthropic";
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
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
          <AnthropicIcons.Book className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-3">
          {lang === "ar" ? "لا توجد برامج قبول متاحة" : "No Admission Programs Available"}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          {lang === "ar"
            ? "لا توجد حاليًا برامج قبول مفتوحة. يرجى التحقق مرة أخرى لاحقًا."
            : "There are currently no open admission programs. Please check back later."}
        </p>
        <Button variant="outline" onClick={() => router.push(`/${lang}`)} className="group">
          {lang === "ar" ? "العودة للصفحة الرئيسية" : "Back to Home"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center">
        <Badge variant="secondary" className="mb-4 px-4 py-1">
          <AnthropicIcons.Announcement className="w-3 h-3 me-2" />
          {lang === "ar" ? "القبول مفتوح" : "Admissions Open"}
        </Badge>
        <h1 className="scroll-m-20 text-3xl md:text-4xl font-bold tracking-tight mb-3">
          {lang === "ar" ? "ابدأ رحلتك معنا" : "Start Your Journey With Us"}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          {lang === "ar"
            ? `اختر برنامج القبول وابدأ طلبك للانضمام إلى ${school.name}`
            : `Select an admission program and start your application to join ${school.name}`}
        </p>
      </div>

      {/* Campaign Cards */}
      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <Card
            key={campaign.id}
            className={`cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
              selectedCampaign === campaign.id
                ? "ring-2 ring-primary border-primary shadow-sm"
                : "hover:border-primary/50 hover:shadow-sm"
            }`}
            onClick={() => handleCampaignSelect(campaign.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl font-semibold">{campaign.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {lang === "ar" ? `العام الدراسي ${campaign.academicYear}` : `Academic Year ${campaign.academicYear}`}
                  </CardDescription>
                </div>
                <Badge
                  variant={campaign.availableSeats > 0 ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {campaign.availableSeats > 0
                    ? lang === "ar"
                      ? `${campaign.availableSeats} مقعد متاح`
                      : `${campaign.availableSeats} seats available`
                    : lang === "ar"
                    ? "مكتمل"
                    : "Full"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {campaign.description && (
                <p className="text-muted-foreground mb-4 leading-relaxed">{campaign.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AnthropicIcons.CalendarChart className="w-4 h-4" />
                  <span>
                    {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AnthropicIcons.Checklist className="w-4 h-4" />
                  <span>
                    {campaign.totalSeats} {lang === "ar" ? "مقعد إجمالي" : "total seats"}
                  </span>
                </div>
                {campaign.applicationFee && campaign.applicationFee > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AnthropicIcons.Lightning className="w-4 h-4" />
                    <span>
                      {lang === "ar" ? "رسوم التقديم:" : "Application Fee:"} ${campaign.applicationFee}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Button */}
      <div className="flex justify-center pt-6">
        <Button
          size="lg"
          disabled={!selectedCampaign || campaigns.find(c => c.id === selectedCampaign)?.availableSeats === 0}
          onClick={handleStartApplication}
          className="min-w-[200px] group"
        >
          {lang === "ar" ? "ابدأ الطلب" : "Start Application"}
          <AnthropicIcons.ArrowRight className="w-4 h-4 ms-2 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
        </Button>
      </div>

      {/* Info Links */}
      <div className="flex flex-wrap justify-center gap-6 text-sm pt-6 border-t border-border/50">
        <Button
          variant="ghost"
          onClick={() => router.push(`/${lang}/apply/status`)}
          className="text-muted-foreground hover:text-foreground"
        >
          <AnthropicIcons.Checklist className="w-4 h-4 me-2" />
          {lang === "ar" ? "تتبع طلب موجود" : "Track Existing Application"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push(`/${lang}/apply/continue`)}
          className="text-muted-foreground hover:text-foreground"
        >
          <AnthropicIcons.Archive className="w-4 h-4 me-2" />
          {lang === "ar" ? "استئناف طلب محفوظ" : "Resume Saved Application"}
        </Button>
      </div>
    </div>
  );
}
