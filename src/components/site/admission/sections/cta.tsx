import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { AnthropicIcons } from "@/components/icons/anthropic";
import { SectionContainer } from "../shared/section-container";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface AdmissionCTAProps {
  lang: Locale;
  dictionary?: Dictionary;
}

export function AdmissionCTA({ lang }: AdmissionCTAProps) {
  const isRTL = lang === "ar";

  return (
    <SectionContainer className="bg-primary text-primary-foreground">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6">
          {isRTL ? "مستعد لبدء رحلتك؟" : "Ready to Begin Your Journey?"}
        </h2>
        <p className="text-lg md:text-xl opacity-90 mb-8">
          {isRTL
            ? "انضم إلى آلاف الطلاب الذين اكتشفوا إمكاناتهم معنا"
            : "Join thousands of students who have discovered their potential with us"}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/${lang}/apply`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-background text-foreground hover:bg-background/90 gap-2"
            )}
          >
            {isRTL ? "ابدأ التقديم" : "Start Application"}
            <AnthropicIcons.ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/${lang}/inquiry`}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2"
            )}
          >
            <AnthropicIcons.Chat className="w-4 h-4" />
            {isRTL ? "تواصل معنا" : "Contact Admissions"}
          </Link>
        </div>
      </div>
    </SectionContainer>
  );
}
