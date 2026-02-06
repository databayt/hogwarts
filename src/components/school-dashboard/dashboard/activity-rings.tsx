"use client"

import * as React from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { ActivityRingData, ActivityRingsProps } from "./types"

function CircleProgress({
  data,
  index,
  size,
}: {
  data: ActivityRingData
  index: number
  size: number
}) {
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = ((100 - data.value) / 100) * circumference

  const gradientId = `gradient-${data.label.toLowerCase().replace(/\s+/g, "-")}-${index}`

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: index * 0.15, ease: "easeOut" }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-label={`${data.label} - ${data.value}%`}
      >
        <title>{`${data.label} - ${data.value}%`}</title>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              style={{ stopColor: data.color, stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: data.color, stopOpacity: 0.6 }}
            />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progress }}
          transition={{ duration: 1.5, delay: index * 0.15, ease: "easeInOut" }}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.1))" }}
        />
      </svg>
    </motion.div>
  )
}

export function ActivityRings({
  activities,
  title,
  className,
}: ActivityRingsProps) {
  const sizes = [160, 130, 100]

  return (
    <Card className={cn("p-6", className)}>
      {title && (
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="flex items-center gap-6">
          <div className="relative h-[160px] w-[160px]">
            {activities.slice(0, 3).map((activity, index) => (
              <CircleProgress
                key={activity.label}
                data={activity}
                index={index}
                size={sizes[index] || 80}
              />
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {activities.slice(0, 3).map((activity) => (
              <motion.div
                key={activity.label}
                className="flex flex-col"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {activity.label}
                </span>
                <span
                  className="text-lg font-semibold"
                  style={{ color: activity.color }}
                >
                  {activity.current}/{activity.target}
                  <span className="text-muted-foreground ms-1 text-sm">
                    {activity.unit}
                  </span>
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
