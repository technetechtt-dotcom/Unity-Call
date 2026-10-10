import { Outlet } from '../lib/router';
import { useAccessibility } from '../context/AccessibilityContext';
import { useRealtime } from '../context/RealtimeContext';
import { ConnectionBanner } from '../components/ConnectionBanner';

export function AppShell() {
  const { highContrast, darkMode, screenReaderMode } = useAccessibility();
  const { online } = useRealtime();

  return (
    <div
      className={`min-h-dvh w-full ${
        highContrast
          ? 'bg-black text-white'
          : darkMode
            ? 'bg-gray-950 text-gray-50'
            : 'bg-background-light text-text-light'
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[80] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to content
      </a>
      <div className={`mx-auto w-full max-w-xl min-h-dvh flex flex-col ${screenReaderMode ? 'max-w-3xl' : ''}`}>
        {!online && <ConnectionBanner />}
        <div id="main" className="flex-1 min-h-0 flex flex-col" tabIndex={-1}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
