import React from "react"

interface IndicatorProps {
  totalSteps: number
  currentStep: number
}

const Indicator: React.FC<IndicatorProps> = ({ totalSteps, currentStep }) => {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, step) => (
        <div
          key={step}
          className={`h-3 w-3 rounded-full ${
            step + 1 === currentStep ? "bg-black" : "bg-gray-300"
          }`}
        />
      ))}
    </div>
  )
}

export default Indicator
