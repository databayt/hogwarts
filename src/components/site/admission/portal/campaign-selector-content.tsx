"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, DollarSign, ChevronRight, GraduationCap } from "lucide-react";
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
      router.push(`/${lang}/s/${subdomain}/apply/${selectedCampaign}`);
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
      <div className="text-center py-16">
        <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">
          {lang === "ar" ? "لا توجد برامج قبول متاحة" : "No Admission Programs Available"}
        </h2>
        <p className="text-muted-foreground mb-6">
          {lang === "ar"
            ? "لا توجد حاليًا برامج قبول مفتوحة. يرجى التحقق مرة أخرى لاحقًا."
            : "There are currently no open admission programs. Please check back later."}
        </p>
        <Button variant="outline" onClick={() => router.push(`/${lang}/s/${subdomain}`)}>
          {lang === "ar" ? "العودة للصفحة الرئيسية" : "Back to Home"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <Badge className="mb-4">{lang === "ar" ? "القبول مفتوح" : "Admissions Open"}</Badge>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {lang === "ar" ? "ابدأ رحلتك معنا" : "Start Your Journey With Us"}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {lang === "ar"
            ? `اختر برنامج القبول وابدأ طلبك للانضمام إلى ${school.name}`
            : `Select an admission program and start your application to join ${school.name}`}
        </p>
      </div>

      {/* Campaign Cards */}
      <div className="grid gap-6">
        {campaigns.map((campaign) => (
          <Card
            key={campaign.id}
            className={`cursor-pointer transition-all duration-200 ${
              selectedCampaign === campaign.id
                ? "ring-2 ring-primary border-primary"
                : "hover:border-primary/50"
            }`}
            onClick={() => handleCampaignSelect(campaign.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{campaign.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {lang === "ar" ? `العام الدراسي ${campaign.academicYear}` : `Academic Year ${campaign.academicYear}`}
                  </CardDescription>
                </div>
                <Badge variant={campaign.availableSeats > 0 ? "default" : "secondary"}>
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
            <CardContent>
              {campaign.description && (
                <p className="text-muted-foreground mb-4">{campaign.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>
                    {campaign.totalSeats} {lang === "ar" ? "مقعد إجمالي" : "total seats"}
                  </span>
                </div>
                {campaign.applicationFee && campaign.applicationFee > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
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
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          disabled={!selectedCampaign || campaigns.find(c => c.id === selectedCampaign)?.availableSeats === 0}
          onClick={handleStartApplication}
          className="min-w-[200px]"
        >
          {lang === "ar" ? "ابدأ الطلب" : "Start Application"}
          <ChevronRight className="w-5 h-5 ms-2" />
        </Button>
      </div>

      {/* Info Links */}
      <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground pt-4">
        <Button variant="link" onClick={() => router.push(`/${lang}/s/${subdomain}/apply/status`)}>
          {lang === "ar" ? "تتبع طلب موجود" : "Track Existing Application"}
        </Button>
        <span className="text-muted-foreground">•</span>
        <Button variant="link" onClick={() => router.push(`/${lang}/s/${subdomain}/apply/continue`)}>
          {lang === "ar" ? "استئناف طلب محفوظ" : "Resume Saved Application"}
        </Button>
      </div>
    </div>
  );
}
