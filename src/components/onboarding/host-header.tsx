import React from "react"
import Image from "next/image"
import { Bookmark, HelpCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

interface HostHeaderProps {
  onHelp?: () => void
  onSave?: () => void
}

const HostHeader: React.FC<HostHeaderProps> = ({ onHelp, onSave }) => {
  return (
    <header className="w-full py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Tent icon */}
        <div className="flex items-center">
          <div className="relative h-5 w-5">
            <Image
              src="/site/tent.png"
              alt="Tent icon"
              fill
              sizes="20px"
              className="object-contain"
            />
          </div>
        </div>

        {/* Right side - Help and Save buttons */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onHelp}
            className="rounded-full"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSave}
            className="rounded-full"
          >
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export default HostHeader
