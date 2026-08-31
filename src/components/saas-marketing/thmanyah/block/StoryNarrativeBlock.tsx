"use client"

import React from "react"
import Image from "next/image"
import { motion } from "framer-motion"

import { LottiePlayer } from "@/components/saas-marketing/thmanyah/atom/LottiePlayer"
import { reveal } from "@/components/saas-marketing/thmanyah/lib/fonts"

/**
 * 1:1 mirror of the reference "The Answer" section (.framer-1ogfghp, id="2").
 *
 * Layout comes from the reference's own declarations (read off its CSSOM),
 * not from eyeballed numbers - see the .answer-* rules in globals.css:
 *   media : width 52% . height 76vh   -> 967x821 @1920, 634x684 @1280
 *   text  : flex 1 0 0px              -> takes the remainder (817 / 510)
 *   row   : max-height 824px . gap 76px . padding-right 60 (A) / left 60 (B)
 *   "8"   : height 100vh (not 16:9)
 * Rows stack below 1200px, and below 600px the reference collapses row B's
 * image to 0px height; that quirk is mirrored in globals.css.
 */
const TEXT_STYLE: React.CSSProperties = {
  fontFamily: '"thmanyah sans", sans-serif',
  fontWeight: 300,
  color: "#000",
  textAlign: "right",
}

/* Row B copy kept as single strings so the rendered h2 has exactly two
   child nodes (text + span) like the reference, with the trailing
   U+00A0 living inside the text node rather than as its own child. */
const ANSWER_B_BODY =
  "الخط هو العامل القادر على تحويل أي تصميم إلى تحفة فنية، أو إلى قبحٍ مطلق. لذلك، قبل سنتين من الآن، عزمنا على أن نثري المكتبة العربية على الإنترنت بخطٍّ عربي جديد. خط يجمع بين الأصالة والأناقة، والفعاليّة ومتطلبات العالم الرقمي. خط مرن وحيّ، يجمّل كل ما يكتبه. طوّرناه لنكمل به مسيرة ما بدأناه من إثراء المكتبة العربية، بمحتوى نوعي، ومنتجات تقنيّة فريدة.\xa0"
const ANSWER_B_BOLD =
  "ويكون امتدادًا لقصّة ثمانية وسعيها لإثراء المحتوى العربي شكلًا ومضمونًا."

const APPEAR = reveal(60, 0.5)

export function StoryNarrativeBlock() {
  return (
    <div className="answer-section" data-framer-name="The Answer" id="2">
      {/* Inner wrapper (.framer-1tx7snx) — gap 0, so the section's 80px gap
          never renders between the rows, exactly as on the reference. */}
      <div className="answer-inner">
        {/* Row A (.framer-1rkxe1n) */}
        <div className="answer-row answer-row--a" data-framer-name="Row A">
          {/* Text (.framer-1n6arzq) */}
          <motion.div {...APPEAR} className="answer-text answer-text--a">
            <h2 dir="rtl" style={TEXT_STYLE}>
              منذ بدأنا قصّة إثراء المحتوى العربي في 2017، كنّا نكتب ونصمم بخطوط
              عربية مختلفة. رحلة اختيار خط عربي مميّز مليئة بالجفاف، لأن المكتبة
              العربية شحيحة، عكس نظيرتها الإنقليزية. على قلّتها ونُدرتها، تجد
              غالبيتها سيئة التصميم. أما الممتازة منها، تستطيع أن تعدّها على
              أصابع يدك الواحدة.
              <br />
              <br />
              محدوديّة الخطوط الأنيقة، جعلت انتشارها مثل النار في الهشيم، ما إن
              تجد خطًّا عربيًّا صالحًا للاستعمال، حتّى يتشبث الكل به. وفجأة،
              تصاميم السوق كلها بمختلف الشركات، تحمل الخط نفسه.
            </h2>
          </motion.div>

          {/* Arabic Letter (.framer-1mprlpy) */}
          <div
            className="answer-media answer-media--a"
            data-framer-name="Arabic Letter"
          >
            <Image
              src="/images/ha-compare-1.png"
              alt="Arabic Letter"
              fill
              sizes="(max-width: 1199px) 100vw, 50vw"
              className="object-cover object-center"
              priority
              unoptimized
            />
          </div>
        </div>

        {/* 8 (.framer-avjrr4) — full-bleed Lottie */}
        <div className="answer-eight" data-framer-name="8" id="8">
          <div className="answer-lottie overflow-hidden">
            <LottiePlayer
              src="/lottie/lottie-stats-letter.json"
              className="h-full w-full"
            />
          </div>
        </div>

        {/* Row B (.framer-1ukmi88) */}
        <div className="answer-row answer-row--b" data-framer-name="Row B">
          {/* Content represnent us (.framer-izlaqb) */}
          <div
            className="answer-media answer-media--b"
            data-framer-name="Content represnent us"
          >
            <Image
              src="/images/ha-compare-2.png"
              alt="Content represnent us"
              fill
              sizes="(max-width: 1199px) 100vw, 50vw"
              className="object-cover object-center"
              unoptimized
            />
          </div>

          {/* Text (.framer-17jeuwe) */}
          <motion.div {...APPEAR} className="answer-text answer-text--b">
            <h2 dir="rtl" style={TEXT_STYLE}>
              {ANSWER_B_BODY}
              <span
                className="font-medium text-black"
                style={{
                  fontFamily: '"thmanyah sans", sans-serif',
                  fontWeight: 500,
                }}
              >
                {ANSWER_B_BOLD}
              </span>
            </h2>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
