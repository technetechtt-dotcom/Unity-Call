import {
  createContext,
  useContext,
  useEffect,
  type ReactNode
} from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import i18n from '../i18n/config';
import type { AppLanguage, FontSize } from '../lib/types';

interface AccessibilityContextType {
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  screenReaderMode: boolean;
  setScreenReaderMode: (enabled: boolean) => void;
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  vibrationEnabled: boolean;
  setVibrationEnabled: (enabled: boolean) => void;
  captionOverlayOpacity: number;
  setCaptionOverlayOpacity: (opacity: number) => void;
  ecoMode: boolean;
  setEcoMode: (enabled: boolean) => void;
  voiceSpeed: number;
  setVoiceSpeed: (speed: number) => void;
  signLanguageEnabled: boolean;
  setSignLanguageEnabled: (enabled: boolean) => void;
  signAvatarEnabled: boolean;
  setSignAvatarEnabled: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const languageCode: Record<AppLanguage, string> = {
  English: 'en',
  isiZulu: 'zu',
  Afrikaans: 'af',
  isiXhosa: 'xh'
};

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [highContrast, setHighContrast] = useLocalStorage('acc_highContrast', false);
  const [darkMode, setDarkMode] = useLocalStorage('acc_darkMode', false);
  const [fontSize, setFontSize] = useLocalStorage<FontSize>('acc_fontSize', 'normal');
  const [screenReaderMode, setScreenReaderMode] = useLocalStorage('acc_screenReader', false);
  const [ttsEnabled, setTtsEnabled] = useLocalStorage('acc_tts', false);
  const [language, setLanguage] = useLocalStorage<AppLanguage>('acc_language', 'English');
  const [vibrationEnabled, setVibrationEnabled] = useLocalStorage('acc_vibration', true);
  const [captionOverlayOpacity, setCaptionOverlayOpacity] = useLocalStorage('acc_captionOpacity', 0.8);
  const [ecoMode, setEcoMode] = useLocalStorage('acc_ecoMode', false);
  const [voiceSpeed, setVoiceSpeed] = useLocalStorage('acc_voiceSpeed', 1);
  const [signLanguageEnabled, setSignLanguageEnabled] = useLocalStorage('acc_signLanguage', false);
  const [signAvatarEnabled, setSignAvatarEnabled] = useLocalStorage('acc_signAvatar', false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', darkMode);
    root.classList.toggle('high-contrast', highContrast);
    root.classList.toggle('eco-mode', ecoMode);
    root.classList.toggle('sr-optimize', screenReaderMode);
    root.dataset.fontSize = fontSize;
    root.style.setProperty(
      '--unity-font-size',
      fontSize === 'xlarge' ? '22px' : fontSize === 'large' ? '18px' : '16px'
    );
  }, [darkMode, highContrast, ecoMode, screenReaderMode, fontSize]);

  useEffect(() => {
    void i18n.changeLanguage(languageCode[language] || 'en');
  }, [language]);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        setHighContrast,
        darkMode,
        setDarkMode,
        fontSize,
        setFontSize,
        screenReaderMode,
        setScreenReaderMode,
        ttsEnabled,
        setTtsEnabled,
        language,
        setLanguage,
        vibrationEnabled,
        setVibrationEnabled,
        captionOverlayOpacity,
        setCaptionOverlayOpacity,
        ecoMode,
        setEcoMode,
        voiceSpeed,
        setVoiceSpeed,
        signLanguageEnabled,
        setSignLanguageEnabled,
        signAvatarEnabled,
        setSignAvatarEnabled
      }}
    >
      <div
        className={`unity-shell text-size-${fontSize} ${highContrast ? 'high-contrast' : ''} ${darkMode ? 'dark-mode' : ''}`}
      >
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
