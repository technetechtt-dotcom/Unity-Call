import { useState, useEffect, useCallback, useRef } from 'react';

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function') {
      setSupported(true);
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!supported) {
      setError('Camera not supported');
      return null;
    }

    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 320 },
          height: { ideal: 240 }
        },
        audio: false
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);
      return mediaStream;
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please allow permissions.');
      setIsActive(false);
      return null;
    }
  }, [supported]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    stream,
    isActive,
    error,
    supported,
    startCamera,
    stopCamera
  };
}