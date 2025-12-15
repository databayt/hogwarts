"use client"

import { ImgHTMLAttributes, useEffect, useRef, useState } from "react"
import Image from "next/image"

import { usePerformanceOptimization } from "@/lib/performance-optimization"
import { cn } from "@/lib/utils"

interface OptimizedImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src"
> {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  fallback?: string
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  fallback = "/images/placeholder.png",
  className,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src)
  const [isLoading, setIsLoading] = useState(true)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)
  const { shouldLazyLoad, getOptimizedImageUrl, isSlowConnection } =
    usePerformanceOptimization()

  // Optimize image URL based on network conditions
  useEffect(() => {
    const optimizedUrl = getOptimizedImageUrl(src, width)
    setImageSrc(optimizedUrl)
  }, [src, width, getOptimizedImageUrl])

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!shouldLazyLoad("image") || priority) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            if (imgRef.current) {
              observer.unobserve(imgRef.current)
            }
          }
        })
      },
      {
        rootMargin: isSlowConnection ? "50px" : "200px",
        threshold: 0.01,
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current)
      }
    }
  }, [shouldLazyLoad, priority, isSlowConnection])

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setImageSrc(fallback)
    setIsLoading(false)
    onError?.()
  }

  // For Next.js Image component (when dimensions are known)
  if (width && height) {
    return (
      <div ref={imgRef} className={cn("relative", className)}>
        {isLoading && (
          <div
            className="bg-muted absolute inset-0 animate-pulse rounded"
            style={{ width, height }}
          />
        )}
        {isInView && (
          <Image
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "transition-opacity duration-300",
              isLoading ? "opacity-0" : "opacity-100",
              className
            )}
            {...props}
          />
        )}
      </div>
    )
  }

  // For regular img element (when dimensions are unknown)
  return (
    <div ref={imgRef} className={cn("relative", className)}>
      {isLoading && (
        <div className="bg-muted absolute inset-0 animate-pulse rounded" />
      )}
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          {...props}
        />
      )}
    </div>
  )
}
