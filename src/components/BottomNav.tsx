import React from 'react';
import { MessageSquare, Phone, Settings } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTranslation } from 'react-i18next';
type Tab = 'chats' | 'calls' | 'settings';
interface BottomNavProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}
export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  const { highContrast } = useAccessibility();
  const { t } = useTranslation();
  const getTabClass = (tab: Tab) => {
    const isActive = currentTab === tab;
    if (highContrast) {
      return isActive ?
      'text-white bg-primary-dark ring-2 ring-white' :
      'text-gray-400 hover:text-white';
    }
    return isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600';
  };
  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 
        flex items-center justify-around px-2 pb-safe z-50
        ${highContrast ? 'border-t-2 border-black bg-gray-900' : ''}
      `}
      role="navigation"
      aria-label="Main navigation">
      
      <button
        onClick={() => onTabChange('chats')}
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${getTabClass('chats')}`}
        aria-label={t('nav.chats')}
        aria-current={currentTab === 'chats' ? 'page' : undefined}>
        
        <MessageSquare size={24} strokeWidth={2.5} />
        <span className="text-xs font-medium">{t('nav.chats')}</span>
      </button>

      <button
        onClick={() => onTabChange('calls')}
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${getTabClass('calls')}`}
        aria-label={t('nav.calls')}
        aria-current={currentTab === 'calls' ? 'page' : undefined}>
        
        <Phone size={24} strokeWidth={2.5} />
        <span className="text-xs font-medium">{t('nav.calls')}</span>
      </button>

      <button
        onClick={() => onTabChange('settings')}
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${getTabClass('settings')}`}
        aria-label={t('nav.settings')}
        aria-current={currentTab === 'settings' ? 'page' : undefined}>
        
        <Settings size={24} strokeWidth={2.5} />
        <span className="text-xs font-medium">{t('nav.settings')}</span>
      </button>
    </nav>);

}