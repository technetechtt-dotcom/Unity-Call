import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
export function ConnectionBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const { highContrast } = useAccessibility();
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {!isOnline &&
      <motion.div
        initial={{
          height: 0,
          opacity: 0
        }}
        animate={{
          height: 'auto',
          opacity: 1
        }}
        exit={{
          height: 0,
          opacity: 0
        }}
        className={`
            w-full px-4 py-2 flex items-center justify-center space-x-2 text-sm font-medium
            ${highContrast ? 'bg-yellow-900 text-white border-b-2 border-white' : 'bg-yellow-100 text-yellow-800'}
          `}
        role="status"
        aria-live="polite">
        
          <WifiOff size={16} />
          <span>{t('connection.offline')}</span>
        </motion.div>
      }

      {isOnline && wasOffline &&
      <motion.div
        initial={{
          height: 0,
          opacity: 0
        }}
        animate={{
          height: 'auto',
          opacity: 1
        }}
        exit={{
          height: 0,
          opacity: 0
        }}
        className={`
            w-full px-4 py-2 flex items-center justify-center space-x-2 text-sm font-medium
            ${highContrast ? 'bg-green-900 text-white border-b-2 border-white' : 'bg-green-100 text-green-800'}
          `}
        role="status"
        aria-live="polite">
        
          <Wifi size={16} />
          <span>{t('connection.online')}</span>
        </motion.div>
      }
    </AnimatePresence>);

}