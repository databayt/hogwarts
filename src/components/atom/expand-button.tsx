import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ExpandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'white';
  children: React.ReactNode;
  className?: string;
  href?: string;
}

const ExpandButton = ({ 
  variant = 'default', 
  children, 
  className,
  href,
  ...props 
}: ExpandButtonProps) => {
  const baseClasses = "rounded-2xl w-72 md:w-auto px-6 py-3 md:py-2 font-semibold transition-all duration-300 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:rounded-3xl hover:shadow-[4px_4px_0px_theme(colors.muted.foreground)] active:translate-x-[0px] active:translate-y-[0px] active:rounded-2xl active:shadow-none";
  
  const variantClasses = {
    default: "bg-emerald-700 text-background",
    outline: "border border-foreground text-foreground",
    white: "bg-background text-foreground border-2 border-background w-auto"
  };

  if (href) {
    return (
      <Link 
        href={href}
        className={cn(baseClasses, variantClasses[variant], className)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button 
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};

export default ExpandButton;