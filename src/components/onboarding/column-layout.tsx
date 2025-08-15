import React from 'react';
import { cn } from '@/lib/utils';

interface ColumnLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  gap?: string; // e.g. 'gap-8', 'gap-12'
  className?: string;
}

const ColumnLayout: React.FC<ColumnLayoutProps> = ({ left, right, gap = 'gap-6 lg:gap-12', className }) => (
  <div className={cn('grid grid-cols-1 lg:grid-cols-2', gap, className)}>
    <div className="order-2 lg:order-1">{left}</div>
    <div className="order-1 lg:order-2">{right}</div>
  </div>
);

export default ColumnLayout; 