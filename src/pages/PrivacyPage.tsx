import { useNavigate } from '../lib/router';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';

export function PrivacyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void api('/api/reports', {
              method: 'POST',
              body: JSON.stringify({
                targetUserId: data.get('targetUserId'),
                reason: data.get('reason'),
                details: data.get('details')
              })
            }).then(() => navigate(-1));
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
          <Button type="submit" fullWidth>Submit report</Button>
        </form>
      </main>
    </div>
  );
}
