import React, { useEffect, useState, useRef } from 'react';
import { useCamera } from '../hooks/useCamera';
import { useAccessibility } from '../context/AccessibilityContext';
import { Hand, X, Camera, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
interface SignLanguagePanelProps {
  onClose: () => void;
  onSignDetected?: (text: string) => void;
}
export function SignLanguagePanel({
  onClose,
  onSignDetected
}: SignLanguagePanelProps) {
  const { stream, isActive, error, startCamera, stopCamera } = useCamera();
  const { highContrast } = useAccessibility();
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [detectedSign, setDetectedSign] = useState<string>('');
  const [confidence, setConfidence] = useState(0);
  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);
  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  // Simulated recognition loop
  useEffect(() => {
    if (!isActive) return;
    const signs = ['HELLO', 'THANK YOU', 'YES', 'NO', 'HELP', 'GOODBYE'];
    let interval: NodeJS.Timeout;
    const simulateRecognition = () => {
      // Randomly "detect" a sign every few seconds
      if (Math.random() > 0.7) {
        const sign = signs[Math.floor(Math.random() * signs.length)];
        const conf = 0.8 + Math.random() * 0.2; // 0.8 - 1.0
        setDetectedSign(sign);
        setConfidence(conf);
        if (onSignDetected) {
          onSignDetected(sign);
        }
        // Clear after a delay
        setTimeout(() => {
          setDetectedSign('');
          setConfidence(0);
        }, 2000);
      }
    };
    interval = setInterval(simulateRecognition, 3000);
    return () => clearInterval(interval);
  }, [isActive, onSignDetected]);
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      exit={{
        opacity: 0,
        y: 20
      }}
      className={`
        absolute bottom-24 right-4 w-48 h-64 rounded-2xl overflow-hidden shadow-2xl border-4 z-50
        ${highContrast ? 'border-white bg-black' : 'border-teal-500 bg-gray-900'}
      `}>
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center space-x-1 text-white text-xs font-bold">
          <Hand size={12} className="text-teal-400" />
          <span>Sign Detect</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full bg-black/50 text-white hover:bg-red-500/80 transition-colors">
          
          <X size={12} />
        </button>
      </div>

      {/* Camera View */}
      <div className="relative w-full h-full bg-gray-800 flex items-center justify-center">
        {isActive ?
        <>
            <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
          />

            {/* Simulated Landmarks Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-50">
              <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none">
              
                <circle
                cx="50"
                cy="50"
                r="20"
                fill="none"
                stroke="cyan"
                strokeWidth="0.5"
                className="animate-pulse" />
              
                <circle cx="40" cy="40" r="2" fill="cyan" />
                <circle cx="60" cy="40" r="2" fill="cyan" />
                <circle cx="50" cy="70" r="2" fill="cyan" />
              </svg>
            </div>
          </> :

        <div className="text-center p-4">
            {error ?
          <div className="text-red-400 text-xs">{error}</div> :

          <RefreshCw className="animate-spin text-teal-500" />
          }
          </div>
        }
      </div>

      {/* Recognition Output */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 min-h-[40px] flex items-center justify-center">
        {detectedSign ?
        <div className="text-center">
            <span className="text-yellow-400 font-bold text-lg block leading-none">
              {detectedSign}
            </span>
            <span className="text-gray-400 text-[10px]">
              {Math.round(confidence * 100)}% confidence
            </span>
          </div> :

        <span className="text-gray-500 text-xs italic">
            Waiting for sign...
          </span>
        }
      </div>
    </motion.div>);

}