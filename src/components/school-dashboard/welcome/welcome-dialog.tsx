"use client"

import { useCallback, useEffect, useState } from "react"
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
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSchool } from "@/components/school-dashboard/context/school-context"

const TOTAL_STEPS = 3

const FEATURES = [
  { key: "attendance" as const, icon: ClipboardCheck },
  { key: "grades" as const, icon: BookOpen },
  { key: "timetable" as const, icon: Calendar },
  { key: "messaging" as const, icon: MessageSquare },
  { key: "events" as const, icon: CalendarCheck },
  { key: "finance" as const, icon: CreditCard },
]

const QUICK_ACTIONS = [
  { key: "manageStudents" as const, icon: Users },
  { key: "reviewAttendance" as const, icon: ClipboardCheck },
  { key: "checkTimetable" as const, icon: Calendar },
  { key: "sendMessage" as const, icon: MessageSquare },
  { key: "viewGrades" as const, icon: BookOpen },
  { key: "schoolSettings" as const, icon: Settings },
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
  const { school } = useSchool()

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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogTitle className="sr-only">
          {d.step1Title.replace("{schoolName}", school.name)}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {d.step1Description}
        </DialogDescription>

        <div className="flex flex-col sm:flex-row">
          {/* Left column */}
          <div className="flex flex-1 flex-col p-6 sm:p-8">
            <DotIndicator total={TOTAL_STEPS} current={step} />

            <div className="mt-5 overflow-hidden">
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
                  {step === 0 && (
                    <StepWelcome dictionary={d} schoolName={school.name} />
                  )}
                  {step === 1 && <StepFeatures dictionary={d} />}
                  {step === 2 && <StepQuickActions dictionary={d} />}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-6 flex items-center gap-3">
              {step > 0 && (
                <Button variant="outline" size="sm" onClick={back}>
                  {d.back}
                </Button>
              )}
              {step < TOTAL_STEPS - 1 ? (
                <Button size="sm" onClick={next}>
                  {d.next}
                </Button>
              ) : (
                <Button size="sm" onClick={dismiss}>
                  {d.getStarted}
                </Button>
              )}
            </div>
          </div>

          {/* Right column: illustration */}
          <div className="bg-muted/30 hidden items-center justify-center p-6 sm:flex sm:w-[300px]">
            <Image
              src="/illustrations/welcome-characters.svg"
              alt=""
              width={260}
              height={260}
              className="h-auto w-full"
              priority
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StepWelcome({
  dictionary: d,
  schoolName,
}: {
  dictionary: WelcomeDialogDictionary
  schoolName: string
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">
        {d.step1Title.replace("{schoolName}", schoolName)}
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">{d.step1Description}</p>
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
      <p className="text-muted-foreground mt-2 text-sm">{d.step2Description}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {FEATURES.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="bg-muted/50 flex items-center gap-2 rounded-md px-2.5 py-2"
          >
            <Icon className="text-primary size-3.5 shrink-0" />
            <span className="text-xs">{d.features[key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepQuickActions({
  dictionary: d,
}: {
  dictionary: WelcomeDialogDictionary
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{d.step3Title}</h2>
      <p className="text-muted-foreground mt-2 text-sm">{d.step3Description}</p>
      <div className="mt-3 space-y-1.5">
        {QUICK_ACTIONS.map(({ key, icon: Icon }) => (
          <div key={key} className="flex items-center gap-2.5">
            <div className="bg-primary/10 flex size-6 items-center justify-center rounded">
              <Icon className="text-primary size-3" />
            </div>
            <span className="text-xs">{d.quickActions[key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
