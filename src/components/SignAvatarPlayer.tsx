import React, { useEffect, useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { User, Play, Pause, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface SignAvatarPlayerProps {
  text: string;
  isActive: boolean;
  size?: 'compact' | 'full';
  onComplete?: () => void;
}
export function SignAvatarPlayer({
  text,
  isActive,
  size = 'compact',
  onComplete
}: SignAvatarPlayerProps) {
  const { highContrast } = useAccessibility();
  const [isSigning, setIsSigning] = useState(false);
  const [progress, setProgress] = useState(0);
  // Simulate signing duration based on text length
  useEffect(() => {
    if (isActive && text) {
      setIsSigning(true);
      setProgress(0);
      // Estimate duration: ~0.5s per word
      const wordCount = text.split(' ').length;
      const duration = Math.max(2000, wordCount * 500);
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(100, elapsed / duration * 100);
        setProgress(newProgress);
        if (elapsed >= duration) {
          clearInterval(interval);
          setIsSigning(false);
          if (onComplete) onComplete();
        }
      }, 50);
      return () => clearInterval(interval);
    } else {
      setIsSigning(false);
      setProgress(0);
    }
  }, [text, isActive, onComplete]);
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl flex items-center justify-center
        ${size === 'compact' ? 'w-32 h-40' : 'w-full h-64'}
        ${highContrast ? 'bg-black border-2 border-white' : 'bg-gradient-to-b from-indigo-900 to-purple-900'}
      `}>
      
      {/* Avatar Visual (Simulated) */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          animate={
          isSigning ?
          {
            y: [0, -5, 0],
            rotate: [0, -2, 2, 0],
            scale: [1, 1.02, 1]
          } :
          {
            y: 0,
            rotate: 0,
            scale: 1
          }
          }
          transition={{
            repeat: isSigning ? Infinity : 0,
            duration: 2,
            ease: 'easeInOut'
          }}
          className={`
            rounded-full flex items-center justify-center mb-2
            ${size === 'compact' ? 'w-16 h-16' : 'w-24 h-24'}
            ${highContrast ? 'bg-white text-black' : 'bg-indigo-200 text-indigo-900'}
          `}>
          
          <User size={size === 'compact' ? 32 : 48} />
        </motion.div>

        {/* Hands (Simulated) */}
        <div className="flex space-x-8 absolute top-1/2 w-full justify-center pointer-events-none">
          <motion.div
            animate={
            isSigning ?
            {
              y: [0, -20, 10, 0],
              x: [0, 10, -5, 0],
              rotate: [0, 15, -10, 0]
            } :
            {
              y: 20,
              opacity: 0
            }
            }
            transition={{
              repeat: Infinity,
              duration: 1.5
            }}
            className={`w-8 h-8 rounded-full ${highContrast ? 'bg-white' : 'bg-indigo-300'}`} />
          
          <motion.div
            animate={
            isSigning ?
            {
              y: [0, -15, 20, 0],
              x: [0, -10, 5, 0],
              rotate: [0, -15, 10, 0]
            } :
            {
              y: 20,
              opacity: 0
            }
            }
            transition={{
              repeat: Infinity,
              duration: 1.5,
              delay: 0.2
            }}
            className={`w-8 h-8 rounded-full ${highContrast ? 'bg-white' : 'bg-indigo-300'}`} />
          
        </div>
      </div>

      {/* Status Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-xs text-center">
        {isSigning ?
        <div className="flex flex-col items-center">
            <span className="font-medium mb-1 line-clamp-1">{text}</span>
            <div className="w-full h-1 bg-gray-600 rounded-full overflow-hidden">
              <div
              className="h-full bg-teal-400 transition-all duration-100"
              style={{
                width: `${progress}%`
              }} />
            
            </div>
          </div> :

        <span className="opacity-70">Avatar Idle</span>
        }
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent" />
      </div>
    </div>);

}