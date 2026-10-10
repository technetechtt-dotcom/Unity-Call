import { useNavigate } from '../lib/router';
import { ArrowLeft } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export function CaptionOverlayPage() {
  const navigate = useNavigate();
  const { captionOverlayOpacity, setCaptionOverlayOpacity, fontSize, setFontSize } = useAccessibility();

  return (
    <div className="min-h-dvh bg-gray-900 text-white p-6">
      <button type="button" className="mb-6 min-h-[48px]" aria-label="Back" onClick={() => navigate(-1)}>
        <ArrowLeft />
      </button>
      <h1 className="text-2xl font-bold mb-4">Caption overlay</h1>
      <label className="block mb-6">
        Background darkness {Math.round(captionOverlayOpacity * 100)}%
        <input
          type="range"
          min="0.3"
          max="1"
          step="0.1"
          value={captionOverlayOpacity}
          onChange={(e) => setCaptionOverlayOpacity(Number(e.target.value))}
          className="w-full"
        />
      </label>
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: `rgba(0,0,0,${captionOverlayOpacity})` }}
      >
        <p className={fontSize === 'xlarge' ? 'text-2xl' : fontSize === 'large' ? 'text-xl' : 'text-base'}>
          Sample caption. Original speech stays labelled separately from corrections.
        </p>
      </div>
      <button
        type="button"
        className="mt-6 underline"
        onClick={() => setFontSize(fontSize === 'normal' ? 'large' : fontSize === 'large' ? 'xlarge' : 'normal')}
      >
        Cycle caption size. Current {fontSize}.
      </button>
    </div>
  );
}
