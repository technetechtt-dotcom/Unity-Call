import { useState, useEffect, useCallback } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { voiceSpeed, language } = useAccessibility();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);

      const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const getBestVoice = useCallback(
    (lang: string) => {
      // Map app language to BCP 47
      const langCode =
      lang === 'isiZulu' ?
      'zu' :
      lang === 'Afrikaans' ?
      'af' :
      lang === 'isiXhosa' ?
      'xh' :
      'en';

      return (
        voices.find((v) => v.lang.startsWith(langCode)) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0]);

    },
    [voices]
  );

  const speak = useCallback(
    (text: string) => {
      if (!supported) return;

      // Cancel any current speaking
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceSpeed;

      // Try to match voice to current app language
      const voice = getBestVoice(language);
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [supported, voiceSpeed, language, getBestVoice]
  );

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  return { speak, cancel, isSpeaking, supported, voices };
}