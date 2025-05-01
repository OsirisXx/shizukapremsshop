import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
}) => {
  const getTabClasses = (tabId: string) => {
    const isActive = tabId === activeTab;
    
    const baseClasses = 'flex items-center justify-center transition-colors focus:outline-none';
    
    const variantClasses = {
      default: clsx(
        'border-b-2',
        isActive 
          ? 'border-peach-500 text-peach-600 font-medium' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      ),
      pills: clsx(
        'rounded-full',
        isActive 
          ? 'bg-peach-500 text-white' 
          : 'text-gray-600 hover:bg-gray-100'
      ),
      underline: clsx(
        'border-b-2 -mb-px',
        isActive 
          ? 'border-peach-500 text-peach-600 font-medium' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      ),
    };
    
    const sizeClasses = {
      sm: variant === 'pills' ? 'px-3 py-1 text-sm' : 'px-2 py-2 text-sm',
      md: variant === 'pills' ? 'px-4 py-2' : 'px-4 py-3',
      lg: variant === 'pills' ? 'px-6 py-3 text-lg' : 'px-6 py-4 text-lg',
    };
    
    return clsx(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && 'flex-1',
    );
  };
  
  const containerClasses = clsx(
    'flex',
    variant === 'underline' && 'border-b border-gray-200',
    fullWidth ? 'w-full' : 'inline-flex',
    className
  );

  return (
    <div className={containerClasses}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={getTabClasses(tab.id)}
          onClick={() => onChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
          
          {variant === 'default' && activeTab === tab.id && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-peach-500"
              layoutId="activeTab"
              transition={{ duration: 0.3 }}
            />
          )}
        </button>
      ))}
    </div>
  );
};