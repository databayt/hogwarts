"use client"

import React from "react"
import { motion } from "framer-motion"

import {
  FRAMER_SPRING,
  reveal,
} from "@/components/saas-marketing/thmanyah/lib/fonts"

/**
 * FAQ — 1:1 mirror of font.thmanyah.com's #faq section (.framer-808h3m).
 *
 * A 1320px wrapping row (gap 64 76) of three flex:1 0 0 columns (gap 48).
 * The first starts with the heading row — the two-line 44px Black title
 * next to a 1px #808080 rule that stretches to its height (hidden below
 * 600) — and every Q&A is a 348px-max column: question in serif display
 * Bold 20/1.4em ss01, answer in sans Light 16/1.4em justified at 90% black.
 *
 * Markup is copied from the live DOM, faux bold included: the reference
 * wraps emphasised words in a span whose family is the single-face
 * "thmanyah sans Regular" and puts a <strong> inside it, so the browser
 * synthesises the bold — the `.faq-reg` alias family reproduces that
 * rather than substituting the real Bold cut. Link colour is 70% black,
 * underlined; the first answer is three white-space:pre boxes in a row.
 * Text runs are written as single string literals (spaces included) so the
 * text nodes match the reference's one-for-one.
 *
 * Below 1200 the row stacks (gap 64 at 600–1199 with 232px min columns,
 * gap 56 below 600) and the 348px caps are lifted; at ≥1800 they are
 * lifted too. Declarations live in globals.css under `.faq-*`.
 */

function Qa({
  q,
  children,
  className,
}: {
  q: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="faq-item">
      <div className="faq-q-box">
        <p dir="rtl" className="faq-q">
          {q}
        </p>
      </div>
      <motion.div
        className={className ?? "faq-answer"}
        initial={{ opacity: 0.001 }}
        animate={{ opacity: 1 }}
        transition={FRAMER_SPRING}
      >
        {children}
      </motion.div>
    </div>
  )
}

const Reg = ({ children }: { children: React.ReactNode }) => (
  <span className="faq-reg">{children}</span>
)

export function FaqBlock() {
  return (
    <div id="faq" className="faq" data-framer-name="FAQ">
      <motion.div className="faq-grid" {...reveal(60, 0.5)}>
        {/* column 1 (.framer-10zo1qp) */}
        <div className="faq-col">
          <div className="faq-head">
            <div className="faq-head-text">
              <p dir="rtl" className="faq-title">
                {"أسئلــة قد"}
              </p>
              <p dir="rtl" className="faq-title">
                {"تخطــر "}
                <span className="faq-ss01">{"ببالك"}</span>
              </p>
            </div>
            <div className="faq-divider" aria-hidden>
              <div className="faq-divider-line" />
            </div>
          </div>

          <Qa q="هل يعمل النظام عند انقطاع الإنترنت؟">
            <p dir="rtl" className="faq-a">
              {
                "نعم. الدروس المحمّلة تبقى متاحة، وما يُسجَّل أثناء الانقطاع — حضورٌ أو درجة — يُحفظ على الجهاز ثم "
              }
              <Reg>
                <strong>{"يُزامَن تلقائيًا"}</strong>
              </Reg>
              {" فور عودة الشبكة، دون إعادة إدخال."}
            </p>
          </Qa>

          <Qa q="كيف ننتقل من نظامنا الحالي؟">
            <p dir="rtl" className="faq-a">
              {
                "نوفّر عملية ترحيل موجّهة مع أخصائي مخصّص لمدرستك: استيراد جماعي من Excel أو CSV أو نظامك الحالي، ثم فترة تشغيل متوازية للتحقّق من دقّة البيانات قبل الاعتماد. تكتمل عادةً خلال أسبوع إلى أسبوعين، بلا فقدان أي بيانات."
              }
            </p>
          </Qa>
        </div>

        {/* column 2 (.framer-ebbquz) */}
        <div className="faq-col">
          <Qa q="هل بيانات مدرستنا آمنة؟">
            <p dir="rtl" className="faq-a">
              {
                "الأمان أولويتنا الأولى: تشفير كامل للبيانات أثناء النقل والتخزين، وتحكّم بالوصول حسب الأدوار، ونسخ احتياطي يومي تلقائي مع إمكانية الاسترجاع لنقطة زمنية محدّدة، وتسجيل كامل لكل عملية إدارية."
              }
            </p>
          </Qa>

          <Qa q="هل يتكامل مع الأدوات التي نستخدمها؟">
            <p dir="rtl" className="faq-a">
              {"نعم. تسجيل دخول موحّد عبر "}
              <Reg>
                <strong>{"«Google Workspace»"}</strong>
              </Reg>
              {" و"}
              <Reg>
                <strong>{"«Microsoft 365»"}</strong>
              </Reg>
              {
                "، وتكامل مع منصات التعلّم وبوابات الدفع لتحصيل الرسوم، وواجهة برمجة مفتوحة لأي نظام آخر."
              }
            </p>
          </Qa>

          <Qa q="ما الدعم والتدريب الذي تقدّمونه؟">
            <p dir="rtl" className="faq-a faq-a--right">
              {
                "قنوات دعم متعدّدة تساعد فريقك على البدء بسرعة، مع أدلّة الاستخدام في "
              }
              <a href="/docs" className="faq-link">
                {"التوثيق"}
              </a>
              {"."}
            </p>
          </Qa>
        </div>

        {/* column 3 (.framer-wrzzgg) */}
        <div className="faq-col">
          <Qa q="هل يمكن تخصيصه حسب منهجنا الدراسي؟">
            <p dir="rtl" className="faq-a">
              {
                "بالتأكيد. يدعم المناهج الوطنية والدولية والمخصّصة، بمقاييس درجات وأنواع تقييم قابلة للتخصيص، وكشوف درجات وشهادات محلّية، وواجهة بالعربية والإنجليزية مع دعم كامل للاتجاه من اليمين إلى اليسار."
              }
            </p>
          </Qa>

          <Qa q="هل يمكننا إدارة عدة مدارس من نظام واحد؟">
            <p dir="rtl" className="faq-a">
              {
                "نعم. لوحة تحكّم واحدة لإدارة كل مدارسك، مع تخصيص لكل مدرسة في الهوية والمنهج والسياسات، وتقارير موحّدة عبر الشبكة بالكامل، وإدارة مركزية للمستخدمين بصلاحيات على مستوى المدرسة."
              }
            </p>
          </Qa>
        </div>
      </motion.div>
    </div>
  )
}
