import { useEffect, useRef, useState } from 'react';
import { FileText, Pause, Play, Volume2 } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTTS } from '../hooks/useTTS';
import { fetchMediaBlob } from '../lib/api';
import { sourceLabel } from '../lib/confirmations';
import type { ChatMessage } from '../lib/types';

interface ChatBubbleProps {
  message: string;
  isSent: boolean;
  timestamp: string;
  type?: 'text' | 'voice';
  duration?: string;
  status?: ChatMessage['status'];
  source?: ChatMessage['source'];
  media?: ChatMessage['media'];
  onRetry?: () => void;
}

export function ChatBubble({
  message,
  isSent,
  timestamp,
  type = 'text',
  duration,
  status,
  source = 'original',
  media,
  onRetry
}: ChatBubbleProps) {
  const { highContrast } = useAccessibility();
  const { speak } = useTTS();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [objectUrl, setObjectUrl] = useState('');
  const [transcript, setTranscript] = useState(media?.transcript || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let url = '';
    if (media?.url) {
      void fetchMediaBlob(media.url).then((blob) => {
        url = URL.createObjectURL(blob);
        setObjectUrl(url);
      });
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [media?.url]);

  const toggle = async () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    await audioRef.current.play();
    setPlaying(true);
  };

  const transcribe = async () => {
    if (transcript) return;
    setBusy(true);
    try {
      setTranscript(
        media?.transcript ||
          'Play the original file. If this browser can listen, add a transcript and Unity will keep it beside the original recording.'
      );
    } finally {
      setBusy(false);
    }
  };

  const bubble = isSent
    ? highContrast
      ? 'bg-primary-dark border-2 border-white text-white'
      : 'bg-primary text-white rounded-br-none'
    : highContrast
      ? 'bg-gray-800 border-2 border-white text-white'
      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm';

  return (
    <div className={`flex w-full mb-4 ${isSent ? 'justify-end' : 'justify-start'}`}>
      <article
        className={`max-w-[85%] p-4 rounded-2xl ${bubble}`}
        aria-label={`${isSent ? 'Sent' : 'Received'} ${type} message, ${status || 'sent'}, ${sourceLabel(source)} at ${timestamp}`}
      >
        <p className="text-[11px] uppercase tracking-wide opacity-70 mb-1">{sourceLabel(source)}</p>
        {type === 'voice' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void toggle()}
                className="p-2 rounded-full min-h-[44px] min-w-[44px]"
                aria-label={playing ? 'Pause voice message' : `Play voice message${duration ? `, ${duration}` : ''}`}
                aria-pressed={playing}
                disabled={!objectUrl}
              >
                {playing ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
              </button>
              <div>
                <p className="font-medium">Voice message</p>
                <p className="text-xs opacity-80">{duration || media?.mime}</p>
              </div>
            </div>
            {objectUrl && (
              <audio ref={audioRef} src={objectUrl} onEnded={() => setPlaying(false)} className="hidden" />
            )}
            <button
              type="button"
              className="flex items-center gap-1 text-xs"
              onClick={() => void transcribe()}
              disabled={busy}
            >
              <FileText size={12} />
              {transcript ? 'Transcription' : 'Transcribe audio'}
            </button>
            {transcript && <p className="text-sm">{transcript}</p>}
          </div>
        ) : (
          <div>
            {media?.kind === 'image' && media.url && (
              <figure className="mb-2">
                <img src={objectUrl} alt={media.altText || 'Shared photograph. Description not added yet.'} className="rounded-lg max-h-56" />
                <figcaption className="text-xs mt-1">{media.altText || 'No description yet.'}</figcaption>
              </figure>
            )}
            <p className="whitespace-pre-wrap leading-relaxed">{message}</p>
          </div>
        )}
        <div className="flex items-center justify-between mt-2 text-xs opacity-80 gap-3">
          <span>
            {timestamp}
            {status ? ` · ${status}` : ''}
          </span>
          <div className="flex items-center gap-2">
            {!isSent && type === 'text' && (
              <button type="button" onClick={() => speak(message)} aria-label="Read aloud">
                <Volume2 size={14} />
              </button>
            )}
            {status === 'failed' && onRetry && (
              <button type="button" onClick={onRetry} className="underline">
                Retry
              </button>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
