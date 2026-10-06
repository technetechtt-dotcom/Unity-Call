import React, { useEffect, useState, createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
type FontSize = 'normal' | 'large' | 'xlarge';
type Language = 'English' | 'isiZulu' | 'Afrikaans' | 'isiXhosa';
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
  language: Language;
  setLanguage: (lang: Language) => void;
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
const AccessibilityContext = createContext<
  AccessibilityContextType | undefined>(
  undefined);
export function AccessibilityProvider({ children }: {children: ReactNode;}) {
  const [highContrast, setHighContrast] = useLocalStorage(
    'acc_highContrast',
    false
  );
  const [darkMode, setDarkMode] = useLocalStorage('acc_darkMode', false);
  const [fontSize, setFontSize] = useLocalStorage<FontSize>(
    'acc_fontSize',
    'normal'
  );
  const [screenReaderMode, setScreenReaderMode] = useLocalStorage(
    'acc_screenReader',
    false
  );
  const [ttsEnabled, setTtsEnabled] = useLocalStorage('acc_tts', false);
  const [language, setLanguage] = useLocalStorage<Language>(
    'acc_language',
    'English'
  );
  const [vibrationEnabled, setVibrationEnabled] = useLocalStorage(
    'acc_vibration',
    true
  );
  const [captionOverlayOpacity, setCaptionOverlayOpacity] = useLocalStorage(
    'acc_captionOpacity',
    0.8
  );
  const [ecoMode, setEcoMode] = useLocalStorage('acc_ecoMode', false);
  const [voiceSpeed, setVoiceSpeed] = useLocalStorage('acc_voiceSpeed', 1.0);
  const [signLanguageEnabled, setSignLanguageEnabled] = useLocalStorage(
    'acc_signLanguage',
    false
  );
  const [signAvatarEnabled, setSignAvatarEnabled] = useLocalStorage(
    'acc_signAvatar',
    false
  );
  // Apply dark mode class to body/root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
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
      }}>
      
      <div
        className={`
          ${highContrast ? 'high-contrast' : ''} 
          ${darkMode ? 'dark-mode' : ''}
          text-size-${fontSize}
          h-full w-full
        `}>
        
        {children}
      </div>
    </AccessibilityContext.Provider>);

}
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error(
      'useAccessibility must be used within an AccessibilityProvider'
    );
  }
  return context;
}