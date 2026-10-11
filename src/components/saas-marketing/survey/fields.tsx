// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { Check } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

import { SCALE, type Question } from "./config"

/** Physical keys (KeyA…) pick options, so the badges read the same on an Arabic layout. */
export const KEYS = "ABCDEFGHIJK"

const cardClass =
  "group relative flex min-h-13 cursor-pointer items-center gap-3 rounded-2xl border border-input bg-background px-4 py-3 text-start transition-[border-color,background-color,transform] duration-200 hover:border-foreground/40 active:scale-[0.985] has-[:checked]:border-foreground has-[:checked]:bg-foreground/[0.04] has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 sm:min-h-14"

const textClass =
  "w-full rounded-2xl border border-input bg-transparent px-4 py-3 text-lg outline-none transition-[border-color] placeholder:text-muted-foreground/70 focus-visible:border-foreground focus-visible:ring-3 focus-visible:ring-ring/50"

interface ChoiceProps {
  question: Question
  labels: Record<string, string>
  value: string | string[] | undefined
  other: string
  otherLabel: string
  onPick: (option: string) => void
  onOther: (text: string) => void
}

export function Choices({
  question,
  labels,
  value,
  other,
  otherLabel,
  onPick,
  onOther,
}: ChoiceProps) {
  const reduce = useReducedMotion()
  const multi = question.type === "multi"
  const options = question.options ?? []
  const picked = Array.isArray(value) ? value : value ? [value] : []
  const otherOpen = Boolean(question.other && picked.includes(question.other))

  return (
    <div className="flex flex-col gap-3">
      <div
        role={multi ? "group" : "radiogroup"}
        aria-labelledby={`q-${question.id}`}
        className={cn("grid gap-2.5", options.length > 5 && "sm:grid-cols-2")}
      >
        {options.map((option, i) => (
          <motion.label
            key={option}
            className={cardClass}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.12 + i * 0.035,
              duration: 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <input
              type={multi ? "checkbox" : "radio"}
              name={question.id}
              value={option}
              checked={picked.includes(option)}
              // onClick, not onChange: re-picking the checked radio still
              // advances, and the click fires for taps on the whole card.
              onClick={() => onPick(option)}
              onChange={() => {}}
              className="peer sr-only"
            />
            <kbd className="border-input text-muted-foreground peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background grid size-7 shrink-0 place-items-center rounded-lg border font-sans text-xs font-semibold transition-colors">
              {KEYS[i]}
            </kbd>
            <span className="flex-1 text-[15px] leading-snug font-medium">
              {labels[option]}
            </span>
            <Check
              aria-hidden
              className="size-5 scale-50 opacity-0 transition-[opacity,scale] duration-200 peer-checked:scale-100 peer-checked:opacity-100"
            />
          </motion.label>
        ))}
      </div>

      {otherOpen && (
        <input
          // Picking "أخرى" is a request to type — focus even on a phone.
          autoFocus
          type="text"
          aria-label={labels[question.other!]}
          value={other}
          maxLength={200}
          placeholder={otherLabel}
          enterKeyHint="next"
          onChange={(e) => onOther(e.target.value)}
          className={cn(
            textClass,
            "animate-in fade-in slide-in-from-top-1 h-13 text-base duration-300 motion-reduce:animate-none"
          )}
        />
      )}
    </div>
  )
}

interface ScaleProps {
  question: Question
  value: number | undefined
  low: string
  high: string
  onPick: (n: number) => void
}

export function Scale({ question, value, low, high, onPick }: ScaleProps) {
  const reduce = useReducedMotion()
  return (
    <div className="flex flex-col gap-3">
      <div
        role="radiogroup"
        aria-labelledby={`q-${question.id}`}
        className="grid grid-cols-5 gap-2 sm:gap-3"
      >
        {SCALE.map((n, i) => (
          <motion.label
            key={n}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.12 + i * 0.04,
              duration: 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="border-input hover:border-foreground/40 has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background has-[:focus-visible]:ring-ring/50 grid aspect-square max-h-20 cursor-pointer place-items-center rounded-2xl border text-2xl font-bold tabular-nums transition-[border-color,background-color,color,transform] duration-200 active:scale-95 has-[:focus-visible]:ring-3"
          >
            <input
              type="radio"
              name={question.id}
              value={n}
              checked={value === n}
              onClick={() => onPick(n)}
              onChange={() => {}}
              className="sr-only"
            />
            {n}
          </motion.label>
        ))}
      </div>
      <div className="text-muted-foreground flex justify-between text-sm">
        <span>1 · {low}</span>
        <span>5 · {high}</span>
      </div>
    </div>
  )
}

interface TextProps {
  question: Question
  value: string
  placeholder: string
  autoFocus: boolean
  onChange: (text: string) => void
}

export function OpenText({
  question,
  value,
  placeholder,
  autoFocus,
  onChange,
}: TextProps) {
  if (question.type === "email") {
    return (
      <input
        type="email"
        dir="ltr"
        inputMode="email"
        autoComplete="email"
        enterKeyHint="send"
        aria-labelledby={`q-${question.id}`}
        autoFocus={autoFocus}
        value={value}
        maxLength={200}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(textClass, "h-14 text-start")}
      />
    )
  }
  return (
    <textarea
      aria-labelledby={`q-${question.id}`}
      autoFocus={autoFocus}
      value={value}
      rows={4}
      maxLength={1000}
      placeholder={placeholder}
      enterKeyHint="next"
      onChange={(e) => onChange(e.target.value)}
      className={cn(textClass, "min-h-32 resize-none leading-relaxed")}
    />
  )
}
