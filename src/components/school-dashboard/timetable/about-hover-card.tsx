"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import Link from "next/link"
import { Info } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { useMediaQuery } from "./use-media-query"

export function AboutHoverCard() {
  const { dictionary } = useDictionary()
  const ai = (dictionary?.school?.timetable as Record<string, any>)?.aboutInfo
  const [isOpen, setIsOpen] = useState(false)
  const isSmallScreen = useMediaQuery("(max-width: 640px)")

  const AboutContent = () => (
    <>
      <div className="muted mb-2 space-y-2 break-all">
        <p>
          •{" "}
          {ai?.features?.autoGenerate ??
            "Click a subject cell to enter the teacher's name."}
        </p>
        <p>
          •{" "}
          {ai?.features?.conflictDetection ??
            "Use Settings to change school, grade, and class."}
        </p>
        <p>
          •{" "}
          {ai?.features?.substitutions ??
            "Data is loaded from NEIS API or local JSON (mock mode)."}
        </p>
        <p>
          •{" "}
          {ai?.features?.analytics ??
            "Teacher names may be truncated; please edit manually if needed."}
        </p>
        <p>
          •{" "}
          {ai?.description ??
            "Press Ctrl/Cmd + P to print with a clean layout."}
        </p>
        <p>
          •{" "}
          {ai?.lastUpdated ?? "Your inputs are stored locally in the browser."}
        </p>
      </div>
      <div className="border-border border-t pt-2">
        <p className="muted">
          Made by{" "}
          <Link
            href="https://github.com/injoon5"
            target="_blank"
            className="text-foreground transition-colors duration-200 hover:underline"
          >
            @injoon5
          </Link>
          {" • "}
          <Link
            href="https://injoon5.com"
            target="_blank"
            className="text-foreground transition-colors duration-200 hover:underline"
          >
            Website
          </Link>
        </p>
      </div>
    </>
  )

  if (isSmallScreen) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <button className="text-muted-foreground hover:bg-muted/80 rounded-full p-2 transition-colors">
            <Info className="h-5 w-5" />
          </button>
        </DrawerTrigger>
        <DrawerContent className="h-[50%]">
          <DrawerHeader>
            <DrawerTitle>{ai?.title ?? "About"}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <AboutContent />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="text-muted-foreground hover:bg-muted/80 flex flex-row items-center gap-2 rounded-lg p-2 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Info className="h-5 w-5" /> {ai?.title ?? "About"}
        </button>
      </DialogTrigger>
      <DialogContent
        className={cn("w-96", "max-w-lg rounded-lg p-6 backdrop-blur-sm")}
      >
        <DialogHeader>
          <DialogTitle>{ai?.title ?? "About"}</DialogTitle>
        </DialogHeader>
        <AboutContent />
      </DialogContent>
    </Dialog>
  )
}
