"use client"

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

import { useMediaQuery } from "./use-media-query"

export function AboutHoverCard() {
  const [isOpen, setIsOpen] = useState(false)
  const isSmallScreen = useMediaQuery("(max-width: 640px)")

  const AboutContent = () => (
    <>
      <div className="muted mb-2 space-y-2 break-all">
        <p>• Click a subject cell to enter the teacher's name.</p>
        <p>• Use Settings to change school, grade, and class.</p>
        <p>• Data is loaded from NEIS API or local JSON (mock mode).</p>
        <p>• Teacher names may be truncated; please edit manually if needed.</p>
        <p>
          • Press <kbd>Ctrl/Cmd + P</kbd> to print with a clean layout.
        </p>
        <p>• Your inputs are stored locally in the browser.</p>
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
            <DrawerTitle>About</DrawerTitle>
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
          <Info className="h-5 w-5" /> About
        </button>
      </DialogTrigger>
      <DialogContent
        className={cn("w-96", "max-w-lg rounded-lg p-6 backdrop-blur-sm")}
      >
        <DialogHeader>
          <DialogTitle>About</DialogTitle>
        </DialogHeader>
        <AboutContent />
      </DialogContent>
    </Dialog>
  )
}
