import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Accessibility,
  Eye,
  Smartphone,
  Mail,
  ArrowRight,
  AlertCircle } from
'lucide-react';
import { validateEmail, validatePhone, validateOTP } from '../utils/validation';
import { useTranslation } from 'react-i18next';
interface OnboardingPageProps {
  onComplete: () => void;
}
export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const { highContrast, setHighContrast } = useAccessibility();
  const { updateUser } = useUser();
  const { t } = useTranslation();
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState<'input' | 'otp' | 'profile'>('input');
  const [inputValue, setInputValue] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (method === 'phone' && !validatePhone(inputValue)) {
      setError('Please enter a valid phone number');
      return;
    }
    if (method === 'email' && !validateEmail(inputValue)) {
      setError('Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 1000);
  };
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateOTP(otp)) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('profile');
    }, 1000);
  };
  const handleCompleteProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    updateUser({
      name,
      [method === 'phone' ? 'phoneNumber' : 'email']: inputValue,
      isLoggedIn: true
    });
    onComplete();
  };
  return (
    <div
      className={`
      flex flex-col min-h-full px-6 py-8
      ${highContrast ? 'bg-black text-white' : 'bg-background-light text-text-light'}
    `}>
      
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <Accessibility size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">UnityCall</span>
        </div>

        <button
          onClick={() => setHighContrast(!highContrast)}
          className={`
            p-2 rounded-full border-2 transition-colors
            ${highContrast ? 'bg-white text-black border-white' : 'bg-white text-gray-700 border-gray-200'}
          `}
          aria-label={
          highContrast ?
          'Disable high contrast mode' :
          'Enable high contrast mode'
          }
          aria-pressed={highContrast}>
          
          <Eye size={20} />
        </button>
      </header>

      <main className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-3">
            {step === 'profile' ?
            t('onboarding.setupProfile') :
            t('onboarding.welcome')}
          </h1>
          <p
            className={`text-lg ${highContrast ? 'text-gray-300' : 'text-gray-600'}`}>
            
            {t('onboarding.tagline')}
          </p>
        </div>

        {error &&
        <div
          className={`
            mb-6 p-4 rounded-xl flex items-start space-x-3
            ${highContrast ? 'bg-red-900 border-2 border-white text-white' : 'bg-red-50 text-red-800 border border-red-200'}
          `}
          role="alert">
          
            <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
            <span className="font-medium">{error}</span>
          </div>
        }

        {step === 'input' &&
        <form onSubmit={handleSendCode} className="space-y-6">
            {method === 'phone' ?
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1 555 000 0000"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            required
            autoFocus
            icon={<Smartphone />}
            disabled={isLoading} /> :


          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            required
            autoFocus
            icon={<Mail />}
            disabled={isLoading} />

          }

            <Button type="submit" fullWidth size="lg" disabled={isLoading}>
              {isLoading ? t('onboarding.sending') : t('onboarding.sendCode')}
            </Button>

            <div className="text-center pt-4">
              <button
              type="button"
              onClick={() => {
                setMethod(method === 'phone' ? 'email' : 'phone');
                setInputValue('');
                setError('');
              }}
              className={`
                  text-base font-medium underline underline-offset-4
                  ${highContrast ? 'text-yellow-300' : 'text-primary hover:text-primary-dark'}
                `}>
              
                {method === 'phone' ?
              t('onboarding.useEmail') :
              t('onboarding.usePhone')}
              </button>
            </div>
          </form>
        }

        {step === 'otp' &&
        <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="mb-6">
              <Input
              label={`Enter code sent to ${inputValue}`}
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              autoFocus
              className="text-center text-2xl tracking-widest"
              maxLength={6}
              disabled={isLoading} />
            
            </div>

            <Button
            type="submit"
            fullWidth
            size="lg"
            icon={<ArrowRight />}
            disabled={isLoading}>
            
              {isLoading ? t('onboarding.verifying') : t('onboarding.verify')}
            </Button>

            <div className="text-center pt-4">
              <button
              type="button"
              onClick={() => {
                setStep('input');
                setOtp('');
                setError('');
              }}
              className={`
                  text-sm font-medium
                  ${highContrast ? 'text-gray-300' : 'text-gray-500'}
                `}>
              
                {t('onboarding.wrongNumber')}
              </button>
            </div>
          </form>
        }

        {step === 'profile' &&
        <form onSubmit={handleCompleteProfile} className="space-y-6">
            <Input
            label={t('onboarding.yourName')}
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            disabled={isLoading} />
          

            <Button type="submit" fullWidth size="lg" icon={<ArrowRight />}>
              {t('onboarding.startUsing')}
            </Button>
          </form>
        }
      </main>

      <footer className="mt-auto pt-8 text-center text-sm opacity-60">
        <p>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </footer>
    </div>);

}