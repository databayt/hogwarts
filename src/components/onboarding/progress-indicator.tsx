import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressIndicatorProps {
  value: number; // 0-100
  label?: string;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ value, label, className }) => (
  <div className={className}>
    {label && <div className="mb-1 sm:mb-2 text-xs sm:text-sm text-muted-foreground">{label}</div>}
    <Progress value={value} className="h-1 sm:h-2" />
  </div>
);

export default ProgressIndicator; 