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

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormStepProgress } from "@/components/form/progress"
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
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  }

  return (
    <Dialog open modal>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-3xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={dismiss}
        showCloseButton
        onCloseAutoFocus={dismiss}
      >
        {/* Hidden accessible title */}
        <DialogTitle className="sr-only">
          {d.step1Title.replace("{schoolName}", school.name)}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {d.step1Description}
        </DialogDescription>

        <div className="flex flex-col sm:flex-row">
          {/* Left column: text + navigation */}
          <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
            {/* Dot pagination */}
            <FormStepProgress
              current={step}
              total={TOTAL_STEPS}
              variant="dots"
              className="mb-6 !justify-start"
            />

            {/* Step content with animation */}
            <div className="relative min-h-[200px] flex-1">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  {step === 0 && (
                    <StepWelcome dictionary={d} schoolName={school.name} />
                  )}
                  {step === 1 && <StepFeatures dictionary={d} />}
                  {step === 2 && <StepQuickActions dictionary={d} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation buttons */}
            <div className="mt-6 flex items-center gap-3">
              {step > 0 && (
                <Button variant="outline" onClick={back}>
                  {d.back}
                </Button>
              )}
              {step < TOTAL_STEPS - 1 ? (
                <Button onClick={next}>{d.next}</Button>
              ) : (
                <Button onClick={dismiss}>{d.getStarted}</Button>
              )}
            </div>
          </div>

          {/* Right column: illustration */}
          <div className="bg-muted/30 hidden items-center justify-center p-6 sm:flex sm:w-[320px]">
            <Image
              src="/illustrations/welcome-characters.svg"
              alt=""
              width={280}
              height={280}
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
    <div className="flex flex-col gap-3">
      <h2 className="text-2xl font-bold tracking-tight">
        {d.step1Title.replace("{schoolName}", schoolName)}
      </h2>
      <p className="text-muted-foreground leading-relaxed">
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
    <div className="flex flex-col gap-3">
      <h2 className="text-2xl font-bold tracking-tight">{d.step2Title}</h2>
      <p className="text-muted-foreground mb-2 leading-relaxed">
        {d.step2Description}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {FEATURES.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="bg-muted/50 flex items-center gap-2.5 rounded-lg p-2.5"
          >
            <Icon className="text-primary size-4 shrink-0" />
            <span className="text-sm">{d.features[key]}</span>
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
    <div className="flex flex-col gap-3">
      <h2 className="text-2xl font-bold tracking-tight">{d.step3Title}</h2>
      <p className="text-muted-foreground mb-2 leading-relaxed">
        {d.step3Description}
      </p>
      <div className="space-y-2">
        {QUICK_ACTIONS.map(({ key, icon: Icon }) => (
          <div key={key} className="flex items-center gap-3 py-1">
            <div className="bg-primary/10 flex size-7 items-center justify-center rounded-md">
              <Icon className="text-primary size-3.5" />
            </div>
            <span className="text-sm">{d.quickActions[key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
