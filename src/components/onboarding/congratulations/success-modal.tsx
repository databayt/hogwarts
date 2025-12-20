"use client"

import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import confetti from "canvas-confetti"
import { motion } from "framer-motion"
import {
  Calendar,
  CheckCircle,
  ExternalLink,
  GraduationCap,
  School,
  Settings2,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Modal } from "@/components/atom/modal"
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface SuccessModalProps {
  schoolData: {
    name: string
    domain: string
    id: string
  }
  showModal: boolean
  setShowModal: Dispatch<SetStateAction<boolean>>
  onGoToDashboard: () => void
}

export default function SuccessModal({
  schoolData,
  showModal,
  setShowModal,
  onGoToDashboard,
}: SuccessModalProps) {
  const { dictionary } = useDictionary()
  const [step, setStep] = useState<"celebration" | "nextSteps">("celebration")

  useEffect(() => {
    if (showModal) {
      // Trigger confetti animation
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 100000,
      }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        // Confetti from left
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"],
        })

        // Confetti from right
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"],
        })
      }, 250)

      // Auto-transition to next steps after animation
      setTimeout(() => {
        setStep("nextSteps")
      }, 4000)
    }
  }, [showModal])

  const nextStepsCards = [
    {
      icon: Users,
      color: "blue",
      title:
        dictionary?.marketing?.onboarding?.success?.inviteTeam ||
        "Invite Your Team",
      description:
        dictionary?.marketing?.onboarding?.success?.inviteTeamDesc ||
        "Add teachers and staff to your school",
    },
    {
      icon: GraduationCap,
      color: "purple",
      title:
        dictionary?.marketing?.onboarding?.success?.addStudents ||
        "Add Students",
      description:
        dictionary?.marketing?.onboarding?.success?.addStudentsDesc ||
        "Import or manually add your students",
    },
    {
      icon: Calendar,
      color: "green",
      title:
        dictionary?.marketing?.onboarding?.success?.setUpClasses ||
        "Set Up Classes",
      description:
        dictionary?.marketing?.onboarding?.success?.setUpClassesDesc ||
        "Create classes and assign teachers",
    },
    {
      icon: Settings2,
      color: "orange",
      title:
        dictionary?.marketing?.onboarding?.success?.configureSettings ||
        "Configure Settings",
      description:
        dictionary?.marketing?.onboarding?.success?.configureSettingsDesc ||
        "Customize your school settings",
    },
  ]

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="h-full max-w-full md:h-full md:max-w-full md:rounded-none"
      preventDefaultClose={step === "celebration"}
    >
      <div className="from-primary/5 via-background to-secondary/5 relative h-screen w-full overflow-hidden bg-gradient-to-br">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-primary/10 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl" />
          <div className="bg-secondary/10 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl" />
          <div className="bg-primary/5 absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center p-6 md:p-12">
          {step === "celebration" ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-2xl text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
                className="from-chart-2 to-chart-2 mb-8 inline-flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br shadow-2xl"
              >
                <CheckCircle className="h-20 w-20 text-white" />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="from-primary to-secondary mb-4 bg-gradient-to-r bg-clip-text text-5xl font-bold text-transparent md:text-7xl">
                  {dictionary?.marketing?.onboarding?.success
                    ?.congratulations || "Congratulations!"}
                </h1>
                <div className="mb-6 flex items-center justify-center gap-2">
                  <Sparkles className="text-chart-4 h-6 w-6" />
                  <Trophy className="text-chart-4 h-8 w-8" />
                  <Sparkles className="text-chart-4 h-6 w-6" />
                </div>
                <h2 className="text-muted-foreground mb-2">
                  {schoolData.name}
                </h2>
                <p className="lead text-muted-foreground md:text-xl">
                  {dictionary?.marketing?.onboarding?.success?.schoolLive ||
                    "Your school is now live and ready to transform education!"}
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-primary/10 border-primary/20 mt-12 rounded-2xl border p-6 backdrop-blur-sm"
              >
                <div className="mb-2 flex items-center gap-3">
                  <School className="text-primary h-5 w-5" />
                  <p className="muted">Your school's portal:</p>
                </div>
                <h3 className="text-primary">
                  {schoolData.domain}.databayt.org
                </h3>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-6xl"
            >
              <div className="mb-12 text-center">
                <div className="from-primary to-secondary mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <h2 className="mb-4 text-4xl font-bold md:text-5xl">
                  {dictionary?.marketing?.onboarding?.success?.letsGetStarted ||
                    "Let's Get Started!"}
                </h2>
                <p className="lead text-muted-foreground">
                  Your next steps to set up {schoolData.name}
                </p>
              </div>

              <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
                {nextStepsCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className="hover:border-primary/30 cursor-pointer border-2 p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                      onClick={onGoToDashboard}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "rounded-xl p-3",
                            card.color === "blue" && "bg-chart-1/10",
                            card.color === "purple" && "bg-chart-3/10",
                            card.color === "green" && "bg-chart-2/10",
                            card.color === "orange" && "bg-chart-1/10"
                          )}
                        >
                          <card.icon
                            className={cn(
                              "h-8 w-8",
                              card.color === "blue" && "text-chart-1",
                              card.color === "purple" && "text-chart-3",
                              card.color === "green" && "text-chart-2",
                              card.color === "orange" && "text-chart-1"
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="mb-2">{card.title}</h4>
                          <p className="text-muted-foreground">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col justify-center gap-4 md:flex-row"
              >
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-6"
                >
                  {dictionary?.marketing?.onboarding?.success?.continueLater ||
                    "Continue Setup Later"}
                </Button>
                <Button
                  size="lg"
                  onClick={onGoToDashboard}
                  className="from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 gap-2 bg-gradient-to-r px-8 py-6"
                >
                  {dictionary?.marketing?.onboarding?.success?.goToDashboard ||
                    "Go to School Dashboard"}
                  <ExternalLink className="h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </Modal>
  )
}
