"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Info } from 'lucide-react'
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "./use-media-query"
import {Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader} from "@/components/ui/dialog";

export function AboutHoverCard() {
  const [isOpen, setIsOpen] = useState(false)
  const isSmallScreen = useMediaQuery("(max-width: 640px)")

  const AboutContent = () => (
    <>
      <div className="muted space-y-2 break-all mb-2">
        <p>• Click a subject cell to enter the teacher's name.</p>
        <p>• Use Settings to change school, grade, and class.</p>
        <p>• Data is loaded from NEIS API or local JSON (mock mode).</p>
        <p>• Teacher names may be truncated; please edit manually if needed.</p>
        <p>• Press <kbd>Ctrl/Cmd + P</kbd> to print with a clean layout.</p>
        <p>• Your inputs are stored locally in the browser.</p>
      </div>
      <div className="pt-2 border-t border-border">
        <p className="muted">
          Made by{" "}
          <Link
            href="https://github.com/injoon5"
            target="_blank"
            className="text-foreground hover:underline transition-colors duration-200"
          >
            @injoon5
          </Link>
          {" • "}
          <Link
            href="https://injoon5.com"
            target="_blank"
            className="text-foreground hover:underline transition-colors duration-200"
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
          <button
            className="p-2 rounded-full text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <Info className="w-5 h-5" />
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
      <Dialog
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <DialogTrigger asChild>
          <button
                className="p-2 rounded-lg flex flex-row items-center gap-2 text-muted-foreground hover:bg-muted/80 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
          >
            <Info className="w-5 h-5" /> About
          </button>
        </DialogTrigger>
        <DialogContent
          className={cn(
          "w-96",
              "rounded-lg max-w-lg p-6 backdrop-blur-sm"
          )}
        >
          <DialogHeader>
          <DialogTitle>About</DialogTitle>
          </DialogHeader>
          <AboutContent />
        </DialogContent>
      </Dialog>
  )
}
