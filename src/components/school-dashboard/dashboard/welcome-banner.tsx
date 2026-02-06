"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

import type { WelcomeBannerProps } from "./types"

export function WelcomeBanner({
  userName,
  role,
  greeting,
  subtitle,
  className,
}: WelcomeBannerProps) {
  const [currentTime, setCurrentTime] = React.useState<string>("")
  const [currentDate, setCurrentDate] = React.useState<string>("")

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      )
      setCurrentDate(
        now.toLocaleDateString([], {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const getGreeting = () => {
    if (greeting) return greeting
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <Card
      className={cn(
        "from-primary/10 via-primary/5 border-primary/20 bg-gradient-to-r to-transparent",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <motion.h2
              className="text-foreground text-2xl font-semibold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {getGreeting()}
              {userName ? `, ${userName}` : ""}
            </motion.h2>
            <motion.p
              className="text-muted-foreground mt-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {subtitle || `Welcome to your ${role || "dashboard"}`}
            </motion.p>
          </div>
          <div className="hidden text-end sm:block">
            <div className="text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-foreground text-2xl font-medium">
                {currentTime}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">{currentDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
