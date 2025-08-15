"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface SelectionCardProps {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  isSelected?: boolean;
  onClick?: (id: string) => void;
  className?: string;
  compact?: boolean;
  disabled?: boolean;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  id,
  title,
  description,
  icon,
  isSelected = false,
  onClick,
  className,
  compact = false,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(id);
    }
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 bg-background border hover:border-foreground/50 min-h-[50px] sm:min-h-[60px]',
        isSelected && 'border-foreground bg-accent',
        disabled && 'cursor-not-allowed opacity-50',
        compact ? 'p-2 sm:p-3' : 'p-4 sm:p-4',
        className
      )}
      onClick={handleClick}
    >
      <div className={cn(
        'flex items-center',
        compact ? 'flex-col space-y-2' : description ? 'justify-between' : 'space-x-3'
      )}>
        <div className={cn('flex', compact ? 'flex-col items-center space-y-1' : 'flex-1 items-center space-x-3')}>
          {icon && !description && (
            <div className={cn(
              'flex-shrink-0',
              isSelected ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {icon}
            </div>
          )}
          <div className={cn(compact && 'text-center', 'min-w-0 flex-1')}>
            <h6 className={cn(
              isSelected ? 'text-foreground' : 'text-foreground',
              'text-xs font-medium'
            )}>
              {title}
            </h6>
            {description && !compact && (
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {icon && !compact && (
          <div className={cn(
            'flex-shrink-0 ml-2 sm:ml-4',
            isSelected ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default SelectionCard; 