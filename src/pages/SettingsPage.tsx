import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useUser } from '../context/UserContext';
import { BottomNav } from '../components/BottomNav';
import {
  ArrowRight,
  Eye,
  Volume2,
  Globe,
  MessageSquare,
  User,
  LogOut,
  Moon,
  Leaf,
  Trash2,
  Hand,
  Smile } from
'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/Toast';
interface SettingsPageProps {
  onNavigate: (page: string) => void;
}
export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const {
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
    ecoMode,
    setEcoMode,
    voiceSpeed,
    setVoiceSpeed,
    signLanguageEnabled,
    setSignLanguageEnabled,
    signAvatarEnabled,
    setSignAvatarEnabled
  } = useAccessibility();
  const { user, logout } = useUser();
  const { t, i18n } = useTranslation();
  const { addToast } = useToast();
  const handleLogout = () => {
    logout();
    onNavigate('onboarding');
  };
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as any);
    const code =
    lang === 'English' ?
    'en' :
    lang === 'isiZulu' ?
    'zu' :
    lang === 'Afrikaans' ?
    'af' :
    'xh';
    i18n.changeLanguage(code);
  };
  const handleClearData = () => {
    if (
    window.confirm('Are you sure? This will delete all chats and settings.'))
    {
      localStorage.clear();
      window.location.reload();
    }
  };
  const SectionHeader = ({
    title,
    icon



  }: {title: string;icon: React.ReactNode;}) =>
  <div
    className={`flex items-center space-x-2 mb-4 mt-6 px-4 ${highContrast ? 'text-yellow-400' : 'text-primary'}`}>
    
      {icon}
      <h2 className="text-lg font-bold uppercase tracking-wider">{title}</h2>
    </div>;

  const ToggleItem = ({
    label,
    description,
    checked,
    onChange





  }: {label: string;description?: string;checked: boolean;onChange: (checked: boolean) => void;}) =>
  <div
    className={`
      flex items-center justify-between p-4 mx-4 mb-2 rounded-xl
      ${highContrast ? 'bg-gray-900 border border-white' : 'bg-white shadow-sm'}
    `}>
    
      <div className="flex-1 pr-4">
        <h3 className="font-semibold text-base">{label}</h3>
        {description &&
      <p className="text-sm opacity-70 mt-1">{description}</p>
      }
      </div>
      <button
      onClick={() => onChange(!checked)}
      className={`
          w-14 h-8 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
          ${checked ? highContrast ? 'bg-yellow-400' : 'bg-primary' : highContrast ? 'bg-gray-700' : 'bg-gray-300'}
        `}
      role="switch"
      aria-checked={checked}
      aria-label={`Toggle ${label}`}>
      
        <span
        className={`
          absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform shadow-sm
          ${checked ? 'translate-x-6' : 'translate-x-0'}
        `} />
      
      </button>
    </div>;

  return (
    <div
      className={`flex flex-col h-full pb-20 ${highContrast ? 'bg-black text-white' : 'bg-background-light'}`}>
      
      <header
        className={`
        px-6 py-4 sticky top-0 z-10
        ${highContrast ? 'bg-gray-900 border-b-2 border-white' : 'bg-white shadow-sm'}
      `}>
        
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      </header>

      <main className="flex-1 overflow-y-auto py-2">
        {/* Profile Section */}
        <SectionHeader
          title={t('settings.profile')}
          icon={<User size={20} />} />
        
        <div
          className={`p-4 mx-4 mb-2 rounded-xl ${highContrast ? 'bg-gray-900 border border-white' : 'bg-white shadow-sm'}`}>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xl">
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-lg">{user.name}</h3>
              <p className="opacity-70 text-sm">
                {user.email || user.phoneNumber}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="w-full mb-3 py-2 bg-gray-100 font-medium rounded-lg hover:bg-gray-200">
            
            {t('profile.title')}
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-2 text-red-500 font-medium flex items-center justify-center space-x-2 border border-red-200 rounded-lg hover:bg-red-50">
            
            <LogOut size={16} />
            <span>{t('settings.logout')}</span>
          </button>
        </div>

        {/* Input Section */}
        <SectionHeader title="Input" icon={<Hand size={20} />} />

        <ToggleItem
          label={t('settings.signLanguage')}
          description={t('settings.signLanguageDesc')}
          checked={signLanguageEnabled}
          onChange={setSignLanguageEnabled} />
        

        {/* Output Section */}
        <SectionHeader title="Output" icon={<Smile size={20} />} />

        <ToggleItem
          label={t('settings.signAvatar')}
          description={t('settings.signAvatarDesc')}
          checked={signAvatarEnabled}
          onChange={setSignAvatarEnabled} />
        

        {/* Display Section */}
        <SectionHeader title={t('settings.display')} icon={<Eye size={20} />} />

        <ToggleItem
          label={t('settings.highContrast')}
          description={t('settings.highContrastDesc')}
          checked={highContrast}
          onChange={setHighContrast} />
        

        <ToggleItem
          label={t('settings.darkMode')}
          description={t('settings.darkModeDesc')}
          checked={darkMode}
          onChange={setDarkMode} />
        

        <ToggleItem
          label={t('settings.ecoMode')}
          description={t('settings.ecoModeDesc')}
          checked={ecoMode}
          onChange={setEcoMode} />
        

        <ToggleItem
          label={t('settings.screenReader')}
          description={t('settings.screenReaderDesc')}
          checked={screenReaderMode}
          onChange={setScreenReaderMode} />
        

        <div
          className={`p-4 mx-4 mb-2 rounded-xl ${highContrast ? 'bg-gray-900 border border-white' : 'bg-white shadow-sm'}`}>
          
          <h3 className="font-semibold mb-3">{t('settings.textSize')}</h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['normal', 'large', 'xlarge'] as const).map((size) =>
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`
                  flex-1 py-2 rounded-md text-sm font-medium transition-all
                  ${fontSize === size ? highContrast ? 'bg-black text-white border border-white' : 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}
                `}>
              
                {size === 'normal' ? 'Aa' : size === 'large' ? 'Aa+' : 'Aa++'}
              </button>
            )}
          </div>
        </div>

        {/* Audio Section */}
        <SectionHeader
          title={t('settings.audio')}
          icon={<Volume2 size={20} />} />
        

        <ToggleItem
          label={t('settings.tts')}
          description={t('settings.ttsDesc')}
          checked={ttsEnabled}
          onChange={setTtsEnabled} />
        

        {ttsEnabled &&
        <div
          className={`p-4 mx-4 mb-2 rounded-xl ${highContrast ? 'bg-gray-900 border border-white' : 'bg-white shadow-sm'}`}>
          
            <h3 className="font-semibold mb-2">
              {t('settings.voiceSpeed')}: {voiceSpeed}x
            </h3>
            <input
            type="range"
            min="0.5"
            max="2"
            step="0.25"
            value={voiceSpeed}
            onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
            className="w-full accent-teal-600" />
          
          </div>
        }

        <ToggleItem
          label={t('settings.vibration')}
          description={t('settings.vibrationDesc')}
          checked={vibrationEnabled}
          onChange={setVibrationEnabled} />
        

        {/* Language Section */}
        <SectionHeader
          title={t('settings.language')}
          icon={<Globe size={20} />} />
        

        <div
          className={`p-4 mx-4 mb-2 rounded-xl ${highContrast ? 'bg-gray-900 border border-white' : 'bg-white shadow-sm'}`}>
          
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className={`
              w-full p-3 rounded-lg border-2 bg-transparent
              ${highContrast ? 'border-white text-white' : 'border-gray-200 text-gray-900'}
            `}
            aria-label="Select Language">
            
            <option value="English">English</option>
            <option value="isiZulu">isiZulu</option>
            <option value="Afrikaans">Afrikaans</option>
            <option value="isiXhosa">isiXhosa</option>
          </select>
        </div>

        {/* Caption Overlay */}
        <SectionHeader
          title={t('settings.captionOverlay')}
          icon={<MessageSquare size={20} />} />
        

        <button
          onClick={() => onNavigate('captionOverlay')}
          className={`
            w-full flex items-center justify-between p-4 mx-4 mb-8 rounded-xl text-left max-w-[calc(100%-2rem)]
            ${highContrast ? 'bg-gray-900 border border-white hover:bg-gray-800' : 'bg-white shadow-sm hover:bg-gray-50'}
          `}>
          
          <div>
            <h3 className="font-semibold">{t('settings.configOverlay')}</h3>
            <p className="text-sm opacity-70">Customize floating captions</p>
          </div>
          <ArrowRight size={20} />
        </button>

        {/* Danger Zone */}
        <div className="px-4 pb-8">
          <button
            onClick={handleClearData}
            className="w-full py-3 text-red-600 font-medium flex items-center justify-center space-x-2 border-2 border-red-100 rounded-xl hover:bg-red-50">
            
            <Trash2 size={18} />
            <span>{t('settings.clearData')}</span>
          </button>
          <p className="text-center text-xs opacity-40 mt-4">
            {t('settings.version')}
          </p>
        </div>
      </main>

      <BottomNav
        currentTab="settings"
        onTabChange={(tab) => {
          if (tab === 'chats') onNavigate('chatList');
          if (tab === 'calls') onNavigate('callHistory');
        }} />
      
    </div>);

}