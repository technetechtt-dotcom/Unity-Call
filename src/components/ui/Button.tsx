import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className = '',
  ...props
}: ButtonProps) {
  const { highContrast } = useAccessibility();
  const baseStyles =
  'inline-flex items-center justify-center font-semibold rounded-full transition-all focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: highContrast ?
    'bg-primary-dark text-white border-2 border-white hover:bg-black' :
    'bg-primary text-white hover:bg-primary-dark focus:ring-primary/50 shadow-md',
    secondary: highContrast ?
    'bg-gray-800 text-white border-2 border-white' :
    'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500/50',
    danger: highContrast ?
    'bg-red-900 text-white border-2 border-white' :
    'bg-danger text-white hover:bg-danger-hover focus:ring-danger/50 shadow-md',
    success: highContrast ?
    'bg-green-900 text-white border-2 border-white' :
    'bg-success text-white hover:bg-success-hover focus:ring-success/50 shadow-md',
    outline: highContrast ?
    'bg-transparent border-2 border-white text-white' :
    'bg-transparent border-2 border-primary text-primary hover:bg-primary/5 focus:ring-primary/50',
    ghost: 'bg-transparent text-primary hover:bg-primary/10'
  };
  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[36px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]'
  };
  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}>
      
      {icon &&
      <span className="mr-2" aria-hidden="true">
          {icon}
        </span>
      }
      {children}
    </button>);

}