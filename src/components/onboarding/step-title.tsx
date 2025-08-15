import React from 'react';

interface StepTitleProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

const StepTitle: React.FC<StepTitleProps> = ({ title, description, className }) => (
  <div className={className}>
    <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight">
      {title}
    </h3>
    {description && (
      <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
        {description}
      </p>
    )}
  </div>
);

export default StepTitle; 