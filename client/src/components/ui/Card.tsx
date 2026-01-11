import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glow' | 'interactive' | 'glass';
  glowColor?: 'cyan' | 'purple' | 'green' | 'orange';
}

export function Card({
  children,
  className,
  variant = 'default',
  glowColor = 'cyan',
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-card/90 border border-border/50 backdrop-blur-sm',
    glow: cn(
      'bg-card/90 backdrop-blur-sm',
      glowColor === 'cyan' && 'border border-neural-cyan/30 glow-cyan',
      glowColor === 'purple' && 'border border-primary/30 glow-violet',
      glowColor === 'green' && 'border border-success/30 glow-success',
      glowColor === 'orange' && 'border border-warning/30'
    ),
    interactive:
      'bg-card/90 border border-border/50 backdrop-blur-sm glass-card-hover cursor-pointer',
    glass:
      'glass-card',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-4 md:p-5 transition-all duration-300',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between mb-4 pb-3 border-b border-border/30', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-base md:text-lg font-semibold text-foreground flex items-center gap-2',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('text-foreground text-sm md:text-base', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-4 pt-3 border-t border-border/30 flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}
