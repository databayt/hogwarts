"use client"

import React from "react"
import Link from "next/link"
import { ArrowRight, Globe } from "lucide-react"

import { FooterBlock } from "@/components/saas-marketing/thmanyah/block/FooterBlock"

export function LicensesTemplate() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-white text-neutral-900 selection:bg-[#9fe5b1] selection:text-black">
      {/* Top Header */}
      <header className="border-b border-neutral-100 px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 transition-colors hover:text-black"
          >
            <ArrowRight className="h-4 w-4" />
            <span>العودة للرئيسية</span>
          </Link>

          <Link
            href="/licenses-en"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:border-black hover:text-black"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>English Version</span>
          </Link>
        </div>
      </header>

      {/* Main License Content */}
      <main className="mx-auto max-w-4xl space-y-12 px-4 py-16 text-right sm:px-8">
        {/* Title */}
        <div className="space-y-4 border-b border-neutral-100 pb-8">
          <span className="font-mono text-xs font-bold tracking-widest text-[#00bc6d] uppercase">
            السياسات والشروط
          </span>
          <h1 className="font-['thmanyah_serif_display'] text-3xl font-black text-neutral-950 sm:text-4xl md:text-5xl">
            اتفاقية ترخيص استخدام برمجيات خط ثمانية
          </h1>
          <p className="font-mono text-sm text-neutral-500">
            آخر تحديث: 2026 • شركة ثمانية للنشر والتوزيع
          </p>
        </div>

        {/* Legal Sections */}
        <div className="space-y-10 font-['thmanyah_serif_text'] text-base leading-relaxed text-neutral-800">
          <section className="space-y-3">
            <h2 className="font-['thmanyah_serif_display'] text-xl font-bold text-neutral-950">
              1. مقدمة وقبول الشروط
            </h2>
            <p>
              تحكم هذه الاتفاقية ترخيص واستخدام برمجيات وملفات خط ثمانية (المشار
              إليها لاحقاً بـ "برمجيات الخط") والمطورة والمملوكة حصرياً لشركة
              ثمانية للنشر والتوزيع ("الشركة"). إن قيامك بتحميل أو تثبيت أو نسخ
              أو استخدام برمجيات الخط بأي شكل من الأشكال يعني موافقتك الصريحة
              والملزمة على كافة بنود وشروط هذا الترخيص.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-['thmanyah_serif_display'] text-xl font-bold text-neutral-950">
              2. منح الترخيص والاستخدامات المسموحة
            </h2>
            <p>
              تمنح الشركة المستخدم ترخيصاً مجانياً، غير حصري، وقابلاً للإلغاء،
              لاستخدام برمجيات الخط في الأغراض التالية:
            </p>
            <ul className="list-inside list-disc space-y-2 pr-4 text-neutral-700">
              <li>
                <strong>الاستخدام الشخصي والتجاري:</strong> يحق لك استخدام الخط
                في كافة مشاريعك الشخصية والتجارية، بما في ذلك المواد المطبوعة،
                والإعلانات، والمحتوى المرئي والمسموع.
              </li>
              <li>
                <strong>الهويات البصرية والتصاميم:</strong> تضمين الخط في تصميم
                الشعارات، والهويات البصرية للشركات والمؤسسات دون الحاجة لدفع أي
                رسوم إضافية.
              </li>
              <li>
                <strong>تطبيقات الويب والأجهزة الذكية:</strong> تضمين واستخدام
                ملفات الخط (مثل WOFF2 و TTF) في المواقع الإلكترونية، والتطبيقات
                الرقمية، وأنظمة التشغيل.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-['thmanyah_serif_display'] text-xl font-bold text-neutral-950">
              3. القيود والمحظورات
            </h2>
            <p>
              لا يجوز للمستخدم بأي حال من الأحوال القيام بأي من الأفعال التالية
              دون موافقة خطية مسبقة من الشركة:
            </p>
            <ul className="list-inside list-disc space-y-2 pr-4 text-neutral-700">
              <li>
                إعادة بيع، أو تأجير، أو ترخيص الخط للغير بمقابل مالي أو بدون
                مقابل كملفات خط مستقلة.
              </li>
              <li>
                تعديل الشفرة البرمجية للملفات، أو إعادة تسميتها وتوزيعها كخط
                جديد، أو عمل هندسة عكسية لملفات الخط.
              </li>
              <li>
                استخدام الخط في أي سياق يخالف الأنظمة والقوانين المعمول بها في
                المملكة العربية السعودية أو الآداب العامة.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-['thmanyah_serif_display'] text-xl font-bold text-neutral-950">
              4. حقوق الملكية الفكرية
            </h2>
            <p>
              تظل جميع حقوق الملكية الفكرية وحقوق النشر والعلامات التجارية
              المرتبطة بخط ثمانية وتصاميمه ملكاً حصرياً لشركة ثمانية للنشر
              والتوزيع، ولا يترتب على هذا الترخيص أي نقل لملكية الأصول الفكرية
              للمستخدم.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-['thmanyah_serif_display'] text-xl font-bold text-neutral-950">
              5. إخلاء المسؤولية
            </h2>
            <p className="text-sm leading-normal text-neutral-600">
              يتم تقديم برمجيات الخط "كما هي" دون أي ضمانات صريحة أو ضمنية من أي
              نوع، بما في ذلك ضمانات الملاءمة لغرض معين أو عدم الانقطاع. لا
              تتحمل الشركة أي مسؤولية عن أي أضرار مباشرة أو غير مباشرة ناتجة عن
              استخدام أو عدم القدرة على استخدام برمجيات الخط.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-['thmanyah_serif_display'] text-xl font-bold text-neutral-950">
              6. القانون الواجب التطبيق والاختصاص القضائي
            </h2>
            <p>
              تخضع هذه الاتفاقية وتفسر وفقاً لأنظمة وقوانين المملكة العربية
              السعودية، وتختص المحاكم المعنية في مدينة الرياض حصرياً بالنظر في
              أي نزاع قد ينشأ عنها. في حال وجود أي تعارض بين النسخة العربية وأي
              ترجمة أخرى، يُعتمد النص العربي.
            </p>
          </section>
        </div>
      </main>

      {/* Global Footer */}
      <FooterBlock />
    </div>
  )
}
