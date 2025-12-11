"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/atom/animated-button";
import SectionHeading from "@/components/atom/section-heading";
import { GradientAnimation } from "@/components/atom/gradient-animation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  MapPin,
  Users,
  Sparkles,
  GraduationCap,
  Calendar,
  FileText,
  CheckCircle,
  Star,
  Globe,
  Heart,
  Shield,
  ArrowRight,
  Clock,
  MessageSquare
} from "lucide-react";
import type { School } from '../types';
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  school: School;
  dictionary: Dictionary;
  lang: Locale;
  subdomain: string;
}

export default function AdmissionContent({ school, dictionary, lang, subdomain }: Props) {
  const isRTL = lang === "ar";
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  const admissionSteps = [
    {
      title: isRTL ? "تقديم الطلب" : "Submit Application",
      titleAr: "تقديم الطلب",
      icon: <BookOpen className="w-6 h-6" />,
      description: isRTL
        ? "أكمل استمارة التقديم عبر الإنترنت مع جميع المستندات المطلوبة"
        : "Complete our online application with all required documents",
      color: "from-blue-500 to-blue-700"
    },
    {
      title: isRTL ? "جولة في الحرم" : "Campus Tour",
      titleAr: "جولة في الحرم",
      icon: <MapPin className="w-6 h-6" />,
      description: isRTL
        ? "استكشف مرافقنا المذهلة في جولة إرشادية شاملة"
        : "Experience our amazing facilities with a guided tour",
      color: "from-purple-500 to-purple-700"
    },
    {
      title: isRTL ? "لقاء التعارف" : "Meet & Greet",
      titleAr: "لقاء التعارف",
      icon: <Users className="w-6 h-6" />,
      description: isRTL
        ? "تواصل مع فريق القبول وأعضاء هيئة التدريس"
        : "Connect with our admissions team and faculty",
      color: "from-green-500 to-green-700"
    },
    {
      title: isRTL ? "انضم للعائلة" : "Join Family",
      titleAr: "انضم للعائلة",
      icon: <Sparkles className="w-6 h-6" />,
      description: isRTL
        ? "أكمل التسجيل وابدأ رحلتك التعليمية معنا"
        : "Complete enrollment and begin your journey with us",
      color: "from-amber-500 to-amber-700"
    }
  ];

  const whyChooseUs = [
    {
      icon: <Star className="w-8 h-8" />,
      title: isRTL ? "التميز الأكاديمي" : "Academic Excellence",
      description: isRTL
        ? "معايير أكاديمية عالية مع سجل حافل بنجاح الطلاب"
        : "High academic standards with proven student success track record",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: isRTL ? "منظور عالمي" : "Global Perspective",
      description: isRTL
        ? "مناهج دولية وبرامج تبادل ثقافي تعد الطلاب للعالم"
        : "International curriculum and cultural exchange programs",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: isRTL ? "بيئة رعاية" : "Nurturing Environment",
      description: isRTL
        ? "مجتمع داعم يشعر فيه كل طالب بالتقدير والتشجيع"
        : "Supportive community where every student feels valued",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: isRTL ? "بناء الشخصية" : "Character Development",
      description: isRTL
        ? "تعليم قائم على القيم ينمي النزاهة والقيادة"
        : "Values-based education developing integrity and leadership",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30"
    }
  ];

  const admissionRequirements = [
    {
      title: isRTL ? "السجلات الأكاديمية" : "Academic Records",
      icon: <FileText className="w-6 h-6" />,
      requirements: [
        isRTL ? "الشهادات الرسمية" : "Official transcripts",
        isRTL ? "درجات الاختبارات" : "Test scores (if applicable)",
        isRTL ? "توصيات المعلمين" : "Teacher recommendations",
      ]
    },
    {
      title: isRTL ? "المعلومات الشخصية" : "Personal Information",
      icon: <Users className="w-6 h-6" />,
      requirements: [
        isRTL ? "شهادة الميلاد" : "Birth certificate",
        isRTL ? "سجلات التطعيم" : "Immunization records",
        isRTL ? "جهات الاتصال" : "Emergency contacts",
      ]
    },
    {
      title: isRTL ? "نماذج الطلب" : "Application Forms",
      icon: <CheckCircle className="w-6 h-6" />,
      requirements: [
        isRTL ? "استمارة التقديم" : "Application form",
        isRTL ? "استبيان الوالدين" : "Parent questionnaire",
        isRTL ? "مقال الطالب" : "Student essay",
      ]
    },
    {
      title: isRTL ? "المعلومات المالية" : "Financial Information",
      icon: <GraduationCap className="w-6 h-6" />,
      requirements: [
        isRTL ? "طلب المساعدة المالية" : "Financial aid form",
        isRTL ? "خطة الدفع" : "Payment plan selection",
        isRTL ? "طلبات المنح" : "Scholarship applications",
      ]
    }
  ];

  const importantDates = [
    {
      month: isRTL ? "سبتمبر" : "September",
      event: isRTL ? "فتح باب التقديم" : "Applications Open",
      icon: Calendar
    },
    {
      month: isRTL ? "ديسمبر" : "December",
      event: isRTL ? "الموعد المبكر" : "Early Decision",
      icon: Clock
    },
    {
      month: isRTL ? "فبراير" : "February",
      event: isRTL ? "الموعد النهائي" : "Regular Deadline",
      icon: FileText
    },
    {
      month: isRTL ? "مارس" : "March",
      event: isRTL ? "قرارات القبول" : "Decisions Sent",
      icon: MessageSquare
    },
    {
      month: isRTL ? "أبريل" : "April",
      event: isRTL ? "تأكيد التسجيل" : "Enrollment Deadline",
      icon: CheckCircle
    }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section with Background Image */}
      <section className="relative h-[70vh] min-h-[500px] max-h-[700px] w-full">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/site/h.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-white text-sm font-medium">
                {isRTL ? "باب القبول مفتوح" : "Admissions Now Open"}
              </span>
            </div>

            <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight">
              {isRTL ? (
                <>ابدأ رحلتك<br />السحرية</>
              ) : (
                <>Begin Your<br />Magical Journey</>
              )}
            </h1>

            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto">
              {isRTL
                ? "انضم إلى عائلتنا واكتشف إمكانياتك الحقيقية في بيئة تعليمية استثنائية"
                : "Join our family and discover your true potential in an extraordinary educational environment"}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href={`/${lang}/apply`}>
                <AnimatedButton size="lg" className="w-full sm:w-auto">
                  {isRTL ? "ابدأ التقديم" : "Start Application"}
                  <ArrowRight className="w-4 h-4 ms-2" />
                </AnimatedButton>
              </Link>
              <Link href={`/${lang}/tour`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20"
                >
                  <MapPin className="w-4 h-4 me-2" />
                  {isRTL ? "احجز جولة" : "Schedule Tour"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-24">
        <SectionHeading
          title={isRTL ? "لماذا نحن" : "Why Choose Us"}
          description={isRTL
            ? "اكتشف ما يجعل مدرستنا المكان المثالي لرحلة طفلك التعليمية"
            : "Discover what makes our school the perfect place for your child's educational journey"
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-10">
          {whyChooseUs.map((feature, index) => (
            <Card
              key={index}
              className="group border-none shadow-none hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              <CardHeader className="text-center flex flex-col items-center pb-4">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110",
                  feature.bgColor
                )}>
                  <div className={feature.color}>
                    {feature.icon}
                  </div>
                </div>
                <CardTitle className="text-lg font-bold">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Admission Process with Animated Dots */}
      <section className="py-16 md:py-24 bg-muted/30">
        <SectionHeading
          title={isRTL ? "خطوات التقديم" : "Admission Process"}
          description={isRTL
            ? "رحلتك تبدأ هنا. عملية تقديم سلسة وبسيطة"
            : "Your journey starts here. A smooth and simple application process"
          }
        />

        {/* Timeline Container */}
        <div className="relative mt-8 py-20 md:py-28 overflow-x-auto">
          {/* Timeline line */}
          <div className="absolute top-1/2 left-4 right-4 md:left-24 md:right-24 transform -translate-y-1/2 h-0.5 bg-border" />

          {/* Timeline items */}
          <div className="relative flex justify-between px-4 md:px-24 min-w-[600px] md:min-w-0">
            {admissionSteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center relative">
                {/* Content above timeline (for dots 2 & 4) */}
                {(index === 1 || index === 3) && (
                  <div className="absolute bottom-16 text-center w-36 md:w-48">
                    <h3 className="text-base md:text-lg font-semibold mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground hidden md:block">
                      {step.description}
                    </p>
                  </div>
                )}

                {/* Animated Gradient Dot */}
                <div
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full relative z-10 overflow-hidden border-4 border-background shadow-lg"
                  style={{
                    '--gradient-background-start': 'rgb(108, 0, 162)',
                    '--gradient-background-end': 'rgb(0, 17, 82)',
                    '--first-color': `${18 + index * 20}, ${113 + index * 30}, ${255 - index * 20}`,
                    '--second-color': `${221 - index * 15}, ${74 + index * 25}, ${255 - index * 10}`,
                    '--third-color': `${100 + index * 20}, ${220 - index * 15}, ${255 - index * 25}`,
                    '--size': '100%',
                    '--blending-value': 'hard-light'
                  } as React.CSSProperties}
                >
                  <svg className="hidden">
                    <defs>
                      <filter id={`blurMe-admission-${index}`}>
                        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
                        <feBlend in="SourceGraphic" in2="goo" />
                      </filter>
                    </defs>
                  </svg>

                  <div className="absolute inset-0 bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))] rounded-full" />

                  <div className={cn(
                    "gradients-container absolute inset-0 overflow-hidden rounded-full",
                    isSafari ? "blur-xl" : `[filter:url(#blurMe-admission-${index})_blur(20px)]`
                  )}>
                    <div
                      className="absolute [background:radial-gradient(circle_at_center,_var(--first-color)_0,_var(--first-color)_50%)_no-repeat] [mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-0 left-0 animate-spin opacity-100"
                      style={{ animationDuration: `${6 + index * 0.7}s` }}
                    />
                    <div
                      className="absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)_no-repeat] [mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-0 left-0 animate-pulse opacity-100"
                      style={{ animationDuration: `${4 + index * 0.5}s` }}
                    />
                  </div>

                  {/* Icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center text-white z-10">
                    {step.icon}
                  </div>
                </div>

                {/* Content below timeline (for dots 1 & 3) */}
                {(index === 0 || index === 2) && (
                  <div className="absolute top-16 text-center w-36 md:w-48">
                    <h3 className="text-base md:text-lg font-semibold mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground hidden md:block">
                      {step.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-16 md:py-24">
        <SectionHeading
          title={isRTL ? "متطلبات القبول" : "Requirements"}
          description={isRTL
            ? "كل ما تحتاج إعداده لتقديم طلب ناجح"
            : "Everything you need to prepare for a successful application"
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10">
          {admissionRequirements.map((requirement, index) => (
            <Card
              key={index}
              className="group border shadow-none hover:shadow-lg transition-all duration-300"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    {requirement.icon}
                  </div>
                  <CardTitle className="text-lg font-bold">
                    {requirement.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {requirement.requirements.map((req, reqIndex) => (
                    <li key={reqIndex} className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Important Dates */}
      <section className="py-16 md:py-24 bg-muted/30">
        <SectionHeading
          title={isRTL ? "التواريخ المهمة" : "Key Dates"}
          description={isRTL
            ? "تواريخ مهمة لدورة القبول القادمة"
            : "Important dates for the upcoming admissions cycle"
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 pt-10">
          {importantDates.map((date, index) => {
            const Icon = date.icon;
            return (
              <div
                key={index}
                className="group text-center p-6 rounded-2xl bg-background hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-xl font-bold text-primary mb-1">
                  {date.month}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {date.event}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section with Gradient Animation */}
      <section className="py-16 md:py-24">
        <GradientAnimation
          height="h-[400px] md:h-[450px]"
          containerClassName="!w-full rounded-2xl overflow-hidden"
        >
          <div className="absolute z-50 inset-0 flex items-center justify-center">
            <div className="text-center px-6 max-w-3xl">
              <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-white mb-4">
                {isRTL ? "مستعد لبدء رحلتك؟" : "Ready to Begin?"}
              </h2>
              <p className="text-white/80 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                {isRTL
                  ? "اتخذ الخطوة الأولى نحو تعليم استثنائي. فريق القبول لدينا هنا لمساعدتك"
                  : "Take the first step towards an extraordinary education. Our admissions team is here to guide you"}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href={`/${lang}/apply`}>
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                    {isRTL ? "ابدأ التقديم الآن" : "Start Application Now"}
                    <ArrowRight className="w-4 h-4 ms-2" />
                  </Button>
                </Link>
                <Link href={`/${lang}/inquiry`}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-transparent text-white border-white/50 hover:bg-white/10 w-full sm:w-auto"
                  >
                    <MessageSquare className="w-4 h-4 me-2" />
                    {isRTL ? "تواصل معنا" : "Contact Admissions"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </GradientAnimation>
      </section>
    </div>
  );
}
