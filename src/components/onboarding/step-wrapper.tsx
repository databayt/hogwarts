"use client"

import React from "react"

interface StepWrapperProps {
  children: React.ReactNode
}

export function StepWrapper({ children }: StepWrapperProps) {
  return <div className="mx-auto max-w-2xl">{children}</div>
}
