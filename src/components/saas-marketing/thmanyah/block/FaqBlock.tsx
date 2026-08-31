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

          <Qa q="كيف أفعل/أظهر رمز الريال السعودي «ر.س» ؟" className="faq-row">
            <div className="faq-pre">
              <p dir="rtl" className="faq-a">
                {"من خلال الاختصار "}
                <Reg>{"«"}</Reg>
              </p>
            </div>
            <div className="faq-pre">
              <p dir="rtl" className="faq-a faq-a--reg">
                {"ر."}
              </p>
            </div>
            <div className="faq-pre">
              <p dir="rtl" className="faq-a faq-a--reg">
                {"س»"}
                <span className="faq-light">{"."}</span>
              </p>
            </div>
          </Qa>

          <Qa q="كيف أثبّت الخط على جهازي؟">
            <p dir="rtl" className="faq-a">
              <Reg>
                <strong>{"ماك"}</strong>
              </Reg>
              <strong>
                <br />
              </strong>
              {"افتح ملف الخط ثم اضغط "}
              <Reg>
                <strong>{"«تثبيت الخط»"}</strong>
              </Reg>
              {" في تطبيق "}
              <Reg>
                {"«"}
                <strong>{"دفتر الخطوط»"}</strong>
              </Reg>
              {"."}
            </p>
            <p dir="rtl" className="faq-a">
              <br />
              <Reg>
                <strong>{"ويندوز"}</strong>
              </Reg>
              <strong>
                <br />
              </strong>
              {"اضغط بزر الفأرة الأيمن على ملف الخط ثم اختر "}
              <Reg>
                {"«"}
                <strong>{"تثبيت»"}</strong>
              </Reg>
              {"."}
            </p>
          </Qa>
        </div>

        {/* column 2 (.framer-ebbquz) */}
        <div className="faq-col">
          <Qa q="هل الخط مجاني؟">
            <p dir="rtl" className="faq-a">
              {
                "نعم، الخط متاح مجانًا. سواء للاستخدام الشخصي، أو في المشاريع والأعمال التجارية المختلفة، من الطباعة أو الهوية البصرية أو واجهات المواقع والتطبيقات. وللمزيد راجع صفحة "
              }
              <a href="/licenses" className="faq-link">
                {"سياسة الاستخدام"}
              </a>
              {"."}
            </p>
          </Qa>

          <Qa q="كيف أفعّل الحروف المرسلة؟">
            <p dir="rtl" className="faq-a">
              {
                "تقدر تفعّل الحروف المرسلة من خلال إعدادات الخط في البرامج التي تدعم خصائص "
              }
              <Reg>
                <strong>{"«OpenType»"}</strong>
              </Reg>
              {" وتفعيل خيار "}
              <Reg>
                <strong>{"«Stylistic Alternates»"}</strong>
              </Reg>
              {
                ". بعد تفعيل هذا الخيار ستظهر الحروف المرسلة تلقائيًا للمناسب منها داخل الكلمة."
              }
            </p>
          </Qa>

          <Qa q="كيف أتواصل معكم للاقتراحات أو طلب المساعدة؟">
            <p dir="rtl" className="faq-a faq-a--right">
              {"تواصل معنا عبر المحادثة السريعة "}
              <a
                href="https://ask.thmanyah.com/hc/ar-sa"
                target="_blank"
                rel="noopener"
                className="faq-link"
              >
                <span>{"هنا"}</span>
              </a>
              {"."}
            </p>
          </Qa>
        </div>

        {/* column 3 (.framer-wrzzgg) */}
        <div className="faq-col">
          <Qa q="هل يدعم الخط واجهات المواقع والتطبيقات؟">
            <p dir="rtl" className="faq-a">
              {
                "أكيد. تقدر تستخدمه في تصميم واجهات المواقع والتطبيقات بمختلف عناصرها، مثل العناوين والنصوص، والقوائم. لكن لا تنس مراعاة تنسيق أحجام النصوص في المقاسات الصغيرة والكبيرة واختبارها على الشاشات المختلفة لضمان الوضوح وتحسين تجربة المستخدم."
              }
            </p>
          </Qa>

          <Qa q="كيف تصلني التحديثات المستقبلية للخط؟">
            <p dir="rtl" className="faq-a">
              {
                "عبر بريدك الإلكتروني المستخدم عند تحميل الخط، علمًا بأننا لن نستخدم هذا البريد لأي رسائل ترويجية أو غير مرتبطة بالخط."
              }
            </p>
          </Qa>
        </div>
      </motion.div>
    </div>
  )
}
