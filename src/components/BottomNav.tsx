import { NavLink } from '../lib/router';
import { MessageSquare, Phone, Settings } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTranslation } from 'react-i18next';

const tabs = [
  { to: '/chats', key: 'chats', icon: MessageSquare, labelKey: 'nav.chats' },
  { to: '/calls', key: 'calls', icon: Phone, labelKey: 'nav.calls' },
  { to: '/settings', key: 'settings', icon: Settings, labelKey: 'nav.settings' }
] as const;

export function BottomNav() {
  const { highContrast } = useAccessibility();
  const { t } = useTranslation();

  return (
    <nav
      className={`sticky bottom-0 h-16 border-t flex items-center justify-around px-2 z-40 ${
        highContrast ? 'border-white bg-gray-900' : 'border-gray-200 bg-white'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.key}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full min-h-[48px] space-y-1 ${
                isActive
                  ? highContrast
                    ? 'text-white bg-primary-dark ring-2 ring-white rounded-lg'
                    : 'text-primary'
                  : 'text-gray-400'
              }`
            }
            aria-label={t(tab.labelKey)}
          >
            {({ isActive }) => (
              <>
                <Icon size={24} strokeWidth={2.5} aria-hidden="true" />
                <span className="text-xs font-medium">{t(tab.labelKey)}</span>
                <span className="sr-only">{isActive ? 'Current page' : ''}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
