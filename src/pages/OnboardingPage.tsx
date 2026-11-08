import { useState } from 'react';
import { Link, useLocation, useNavigate } from '../lib/router';
import { Accessibility, AlertCircle, ArrowRight, Eye, Mail, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { validateEmail, validateOTP, validatePhone } from '../utils/validation';
import type { CommPref } from '../lib/types';

export function OnboardingPage({ mode = 'login' }: { mode?: 'login' | 'register' | 'recovery' }) {
  const { highContrast, setHighContrast } = useAccessibility();
  const { requestCode, verifyCode } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const requested = (location.state as { from?: unknown } | null)?.from;
  const destination = typeof requested === 'string' && requested.startsWith('/') && !requested.startsWith('//') ? requested : '/chats';
  const [method, setMethod] = useState<'phone' | 'email'>('email');
  const [step, setStep] = useState<'input' | 'otp' | 'profile'>('input');
  const [inputValue, setInputValue] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [commPref, setCommPref] = useState<CommPref>('text');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const purpose = mode;

  const handleSendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (method === 'phone' && !validatePhone(inputValue)) {
      setError('Enter a valid phone number, including country code.');
      return;
    }
    if (method === 'email' && !validateEmail(inputValue)) {
      setError('Enter a valid email address.');
      return;
    }
    setIsLoading(true);
    try {
      const result = await requestCode(inputValue, purpose);
      setDevCode(result.devCode || '');
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!validateOTP(otp)) {
      setError('Enter the 6-digit code.');
      return;
    }
    if (mode === 'register' && step === 'otp') {
      setStep('profile');
      return;
    }
    setIsLoading(true);
    try {
      await verifyCode({
        destination: inputValue,
        code: otp,
        purpose,
        name,
        commPref
      });
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify that code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Enter the name people should see.');
      return;
    }
    setIsLoading(true);
    try {
      await verifyCode({
        destination: inputValue,
        code: otp,
        purpose,
        name,
        commPref
      });
      navigate('/chats', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not finish creating your account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col min-h-dvh px-6 py-8 ${highContrast ? 'bg-black text-white' : ''}`}>
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <Accessibility size={24} aria-hidden="true" />
          </div>
          <span className="font-bold text-xl">Unity Call</span>
        </div>
        <button
          type="button"
          onClick={() => setHighContrast(!highContrast)}
          className={`p-2 rounded-full border-2 min-h-[44px] min-w-[44px] ${highContrast ? 'bg-white text-black' : 'bg-white border-gray-200'}`}
          aria-pressed={highContrast}
          aria-label={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
        >
          <Eye size={20} />
        </button>
      </header>

      <main className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <h1 className="text-3xl font-bold mb-3">
          {mode === 'register' ? 'Create your account' : mode === 'recovery' ? 'Restore access' : t('onboarding.welcome')}
        </h1>
        <p className="text-lg opacity-80 mb-6">{t('onboarding.tagline')}</p>

        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-start space-x-3 bg-red-50 text-red-800" role="alert">
            <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
            <span>{error}</span>
          </div>
        )}

        {step === 'input' && (
          <form onSubmit={handleSendCode} className="space-y-6">
            {method === 'phone' ? (
              <Input
                label="Phone number"
                type="tel"
                placeholder="+27 82 000 0000"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                required
                autoFocus
                icon={<Smartphone />}
                helperText="We send a one-time sign-in code. Camera, microphone, and notifications are requested only when you use those features."
              />
            ) : (
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                required
                autoFocus
                icon={<Mail />}
                helperText="We send a one-time sign-in code. No password is stored unless you add one later."
              />
            )}
            <Button type="submit" fullWidth size="lg" disabled={isLoading}>
              {isLoading ? t('onboarding.sending') : t('onboarding.sendCode')}
            </Button>
            <button
              type="button"
              className="w-full text-primary underline"
              onClick={() => {
                setMethod(method === 'phone' ? 'email' : 'phone');
                setInputValue('');
              }}
            >
              {method === 'phone' ? t('onboarding.useEmail') : t('onboarding.usePhone')}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerify} className="space-y-6">
            <Input
              label={`Enter the code sent to ${inputValue}`}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              autoFocus
              className="text-center text-2xl tracking-widest"
              helperText={devCode ? `Development code: ${devCode}` : 'Check your email or messages.'}
            />
            <Button type="submit" fullWidth size="lg" icon={<ArrowRight />} disabled={isLoading}>
              {isLoading ? t('onboarding.verifying') : t('onboarding.verify')}
            </Button>
          </form>
        )}

        {step === 'profile' && (
          <form onSubmit={handleComplete} className="space-y-6">
            <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            <fieldset>
              <legend className="font-semibold mb-2">How should Unity present calls to you?</legend>
              <p className="text-sm opacity-70 mb-3">
                This stays private. Other people see only your communication style, not a disability label.
              </p>
              {([
                ['text', 'Text and captions first'],
                ['audio', 'Voice first'],
                ['video', 'Video first'],
                ['sign', 'Sign language first']
              ] as const).map(([value, label]) => (
                <label key={value} className="flex items-center gap-3 mb-2 min-h-[44px]">
                  <input
                    type="radio"
                    name="commPref"
                    value={value}
                    checked={commPref === value}
                    onChange={() => setCommPref(value)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <Button type="submit" fullWidth size="lg" disabled={isLoading}>
              {t('onboarding.startUsing')}
            </Button>
          </form>
        )}

        <div className="mt-8 text-sm space-y-2">
          {mode !== 'login' && <Link className="block text-primary underline" to="/login">Sign in</Link>}
          {mode !== 'register' && <Link className="block text-primary underline" to="/register">Create an account</Link>}
          {mode !== 'recovery' && <Link className="block text-primary underline" to="/recover">I cannot access my account</Link>}
          <Link className="block underline opacity-70" to="/legal/privacy">Privacy</Link>
          <Link className="block underline opacity-70" to="/legal/terms">Terms</Link>
        </div>
      </main>
    </div>
  );
}
