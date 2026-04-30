import React from 'react';
import { cn } from '../../utils/cn';

interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  color?: 'green' | 'yellow' | 'red' | 'gold';
  size?: 'sm' | 'md';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value, className, color = 'gold', size = 'md'
}) => {
  const clamped = Math.min(100, Math.max(0, value));
  const danger = clamped >= 90;
  const warning = clamped >= 70 && clamped < 90;

  return (
    <div className={cn(
      'w-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700',
      size === 'sm' ? 'h-1.5' : 'h-2.5',
      className
    )}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500',
          danger ? 'bg-red-500' :
          warning ? 'bg-amber-500' :
          color === 'green' ? 'bg-emerald-500' :
          color === 'gold' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
          'bg-blue-500'
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
