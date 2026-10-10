import { isValidatedSign } from '../lib/signRecognition';
import { VALIDATED_SIGNS } from '../lib/types';

interface SignAvatarPlayerProps {
  text: string;
  isActive: boolean;
  size?: 'compact' | 'full';
  onComplete?: () => void;
}

export function SignAvatarPlayer({ text, isActive, size = 'compact' }: SignAvatarPlayerProps) {
  const words = text
    .toUpperCase()
    .split(/\s+/)
    .filter((word) => isValidatedSign(word));
  const playable = words.length > 0;

  return (
    <aside
      className={`rounded-2xl p-3 ${size === 'compact' ? 'w-40' : 'w-full'} bg-indigo-950 text-white`}
      aria-label="Experimental sign avatar"
    >
      <p className="text-[11px] uppercase tracking-wide opacity-70">Validated signs only</p>
      {isActive && playable ? (
        <p className="font-bold mt-2">{words.join(' · ')}</p>
      ) : (
        <p className="text-sm mt-2">
          Avatar idle. Unity only plays linguistically validated items: {VALIDATED_SIGNS.join(', ')}.
        </p>
      )}
    </aside>
  );
}
