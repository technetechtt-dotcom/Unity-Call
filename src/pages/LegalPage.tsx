import { useEffect, useState } from 'react';
import { useNavigate } from '../lib/router';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';

export function LegalPage({ kind }: { kind: 'privacy' | 'terms' | 'help' }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('Unity');
  const [sections, setSections] = useState<string[]>([]);

  useEffect(() => {
    void api<{ title: string; sections: string[] }>(`/api/legal/${kind}`).then((data) => {
      setTitle(data.title);
      setSections(data.sections);
    });
  }, [kind]);

  return (
    <article className="min-h-dvh">
      <header className="px-4 py-3 flex items-center gap-3 bg-white shadow-sm">
        <button type="button" className="p-2" aria-label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </button>
        <h1 className="font-bold">{title}</h1>
      </header>
      <div className="p-6 space-y-4">
        {sections.map((section) => (
          <p key={section}>{section}</p>
        ))}
      </div>
    </article>
  );
}
