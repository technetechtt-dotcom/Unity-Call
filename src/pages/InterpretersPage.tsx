import { useEffect, useState } from 'react';
import { useNavigate } from '../lib/router';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface Interpreter {
  id: string;
  name: string;
  bio?: string;
  languages: string[];
  qualified: boolean;
  available: boolean;
}

export function InterpretersPage() {
  const navigate = useNavigate();
  const [interpreters, setInterpreters] = useState<Interpreter[]>([]);
  const [notice, setNotice] = useState('');
  const [startsAt, setStartsAt] = useState('');

  useEffect(() => {
    void api<{ interpreters: Interpreter[]; notice: string }>('/api/interpreters').then((data) => {
      setInterpreters(data.interpreters);
      setNotice(data.notice);
    });
  }, []);

  return (
    <div className="min-h-dvh">
      <header className="px-4 py-3 flex items-center gap-3 bg-white shadow-sm">
        <button type="button" className="p-2" aria-label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </button>
        <h1 className="font-bold">SASL interpreters</h1>
      </header>
      <main className="p-5 space-y-4">
        <p>{notice}</p>
        <p className="text-sm opacity-70">
          Unity recruits paid Deaf/SASL advisers and qualified interpreters. Qualification is set only after independent review. Video layouts keep faces and hands in frame.
        </p>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void api('/api/interpreters', {
              method: 'POST',
              body: JSON.stringify({
                bio: data.get('bio'),
                languages: ['SASL', 'English'],
                available: true
              })
            });
          }}
        >
          <Input name="bio" label="Apply as an interpreter" placeholder="Experience, languages, and availability" />
          <Button type="submit">Submit interpreter profile</Button>
        </form>
        <Input label="Booking time" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        {interpreters.map((item) => (
          <article key={item.id} className="p-4 rounded-xl bg-white shadow-sm">
            <h2 className="font-bold">{item.name}</h2>
            <p>{item.bio || 'Profile pending review.'}</p>
            <p className="text-sm">{item.languages.join(', ')} · {item.qualified ? 'Qualified' : 'Unverified'} · {item.available ? 'Available' : 'Unavailable'}</p>
            <Button
              className="mt-3"
              onClick={() =>
                void api(`/api/interpreters/${item.id}/book`, {
                  method: 'POST',
                  body: JSON.stringify({ startsAt: startsAt || new Date().toISOString() })
                })
              }
            >
              Request session
            </Button>
          </article>
        ))}
      </main>
    </div>
  );
}
