import { useState } from 'react';
import { useNavigate } from '../lib/router';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/Toast';
import type { CommPref } from '../lib/types';

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [commPref, setCommPref] = useState<CommPref>(user?.commPref || 'text');
  const [discoverable, setDiscoverable] = useState(user?.discoverable ?? true);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!name.trim() || name.length > 120) { setError('Enter a display name of up to 120 characters.'); return; }
    setSaving(true); setError('');
    try {
      await updateProfile({ name: name.trim(), commPref, discoverable });
      addToast('Profile updated', 'success');
      navigate('/settings');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save profile.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="px-4 py-3 flex items-center gap-3 bg-white shadow-sm">
        <button type="button" className="p-2 min-h-[48px]" aria-label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </button>
        <h1 className="font-bold text-lg">Profile and communication</h1>
      </header>
      <form className="p-6 space-y-5" onSubmit={(event) => void save(event)}>
        <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} required />
        <fieldset>
          <legend className="font-semibold mb-2">Preferred interface</legend>
          <p className="text-sm opacity-70 mb-3">
            Other people do not see a disability label. They only receive the interface you choose: audio, text, video, or sign.
          </p>
          {([
            ['text', 'Text and captions'],
            ['audio', 'Audio'],
            ['video', 'Video'],
            ['sign', 'Sign language']
          ] as const).map(([value, label]) => (
            <label key={value} className="flex items-center gap-3 min-h-[44px]">
              <input type="radio" name="pref" checked={commPref === value} onChange={() => setCommPref(value)} />
              {label}
            </label>
          ))}
        </fieldset>
        <label className="flex items-center gap-3 min-h-[44px]">
          <input type="checkbox" checked={discoverable} onChange={(e) => setDiscoverable(e.target.checked)} />
          Allow people to find me by name, email, or phone
        </label>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <Button type="submit" fullWidth disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
      </form>
    </div>
  );
}
