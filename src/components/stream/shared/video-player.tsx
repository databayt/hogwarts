"use client"

import { useEffect, useRef, useState } from "react"
import {
  Maximize,
  Pause,
  Play,
  Settings,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"

interface VideoPlayerProps {
  url: string
  title?: string
  onProgress?: (progress: number) => void
  onComplete?: () => void
  className?: string
  autoPlay?: boolean
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

export function VideoPlayer({
  url,
  title,
  onProgress,
  onComplete,
  className,
  autoPlay = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(100)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Play/Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  // Mute toggle
  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  // Volume change
  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return
    const newVolume = value[0]
    videoRef.current.volume = newVolume / 100
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  // Seek
  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return
    const newTime = value[0]
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Skip forward/backward
  const skip = (seconds: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime += seconds
  }

  // Playback speed
  const changePlaybackSpeed = (speed: number) => {
    if (!videoRef.current) return
    videoRef.current.playbackRate = speed
    setPlaybackSpeed(speed)
  }

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault()
          togglePlay()
          break
        case "m":
          toggleMute()
          break
        case "f":
          toggleFullscreen()
          break
        case "ArrowLeft":
          skip(-5)
          break
        case "ArrowRight":
          skip(5)
          break
        case "ArrowUp":
          e.preventDefault()
          handleVolumeChange([Math.min(volume + 10, 100)])
          break
        case "ArrowDown":
          e.preventDefault()
          handleVolumeChange([Math.max(volume - 10, 0)])
          break
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [volume, isPlaying])

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)

      // Report progress every 5 seconds
      if (onProgress && video.currentTime % 5 < 0.1) {
        const progress = (video.currentTime / video.duration) * 100
        onProgress(progress)
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    const handleEnded = () => {
      setIsPlaying(false)
      if (!isCompleted) {
        setIsCompleted(true)
        onComplete?.()
      }
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("ended", handleEnded)
    }
  }, [onProgress, onComplete, isCompleted])

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout

    const handleMouseMove = () => {
      setShowControls(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        if (isPlaying) setShowControls(false)
      }, 3000)
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("mousemove", handleMouseMove)
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove)
      }
      clearTimeout(timeout)
    }
  }, [isPlaying])

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative overflow-hidden rounded-md bg-black",
        className
      )}
    >
      <video
        ref={videoRef}
        src={url}
        className="h-full w-full"
        autoPlay={autoPlay}
        onClick={togglePlay}
      />

      {/* Controls */}
      <div
        className={cn(
          "absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4",
          "transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress bar */}
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={handleSeek}
          className="mb-4"
        />

        <div className="flex items-center justify-between gap-4">
          {/* Left controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-10)}
              className="text-white hover:bg-white/20"
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(10)}
              className="text-white hover:bg-white/20"
            >
              <SkipForward className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>

              <div className="hidden w-24 md:block">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                />
              </div>
            </div>

            <span className="text-sm text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {PLAYBACK_SPEEDS.map((speed) => (
                  <DropdownMenuItem
                    key={speed}
                    onClick={() => changePlaybackSpeed(speed)}
                    className={playbackSpeed === speed ? "bg-accent" : ""}
                  >
                    {speed}x
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Title overlay */}
      {title && (
        <div className="absolute top-0 right-0 left-0 bg-gradient-to-b from-black/60 to-transparent p-4">
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
      )}
    </div>
  )
}
