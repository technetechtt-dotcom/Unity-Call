import { Link, useNavigate } from '../lib/router';
import { useState } from 'react';
import {
  Eye,
  Globe,
  Hand,
  LogOut,
  MessageSquare,
  Trash2,
  User,
  Volume2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from '../components/BottomNav';
import type { AppLanguage, FontSize } from '../lib/types';

export function SettingsPage() {
  const acc = useAccessibility();
  const { user, logout, deleteAccount, savePreferences } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [saveStatus, setSaveStatus] = useState('');
  const [settingsError, setSettingsError] = useState('');

  const persist = (payload: Record<string, unknown>) => {
    setSettingsError(''); setSaveStatus('Saving…');
    void savePreferences(payload).then(() => setSaveStatus('Preferences saved.'))
      .catch(error => { setSaveStatus(''); setSettingsError(error instanceof Error ? error.message : 'Could not save preferences.'); });
  };

  const Toggle = ({
    label,
    description,
    checked,
    onChange
  }: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <div className={`flex items-center justify-between p-4 mx-4 mb-2 rounded-xl ${acc.highContrast ? 'border border-white' : 'bg-white shadow-sm'}`}>
      <div className="pr-4">
        <h3 className="font-semibold">{label}</h3>
        {description && <p className="text-sm opacity-70">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${label}. ${checked ? 'On' : 'Off'}`}
        onClick={() => {
          onChange(!checked);
          persist({ [label]: !checked });
        }}
        className={`w-14 h-8 rounded-full relative ${checked ? 'bg-primary' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : ''}`} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-dvh pb-16">
      <header className={`px-6 py-4 ${acc.highContrast ? 'bg-gray-900 border-b-2 border-white' : 'bg-white shadow-sm'}`}>
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      </header>
      <main className="flex-1 overflow-y-auto py-4 space-y-2">
        {settingsError && <p role="alert" className="mx-4 p-3 rounded bg-red-50 text-red-800">{settingsError}</p>}
        {saveStatus && <p role="status" className="mx-4 p-2 text-sm">{saveStatus}</p>}
        <section className={`p-4 mx-4 rounded-xl ${acc.highContrast ? 'border border-white' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-3 mb-3">
            <User />
            <div>
              <p className="font-bold">{user?.name}</p>
              <p className="text-sm opacity-70">{user?.email || user?.phone}</p>
            </div>
          </div>
          <Link className="block py-2 underline" to="/settings/profile">{t('profile.title')}</Link>
          <Link className="block py-2 underline" to="/settings/privacy">Privacy controls</Link>
          <Link className="block py-2 underline" to="/settings/sessions">Devices and download my data</Link>
          <button
            type="button"
            className="w-full py-2 text-red-600 flex items-center justify-center gap-2"
            onClick={() => void logout().then(() => navigate('/login'))}
          >
            <LogOut size={16} /> {t('settings.logout')}
          </button>
        </section>

        <p className="px-4 pt-4 font-bold flex items-center gap-2"><Hand size={18} /> Input</p>
        <Toggle label={t('settings.signLanguage')} description={t('settings.signLanguageDesc')} checked={acc.signLanguageEnabled} onChange={acc.setSignLanguageEnabled} />
        <Toggle label={t('settings.signAvatar')} description="Only validated vocabulary is shown. Experimental." checked={acc.signAvatarEnabled} onChange={acc.setSignAvatarEnabled} />

        <p className="px-4 pt-4 font-bold flex items-center gap-2"><Eye size={18} /> {t('settings.display')}</p>
        <Toggle label={t('settings.highContrast')} description={t('settings.highContrastDesc')} checked={acc.highContrast} onChange={acc.setHighContrast} />
        <Toggle label={t('settings.darkMode')} description={t('settings.darkModeDesc')} checked={acc.darkMode} onChange={acc.setDarkMode} />
        <Toggle label={t('settings.ecoMode')} description={t('settings.ecoModeDesc')} checked={acc.ecoMode} onChange={acc.setEcoMode} />
        <Toggle label={t('settings.screenReader')} description={t('settings.screenReaderDesc')} checked={acc.screenReaderMode} onChange={acc.setScreenReaderMode} />

        <div className={`p-4 mx-4 rounded-xl ${acc.highContrast ? 'border border-white' : 'bg-white shadow-sm'}`}>
          <h3 className="font-semibold mb-2">{t('settings.textSize')}</h3>
          <div className="flex gap-2">
            {(['normal', 'large', 'xlarge'] as FontSize[]).map((size) => (
              <button
                key={size}
                type="button"
                className={`flex-1 min-h-[48px] rounded-lg ${acc.fontSize === size ? 'bg-primary text-white' : 'bg-gray-100'}`}
                aria-pressed={acc.fontSize === size}
                onClick={() => acc.setFontSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <p className="px-4 pt-4 font-bold flex items-center gap-2"><Volume2 size={18} /> {t('settings.audio')}</p>
        <Toggle label={t('settings.tts')} description={t('settings.ttsDesc')} checked={acc.ttsEnabled} onChange={acc.setTtsEnabled} />
        {acc.ttsEnabled && (
          <label className="block px-4">
            Voice speed {acc.voiceSpeed}x
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.25"
              value={acc.voiceSpeed}
              onChange={(e) => acc.setVoiceSpeed(Number(e.target.value))}
              className="w-full"
            />
          </label>
        )}
        <Toggle label={t('settings.vibration')} description={t('settings.vibrationDesc')} checked={acc.vibrationEnabled} onChange={acc.setVibrationEnabled} />

        <p className="px-4 pt-4 font-bold flex items-center gap-2"><Globe size={18} /> {t('settings.language')}</p>
        <div className="px-4">
          <select
            className="w-full min-h-[48px] rounded-lg border-2 px-3"
            value={acc.language}
            aria-label="Language"
            onChange={(e) => acc.setLanguage(e.target.value as AppLanguage)}
          >
            <option>English</option>
            <option>isiZulu</option>
            <option>Afrikaans</option>
            <option>isiXhosa</option>
          </select>
        </div>

        <Link to="/settings/captions" className={`flex items-center justify-between p-4 mx-4 rounded-xl ${acc.highContrast ? 'border border-white' : 'bg-white shadow-sm'}`}>
          <span className="flex items-center gap-2"><MessageSquare size={18} /> Caption overlay</span>
        </Link>
        <Link className="block px-4 py-2 underline" to="/interpreters">SASL interpreters</Link>
        <Link className="block px-4 py-2 underline" to="/admin/interpreters">Interpreter verification (administrators)</Link>
        <Link className="block px-4 py-2 underline" to="/orgs">Organisation directory</Link>
        <Link className="block px-4 py-2 underline" to="/orgs/manage">Manage my organisations</Link>
        <Link className="block px-4 py-2 underline" to="/legal/help">Help</Link>
        <Link className="block px-4 py-2 underline" to="/legal/privacy">Privacy information</Link>
        <Link className="block px-4 py-2 underline" to="/legal/terms">Terms</Link>

        <button
          type="button"
          className="mx-4 my-4 w-[calc(100%-2rem)] py-3 text-red-600 border-2 border-red-100 rounded-xl flex items-center justify-center gap-2"
          onClick={() => {
            if (window.confirm('Delete your Unity account and stored media?')) void deleteAccount().then(() => navigate('/register'));
          }}
        >
          <Trash2 size={18} /> Delete account
        </button>
      </main>
      <BottomNav />
    </div>
  );
}
