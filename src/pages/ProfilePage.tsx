import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, User, Ear, Eye, EarOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/Toast';
interface ProfilePageProps {
  onBack: () => void;
}
export function ProfilePage({ onBack }: ProfilePageProps) {
  const { highContrast } = useAccessibility();
  const { user, updateUser } = useUser();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [name, setName] = useState(user.name);
  const [accessibilityType, setAccessibilityType] = useState(
    user.accessibilityType
  );
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name,
      accessibilityType
    });
    addToast(t('profile.saved'), 'success');
    setTimeout(onBack, 1000);
  };
  const OptionCard = ({
    type,
    label,
    icon




  }: {type: typeof user.accessibilityType;label: string;icon: React.ReactNode;}) =>
  <button
    type="button"
    onClick={() => setAccessibilityType(type)}
    className={`
        flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all h-32
        ${accessibilityType === type ? highContrast ? 'bg-white text-black border-white' : 'bg-teal-50 border-teal-500 text-teal-900' : highContrast ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}
      `}>
    
      <div className="mb-2">{icon}</div>
      <span className="font-medium text-sm text-center">{label}</span>
      {accessibilityType === type &&
    <div
      className={`mt-1 w-2 h-2 rounded-full ${highContrast ? 'bg-black' : 'bg-teal-500'}`} />

    }
    </button>;

  return (
    <div
      className={`flex flex-col h-full ${highContrast ? 'bg-black text-white' : 'bg-background-light'}`}>
      
      <header
        className={`
        px-4 py-3 flex items-center space-x-3 sticky top-0 z-10
        ${highContrast ? 'bg-gray-900 border-b-2 border-white' : 'bg-white shadow-sm'}
      `}>
        
        <button
          onClick={onBack}
          className={`p-2 rounded-full ${highContrast ? 'bg-white text-black' : 'hover:bg-gray-100'}`}>
          
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg">{t('profile.title')}</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="flex justify-center mb-6">
            <div
              className={`
              w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold
              ${highContrast ? 'bg-white text-black border-4 border-white' : 'bg-teal-100 text-teal-800'}
            `}>
              
              {name.charAt(0).toUpperCase()}
            </div>
          </div>

          <Input
            label={t('profile.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            icon={<User />} />
          

          <div>
            <label
              className={`block font-semibold mb-3 ${highContrast ? 'text-white' : 'text-gray-700'}`}>
              
              {t('profile.accessibilityType')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <OptionCard
                type="none"
                label={t('profile.hearing')}
                icon={<Ear size={28} />} />
              
              <OptionCard
                type="deaf"
                label={t('profile.deaf')}
                icon={<EarOff size={28} />} />
              
              <OptionCard
                type="blind"
                label={t('profile.blind')}
                icon={<Eye size={28} />} />
              
              <OptionCard
                type="hoh"
                label={t('profile.hoh')}
                icon={<Ear size={28} className="opacity-50" />} />
              
            </div>
          </div>

          <Button type="submit" fullWidth size="lg">
            {t('profile.save')}
          </Button>
        </form>
      </main>
    </div>);

}