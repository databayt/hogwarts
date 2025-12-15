"use client"

import { useEffect, useState } from "react"

const Clock = () => {
  const [isReverse, setIsReverse] = useState(false)
  const [transitionSpeed, setTransitionSpeed] = useState(1) // 1 is normal speed, -1 is full reverse

  // Smooth transition function using easing
  const easeInOutQuad = (t: number) => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  }

  useEffect(() => {
    // Toggle between forward and reverse every 10 seconds
    const toggleInterval = setInterval(() => {
      setIsReverse((prev) => !prev)
    }, 10000)

    return () => clearInterval(toggleInterval)
  }, [])

  // Handle smooth transition when direction changes
  useEffect(() => {
    if (isReverse) {
      // Gradually transition to reverse over 1 second
      const startTime = Date.now()
      const transitionDuration = 1000 // 1 second transition

      const transitionToReverse = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / transitionDuration, 1)

        // Use easing function for smooth acceleration
        const easedProgress = easeInOutQuad(progress)
        setTransitionSpeed(1 - easedProgress * 2) // Transition from 1 to -1

        if (progress < 1) {
          requestAnimationFrame(transitionToReverse)
        }
      }

      requestAnimationFrame(transitionToReverse)
    } else {
      // Gradually transition back to normal over 1 second
      const startTime = Date.now()
      const transitionDuration = 1000

      const transitionToNormal = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / transitionDuration, 1)

        // Use easing function for smooth deceleration
        const easedProgress = easeInOutQuad(progress)
        setTransitionSpeed(-1 + easedProgress * 2) // Transition from -1 to 1

        if (progress < 1) {
          requestAnimationFrame(transitionToNormal)
        }
      }

      requestAnimationFrame(transitionToNormal)
    }
  }, [isReverse])

  useEffect(() => {
    let animationFrameId: number
    let startTime: number | null = null

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsedTime = timestamp - startTime

      // Get the local time
      const date = new Date()
      let seconds = date.getSeconds()
      let minutes = date.getMinutes()
      let hours = date.getHours()

      // Apply the transition speed to the time offset
      const timeOffset = (elapsedTime / 10) * Math.abs(transitionSpeed)

      if (transitionSpeed < 0) {
        // Apply reverse movement based on transition speed
        seconds = (seconds - timeOffset) % 60
        minutes = (minutes - timeOffset / 60) % 60
        hours = (hours - timeOffset / 3600) % 12

        // Ensure we don't get negative values
        if (seconds < 0) seconds += 60
        if (minutes < 0) minutes += 60
        if (hours < 0) hours += 12
      }

      // Calculate angles
      const hands = [
        {
          hand: "hours",
          angle: hours * 30 + minutes / 2,
        },
        {
          hand: "minutes",
          angle: minutes * 6,
        },
        {
          hand: "seconds",
          angle: seconds * 6,
        },
      ]

      // Update hand positions
      hands.forEach((hand) => {
        const elements = document.querySelectorAll("." + hand.hand)
        elements.forEach((element) => {
          const htmlElement = element as HTMLElement
          htmlElement.style.transform = `rotateZ(${hand.angle}deg)`
        })
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [transitionSpeed])

  return (
    <div className="items-center justify-center">
      <article className="clock simple">
        <div className="hours-container">
          <div className="hours"></div>
        </div>
        <div className="minutes-container">
          <div className="minutes"></div>
        </div>
        <div className="seconds-container">
          <div className="seconds"></div>
        </div>
      </article>
    </div>
  )
}

export default Clock
