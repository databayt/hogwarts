"use client"

import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import {
  BookOpen,
  Calendar,
  CalendarCheck,
  ClipboardCheck,
  CreditCard,
  MessageSquare,
  Settings,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"

// Phones take the sheet, from `md` up the dialog — the sidebar's breakpoint.
const PHONE_QUERY = "(max-width: 767px)"

function subscribePhone(onChange: () => void) {
  const mql = window.matchMedia(PHONE_QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}
const phoneSnapshot = () => window.matchMedia(PHONE_QUERY).matches
const phoneServerSnapshot = () => false

const TOTAL_STEPS = 3

const STEPS_CONFIG = [
  {
    bg: "#d97757",
    illustration: "/welcome/Hands-Build.svg",
  },
  {
    bg: "#6a9bcc",
    illustration: "/welcome/Objects-Puzzle.svg",
  },
  {
    bg: "#788c5d",
    illustration: "/welcome/Hands-Stack.svg",
  },
]

const FEATURES = [
  { key: "attendance" as const, icon: ClipboardCheck },
  { key: "grades" as const, icon: BookOpen },
  { key: "timetable" as const, icon: Calendar },
  { key: "messaging" as const, icon: MessageSquare },
  { key: "events" as const, icon: CalendarCheck },
  { key: "finance" as const, icon: CreditCard },
]

const FIRST_STEPS = [
  { key: "manageStudents" as const, icon: Users },
  { key: "reviewAttendance" as const, icon: Calendar },
  { key: "checkTimetable" as const, icon: ClipboardCheck },
  { key: "sendMessage" as const, icon: MessageSquare },
  { key: "viewGrades" as const, icon: Settings },
  { key: "schoolSettings" as const, icon: Users },
]

interface WelcomeDialogDictionary {
  step1Title: string
  step1Description: string
  step2Title: string
  step2Description: string
  step3Title: string
  step3Description: string
  next: string
  back: string
  getStarted: string
  features: {
    attendance: string
    grades: string
    timetable: string
    messaging: string
    events: string
    finance: string
  }
  quickActions: {
    manageStudents: string
    reviewAttendance: string
    checkTimetable: string
    sendMessage: string
    viewGrades: string
    schoolSettings: string
  }
}

interface WelcomeDialogProps {
  userId: string
  dictionary: WelcomeDialogDictionary
}

function getStorageKey(userId: string) {
  return `welcome-seen-${userId}`
}

function DotIndicator({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "size-2 rounded-full transition-colors duration-200",
            i === current ? "bg-primary" : "bg-muted"
          )}
        />
      ))}
    </div>
  )
}

