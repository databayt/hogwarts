import React from "react"

interface StepTitleProps {
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
}

const StepTitle: React.FC<StepTitleProps> = ({
  title,
  description,
  className,
}) => (
  <div className={className}>
    <h3 className="text-xl leading-tight font-semibold sm:text-2xl lg:text-3xl">
      {title}
    </h3>
    {description && (
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:mt-3 sm:text-base">
        {description}
      </p>
    )}
  </div>
)

export default StepTitle
