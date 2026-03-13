"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ReactNode, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

const slideVariants = {
  enter: (d: number) => ({ x: d * 20, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d * -20, opacity: 0 }),
}

export interface WizardTab {
  id: string
  label: string
}

interface WizardTabsProps {
  tabs: WizardTab[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  children: (activeTab: string) => ReactNode
}

export function WizardTabs({
  tabs,
  activeTab: controlledTab,
  onTabChange,
  children,
}: WizardTabsProps) {
  const [internalTab, setInternalTab] = useState(tabs[0]?.id ?? "")
  const [direction, setDirection] = useState(1)

  const activeTab = controlledTab ?? internalTab
  const activeIndex = tabs.findIndex((t) => t.id === activeTab)
  const previousTab = activeIndex > 0 ? tabs[activeIndex - 1] : null

  const goToTab = (tabId: string) => {
    const targetIndex = tabs.findIndex((t) => t.id === tabId)
    setDirection(targetIndex > activeIndex ? 1 : -1)
    setInternalTab(tabId)
    onTabChange?.(tabId)
  }

  const goBack = () => {
    if (previousTab) {
      goToTab(previousTab.id)
    }
  }

  return (
    <div>
      {previousTab && (
        <button
          type="button"
          onClick={goBack}
          className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          <span>{previousTab.label}</span>
        </button>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={activeTab}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          {children(activeTab)}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