export function WelcomeDialog({ userId, dictionary: d }: WelcomeDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const isPhone = useSyncExternalStore(
    subscribePhone,
    phoneSnapshot,
    phoneServerSnapshot
  )
  useEffect(() => {
    const seen = localStorage.getItem(getStorageKey(userId))
    if (!seen) {
      setOpen(true)
    }
  }, [userId])

  const dismiss = useCallback(() => {
    localStorage.setItem(getStorageKey(userId), "true")
    setOpen(false)
  }, [userId])

  const next = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1)
      setStep((s) => s + 1)
    }
  }, [step])

  const back = useCallback(() => {
    if (step > 0) {
      setDirection(-1)
      setStep((s) => s - 1)
    }
  }, [step])

  if (!open) return null

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  }

  const isLast = step === TOTAL_STEPS - 1

  const stepBody = (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={step}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {step === 0 && <StepWelcome dictionary={d} />}
        {step === 1 && <StepFeatures dictionary={d} />}
        {step === 2 && <StepFirstSteps dictionary={d} />}
      </motion.div>
    </AnimatePresence>
  )

  const illustration = (size: number) => (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Image
          src={STEPS_CONFIG[step].illustration}
          alt=""
          width={size}
          height={size}
          style={{ width: size }}
          className="h-auto object-contain"
          priority
          unoptimized
        />
      </motion.div>
    </AnimatePresence>
  )

  if (isPhone) {
    // An iOS sheet like the install sheet (Figma iuYSGaRV8xkcEGnyIltPRg,
    // Activity View): rounded top over the dimmed page, grabber, round close,
    // swipe down to dismiss. The step's colour band carries the illustration
    // the dialog hides below `sm`, and the controls are full-width pills.
    return (
      <Drawer open={open} onOpenChange={(v) => !v && dismiss()}>
        <DrawerContent className="max-h-[92vh] rounded-t-[36px]! border-0 px-6 pb-[calc(env(safe-area-inset-bottom)+16px)] [&>div:first-child]:mt-2 [&>div:first-child]:h-[5px] [&>div:first-child]:w-9 [&>div:first-child]:bg-black/30">
          <DrawerTitle className="sr-only">{d.step1Title}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {d.step1Description}
          </DrawerDescription>

          <button
            type="button"
            onClick={dismiss}
            aria-label={d.getStarted}
            className="text-foreground/70 absolute end-4 top-4 z-10 grid size-[30px] place-items-center rounded-full bg-black/[0.06] dark:bg-white/10"
          >
            <X className="size-4" strokeWidth={2.5} />
          </button>

          <div className="overflow-y-auto overscroll-contain pt-8">
            <motion.div
              aria-hidden
              className="flex h-44 items-center justify-center rounded-[22px]"
              animate={{ backgroundColor: STEPS_CONFIG[step].bg }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {illustration(128)}
            </motion.div>

            <div className="mt-6 flex justify-center">
              <DotIndicator total={TOTAL_STEPS} current={step} />
            </div>

            <div className="mt-5 min-h-[248px] overflow-hidden">{stepBody}</div>

            <div className="mt-6 flex items-center gap-3">
              {step > 0 && (
                <Button
                  variant="secondary"
                  onClick={back}
                  className="h-14 flex-1 rounded-full text-[17px] font-semibold"
                >
                  {d.back}
                </Button>
              )}
              <Button
                onClick={isLast ? dismiss : next}
                className="h-14 flex-1 rounded-full text-[17px] font-semibold"
              >
                {isLast ? d.getStarted : d.next}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogTitle className="sr-only">{d.step1Title}</DialogTitle>
        <DialogDescription className="sr-only">
          {d.step1Description}
        </DialogDescription>

        <div className="flex h-[440px] flex-col sm:flex-row">
          {/* Left column — content */}
          <div className="flex flex-1 flex-col p-8 sm:p-10">
            <DotIndicator total={TOTAL_STEPS} current={step} />

            <div className="mt-5 min-h-0 flex-1 overflow-hidden">
              {stepBody}
            </div>

            <div className="mt-auto flex items-center gap-3 pt-4">
              {step > 0 && (
                <Button variant="outline" size="sm" onClick={back}>
                  {d.back}
                </Button>
              )}
              <Button size="sm" onClick={isLast ? dismiss : next}>
                {isLast ? d.getStarted : d.next}
              </Button>
            </div>
          </div>

          {/* Right column — illustration */}
          <motion.div
            className="hidden items-center justify-center rounded-e-lg sm:flex sm:w-[260px]"
            animate={{ backgroundColor: STEPS_CONFIG[step].bg }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {illustration(180)}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StepWelcome({
  dictionary: d,
}: {
  dictionary: WelcomeDialogDictionary
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{d.step1Title}</h2>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {d.step1Description}
      </p>
    </div>
  )
}

function StepFeatures({
  dictionary: d,
}: {
  dictionary: WelcomeDialogDictionary
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{d.step2Title}</h2>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {d.step2Description}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {FEATURES.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="bg-muted/50 flex flex-col items-center gap-1.5 rounded-lg py-3"
          >
            <Icon className="text-muted-foreground size-4" />
            <span className="text-xs">{d.features[key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepFirstSteps({
  dictionary: d,
}: {
  dictionary: WelcomeDialogDictionary
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{d.step3Title}</h2>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {d.step3Description}
      </p>
      <div className="mt-4 space-y-2.5">
        {FIRST_STEPS.map(({ key }, i) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-full border text-xs">
              {i + 1}
            </span>
            <span className="text-sm">{d.quickActions[key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
