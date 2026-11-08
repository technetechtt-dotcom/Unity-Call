import { useNavigate } from '../lib/router';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';

export function PrivacyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <div className="min-h-dvh">
      <header className="px-4 py-3 flex items-center gap-3 bg-white shadow-sm">
        <button type="button" className="p-2" aria-label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </button>
        <h1 className="font-bold">Privacy controls</h1>
      </header>
      <main className="p-6 space-y-4">
        <p>Your communication preference stays private. Blocking removes messages and calls both ways.</p>
        <p>Signed-in as {user?.name}. Reports are reviewed by Unity staff and are not shown to the reported person.</p>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {message && <p role="status" className="text-green-700">{message}</p>}
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (busy) return;
            const form = event.currentTarget;
            const data = new FormData(form);
            setError(''); setMessage(''); setBusy(true);
            void api('/api/reports', {
              method: 'POST',
              body: JSON.stringify({
                targetUserId: data.get('targetUserId'),
                reason: data.get('reason'),
                details: data.get('details')
              })
            }).then(() => { setMessage('Report submitted. Thank you for helping keep the platform safe.'); form.reset(); })
              .catch(err => setError(err instanceof Error ? err.message : 'Unable to submit report.'))
              .finally(() => setBusy(false));
          }}
        >
          <label className="block">
            User ID to report
            <input name="targetUserId" className="w-full border rounded-lg min-h-[48px] px-3" />
          </label>
          <label className="block">
            Reason
            <input name="reason" required className="w-full border rounded-lg min-h-[48px] px-3" />
          </label>
          <label className="block">
            Details
            <textarea name="details" className="w-full border rounded-lg p-3" rows={4} />
          </label>
          <Button type="submit" fullWidth disabled={busy}>{busy ? "Submitting…" : "Submit report"}</Button>
        </form>
      </main>
    </div>
  );
}
