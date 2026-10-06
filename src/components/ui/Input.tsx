import React, { useState } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Eye, EyeOff } from 'lucide-react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}
export function Input({
  label,
  error,
  helperText,
  id,
  type = 'text',
  className = '',
  ...props
}: InputProps) {
  const { highContrast } = useAccessibility();
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const isPassword = type === 'password';
  const inputType = isPassword ? showPassword ? 'text' : 'password' : type;
  return (
    <div className="flex flex-col space-y-2 mb-4">
      <label
        htmlFor={inputId}
        className={`
          font-semibold text-base
          ${highContrast ? 'text-white' : 'text-gray-700'}
        `}>
        
        {label}
      </label>

      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          className={`
            w-full px-4 py-3 rounded-xl border-2 transition-colors
            focus:outline-none focus:ring-4 focus:ring-offset-1
            disabled:bg-gray-100 disabled:text-gray-500
            ${error ? 'border-danger focus:ring-danger/30' : highContrast ? 'bg-gray-900 border-white text-white focus:border-yellow-400 focus:ring-yellow-400' : 'bg-white border-gray-300 text-gray-900 focus:border-primary focus:ring-primary/30'}
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={
          error ?
          `${inputId}-error` :
          helperText ?
          `${inputId}-helper` :
          undefined
          }
          {...props} />
        

        {isPassword &&
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
          aria-label={showPassword ? 'Hide password' : 'Show password'}>
          
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        }
      </div>

      {error &&
      <span
        id={`${inputId}-error`}
        className={`text-sm font-medium ${highContrast ? 'text-red-300' : 'text-danger'}`}
        role="alert">
        
          {error}
        </span>
      }

      {helperText && !error &&
      <span
        id={`${inputId}-helper`}
        className={`text-sm ${highContrast ? 'text-gray-300' : 'text-gray-500'}`}>
        
          {helperText}
        </span>
      }
    </div>);

}