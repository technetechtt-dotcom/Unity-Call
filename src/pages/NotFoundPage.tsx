import { useNavigate } from '../lib/router';

export function NotFoundPage() {
  const navigate = useNavigate();
  return <main className="min-h-dvh flex flex-col items-center justify-center p-6 text-center gap-4">
    <h1 className="text-3xl font-bold">Page not found</h1>
    <p>This page may have moved, the link may have expired, or the address may be incorrect.</p>
    <button type="button" className="rounded-lg min-h-[48px] bg-teal-700 text-white px-6" onClick={() => navigate('/')}>Return to Unity Call</button>
  </main>;
}
