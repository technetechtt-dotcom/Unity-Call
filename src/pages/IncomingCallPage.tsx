import React, { useEffect } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { Phone, PhoneOff, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
interface IncomingCallPageProps {
  onAccept: () => void;
  onReject: () => void;
  callerName?: string;
}
export function IncomingCallPage({
  onAccept,
  onReject,
  callerName = 'Thandi Nkosi'
}: IncomingCallPageProps) {
  const { highContrast } = useAccessibility();
  // Simulate vibration pattern
  useEffect(() => {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
    }
  }, []);
  return (
    <div
      className={`
      flex flex-col h-full relative overflow-hidden
      ${highContrast ? 'bg-black' : 'bg-gradient-to-b from-teal-900 to-gray-900'}
    `}>
      
      {/* Visual Alert Flash */}
      <motion.div
        className="absolute inset-0 bg-white/10 pointer-events-none"
        animate={{
          opacity: [0, 0.2, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5
        }} />
      

      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10">
        {/* Caller Info */}
        <div className="mb-12 relative">
          <motion.div
            className="absolute inset-0 rounded-full bg-white/20"
            animate={{
              scale: [1, 1.5],
              opacity: [0.5, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 2
            }} />
          
          <div
            className={`
            w-32 h-32 rounded-full flex items-center justify-center text-3xl font-bold relative z-10
            ${highContrast ? 'bg-white text-black border-4 border-white' : 'bg-purple-200 text-purple-800 shadow-2xl'}
          `}>
            
            TN
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
          {callerName}
        </h1>
        <p className="text-xl text-teal-100 mb-8 font-medium">
          Incoming Call...
        </p>

        {/* Accessibility Indicators */}
        <div
          className={`
          px-4 py-2 rounded-full mb-8 flex items-center space-x-2
          ${highContrast ? 'bg-gray-800 border border-white' : 'bg-black/30 backdrop-blur-sm'}
        `}>
          
          <MessageSquare size={16} className="text-yellow-400" />
          <span className="text-white text-sm font-medium">
            This caller uses captions
          </span>
        </div>

        <div className="text-white/60 text-sm flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Vibration Active</span>
        </div>
      </main>

      {/* Actions */}
      <footer className="p-8 pb-12 z-10">
        <div className="flex justify-between items-center gap-6">
          <button
            onClick={onReject}
            className={`
              flex-1 flex flex-col items-center justify-center py-6 rounded-2xl space-y-2 transition-transform active:scale-95
              ${highContrast ? 'bg-red-900 border-2 border-white text-white' : 'bg-danger text-white shadow-lg shadow-red-900/20'}
            `}
            aria-label="Reject call">
            
            <PhoneOff size={32} />
            <span className="font-bold text-lg">Reject</span>
          </button>

          <button
            onClick={onAccept}
            className={`
              flex-1 flex flex-col items-center justify-center py-6 rounded-2xl space-y-2 transition-transform active:scale-95
              ${highContrast ? 'bg-green-900 border-2 border-white text-white' : 'bg-success text-white shadow-lg shadow-green-900/20'}
            `}
            aria-label="Accept call">
            
            <Phone size={32} />
            <span className="font-bold text-lg">Accept</span>
          </button>
        </div>
      </footer>
    </div>);

}