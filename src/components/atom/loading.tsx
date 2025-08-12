'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  onComplete: () => void
}

export const Loading: React.FC<LoadingProps> = ({ onComplete }) => {
  const [count, setCount] = useState(0)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)

  useEffect(() => {
    if (count < 100) {
      const timeout = setTimeout(() => {
        const increment = Math.floor(Math.random() * 8) + 1
        setCount((prev) => Math.min(prev + increment, 100))
      }, 50 + Math.random() * 100)

      return () => clearTimeout(timeout)
    } else {
      const animationTimeout = setTimeout(() => {
        setIsAnimatingOut(true)
      }, 200)

      // 200ms delay + 800ms animation = 1000ms
      const completeTimeout = setTimeout(onComplete, 1000)

      return () => {
        clearTimeout(animationTimeout)
        clearTimeout(completeTimeout)
      }
    }
  }, [count, onComplete])

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white dark:bg-black">
      {/* Clipping container for the single-line reveal effect */}
      <div className="flex h-3 items-center justify-center overflow-hidden">
        <div
          className={cn(
            'text-black dark:text-white text-[12px] font-medium leading-[12px] transition-transform duration-[1400ms] ease-out',
            isAnimatingOut ? '-translate-y-6' : 'translate-y-0',
          )}
        >
          {count}%
        </div>
      </div>
    </div>
  )
}