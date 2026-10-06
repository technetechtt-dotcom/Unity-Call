import React, { useCallback, useState, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAccessibility } from '../context/AccessibilityContext';
export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}
interface ToastContextType {
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}
const ToastContext = createContext<ToastContextType | undefined>(undefined);
export function ToastProvider({ children }: {children: ReactNode;}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  const addToast = useCallback(
    (message: string, type: ToastType, duration = 3000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type,
        duration
      }]
      );
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );
  return (
    <ToastContext.Provider
      value={{
        addToast,
        removeToast
      }}>
      
      {children}
      <div className="absolute top-16 left-0 right-0 z-50 flex flex-col items-center pointer-events-none px-4 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) =>
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>);

}
function ToastItem({
  toast,
  onDismiss



}: {toast: Toast;onDismiss: (id: string) => void;}) {
  const { highContrast } = useAccessibility();
  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />,
    warning: <AlertTriangle size={20} />
  };
  const colors = {
    success: highContrast ?
    'bg-green-900 border-2 border-white text-white' :
    'bg-green-100 text-green-800 border border-green-200',
    error: highContrast ?
    'bg-red-900 border-2 border-white text-white' :
    'bg-red-100 text-red-800 border border-red-200',
    info: highContrast ?
    'bg-blue-900 border-2 border-white text-white' :
    'bg-blue-100 text-blue-800 border border-blue-200',
    warning: highContrast ?
    'bg-yellow-900 border-2 border-white text-white' :
    'bg-yellow-100 text-yellow-800 border border-yellow-200'
  };
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -20,
        scale: 0.9
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }}
      exit={{
        opacity: 0,
        scale: 0.9,
        transition: {
          duration: 0.2
        }
      }}
      className={`
        pointer-events-auto flex items-center w-full max-w-sm p-4 rounded-xl shadow-lg
        ${colors[toast.type]}
      `}
      role="alert">
      
      <div className="flex-shrink-0 mr-3">{icons[toast.type]}</div>
      <div className="flex-1 font-medium text-sm">{toast.message}</div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-3 flex-shrink-0 opacity-70 hover:opacity-100 focus:outline-none"
        aria-label="Dismiss notification">
        
        <X size={16} />
      </button>
    </motion.div>);

}
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}