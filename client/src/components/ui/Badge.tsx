import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
}

export function Badge({ children, className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-muted text-muted-foreground border border-border/50',
    success: 'bg-success/20 text-success border border-success/30',
    warning: 'bg-warning/20 text-warning border border-warning/30',
    error: 'bg-destructive/20 text-destructive border border-destructive/30',
    info: 'bg-neural-cyan/20 text-neural-cyan border border-neural-cyan/30',
    purple: 'bg-primary/20 text-primary border border-primary/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
