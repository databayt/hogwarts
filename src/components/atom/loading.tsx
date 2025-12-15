import React from "react"

interface LoadingProps {
  onComplete?: () => void
}

const Loading: React.FC<LoadingProps> = ({ onComplete }) => {
  React.useEffect(() => {
    if (onComplete) {
      // Simulate loading completion after a short delay
      const timer = setTimeout(() => {
        onComplete()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [onComplete])

  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="border-foreground/20 border-t-foreground h-9 w-9 animate-spin rounded-full border-2"></div>
      </div>
    </div>
  )
}

export default Loading
