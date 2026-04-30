import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick, glass }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl transition-all duration-200',
        glass
          ? 'bg-white/10 backdrop-blur-md border border-white/20'
          : 'bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700/50',
        onClick && 'cursor-pointer hover:shadow-md active:scale-[0.98]',
        className
      )}
    >
      {children}
    </div>
  );
};
