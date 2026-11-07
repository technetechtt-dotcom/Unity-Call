import { useState, useEffect, useCallback } from 'react';

export interface SpeechSegment {
  id: string;
  text: string;
  timestamp: number;
  confidence: number;
  isFinal: boolean;
}

export function useSpeechRecognition(lang = 'en-US') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [segments, setSegments] = useState<SpeechSegment[]>([]);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  // Map our app languages to BCP 47 tags
  const getLangTag = (appLang: string) => {
    switch (appLang) {
      case 'isiZulu':
        return 'zu-ZA';
      case 'Afrikaans':
        return 'af-ZA';
      case 'isiXhosa':
        return 'xh-ZA';
      case 'English':
      default:
        return 'en-US';
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const speechWindow = window as Window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
      const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSupported(true);
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = getLangTag(lang);

        recognitionInstance.onresult = (event: any) => {
          let finalTrans = '';
          let interimTrans = '';
          const newSegments: SpeechSegment[] = [];

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const text = result[0].transcript;
            const confidence = result[0].confidence;

            if (result.isFinal) {
              finalTrans += text;
              newSegments.push({
                id: Date.now().toString() + i,
                text: text.trim(),
                timestamp: Date.now(),
                confidence,
                isFinal: true
              });
            } else {
              interimTrans += text;
            }
          }

          if (finalTrans) {
            setTranscript((prev) => prev + ' ' + finalTrans);
            setSegments((prev) => [...prev, ...newSegments]);
          }
          setInterimTranscript(interimTrans);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setError(`Speech recognition unavailable: ${String(event.error)}. You can still type a reply.`);
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
        return () => { recognitionInstance.onresult = null; recognitionInstance.onerror = null; recognitionInstance.onend = null; recognitionInstance.stop(); };
      }
      setSupported(false);
      setError('Speech recognition is not supported in this browser. Typed replies remain available.');
    }
  }, [lang]);

  // Update language if recognition instance exists
  useEffect(() => {
    if (recognition) {
      recognition.lang = getLangTag(lang);
    }
  }, [lang, recognition]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        setError('');
        recognition.start();
        setIsListening(true);
      } catch (e) {
        setError('Unable to start speech recognition. Check your microphone permission.');
        console.error('Speech recognition failed to start', e);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setSegments([]);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    segments,
    startListening,
    stopListening,
    resetTranscript,
    supported,
    error
  };
}