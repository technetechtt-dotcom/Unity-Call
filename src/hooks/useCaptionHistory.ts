import { useLocalStorage } from './useLocalStorage';

export interface CaptionSegment {
  id: string;
  text: string;
  timestamp: string;
  confidence: number;
  isFinal: boolean;
  speaker?: string;
}

export function useCaptionHistory(callId: string) {
  const [history, setHistory] = useLocalStorage<CaptionSegment[]>(
    `captions_${callId}`,
    []
  );

  const addSegment = (segment: CaptionSegment) => {
    setHistory((prev) => {
      // If the last segment was interim and this one is final/interim update of same ID, replace it
      // Otherwise append
      const existingIndex = prev.findIndex((s) => s.id === segment.id);
      if (existingIndex >= 0) {
        const newHistory = [...prev];
        newHistory[existingIndex] = segment;
        return newHistory;
      }
      return [...prev, segment];
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return { history, addSegment, clearHistory };
}