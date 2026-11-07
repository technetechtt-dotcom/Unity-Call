import { useEffect, useRef } from 'react';
import { Hand, X } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useAccessibility } from '../context/AccessibilityContext';
import { SIGN_NOTICE, isValidatedSign } from '../lib/signRecognition';
import { VALIDATED_SIGNS } from '../lib/types';

interface SignLanguagePanelProps {
  onClose: () => void;
  onSignDetected?: (text: string) => void;
}

export function SignLanguagePanel({ onClose, onSignDetected }: SignLanguagePanelProps) {
  const { stream, isActive, error, startCamera, stopCamera } = useCamera();
  const { highContrast } = useAccessibility();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    void startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div
      className={`absolute bottom-24 right-4 w-64 rounded-2xl overflow-hidden shadow-2xl border-4 z-50 ${
        highContrast ? 'border-white bg-black' : 'border-teal-500 bg-gray-900 text-white'
      }`}
    >
      <div className="p-2 flex justify-between items-center bg-black/70">
        <div className="flex items-center gap-1 text-xs font-bold">
          <Hand size={12} />
          Manual SASL phrase selection
        </div>
        <button type="button" onClick={onClose} className="p-2" aria-label="Close sign panel">
          <X size={16} />
        </button>
      </div>
      <div className="relative h-40 bg-gray-800">
        {isActive ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : (
          <p className="p-3 text-sm">{error || 'Starting camera. Unity needs camera permission to show framing guidance.'}</p>
        )}
        <div className="absolute inset-6 border-2 border-dashed border-yellow-300 pointer-events-none" aria-hidden="true" />
        <p className="absolute bottom-1 left-1 right-1 text-[10px] bg-black/70 p-1">
          Keep your face and both hands inside the frame.
        </p>
      </div>
      <p className="p-2 text-[11px] leading-snug">{SIGN_NOTICE}</p>
      <div className="grid grid-cols-3 gap-1 p-2">
        {VALIDATED_SIGNS.map((sign) => (
          <button
            key={sign}
            type="button"
            className="min-h-[40px] text-[11px] bg-white/10 rounded"
            onClick={() => {
              if (isValidatedSign(sign)) onSignDetected?.(sign);
            }}
          >
            {sign}
          </button>
        ))}
      </div>
    </div>
  );
}
