import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  onClick,
  interactive = false,
  bordered = false,
}) => {
  const cardClasses = clsx(
    'bg-white rounded-lg overflow-hidden shadow-sm',
    bordered && 'border border-gray-200',
    interactive && 'cursor-pointer transition-all hover:shadow-md',
    className
  );

  if (interactive) {
    return (
      <motion.div
        className={cardClasses}
        onClick={onClick}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={cardClasses}>{children}</div>;
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <div className={clsx('p-4 border-b border-gray-100', className)}>{children}</div>;
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <div className={clsx('p-4', className)}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <div className={clsx('p-4 border-t border-gray-100', className)}>{children}</div>;
};