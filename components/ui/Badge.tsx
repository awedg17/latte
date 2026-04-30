import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'income' | 'expense' | 'neutral' | 'gold';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className }) => {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
      variant === 'income' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      variant === 'expense' && 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      variant === 'neutral' && 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
      variant === 'gold' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      className
    )}>
      {children}
    </span>
  );
};
