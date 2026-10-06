import React, { useEffect, useState, useRef } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useUser } from '../context/UserContext';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Type,
  Subtitles,
  History,
  AlertCircle,
  Hand,
  User } from
'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useCaptionHistory } from '../hooks/useCaptionHistory';
import { useTranslation } from 'react-i18next';
import { SignLanguagePanel } from '../components/SignLanguagePanel';
import { SignAvatarPlayer } from '../components/SignAvatarPlayer';
interface ActiveCallPageProps {
  onEndCall: () => void;
  callerName?: string;
}
export function ActiveCallPage({
  onEndCall,
  callerName = 'Thandi Nkosi'
}: ActiveCallPageProps) {
  const {
    highContrast,
    fontSize,
    setFontSize,
    language,
    captionOverlayOpacity,
    signLanguageEnabled,
    signAvatarEnabled
  } = useAccessibility();
  const { user } = useUser();
  const { t } = useTranslation();
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showSignPanel, setShowSignPanel] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentAvatarText, setCurrentAvatarText] = useState('');
  // Auto-enable captions for deaf/HoH users
  useEffect(() => {
    if (user.accessibilityType === 'deaf' || user.accessibilityType === 'hoh') {
      setCaptionsEnabled(true);
    }
  }, [user.accessibilityType]);
  // Auto-show sign panel if enabled in settings
  useEffect(() => {
    if (signLanguageEnabled) {
      setShowSignPanel(true);
    }
  }, [signLanguageEnabled]);
  // Auto-show avatar if enabled in settings
  useEffect(() => {
    if (signAvatarEnabled) {
      setShowAvatar(true);
    }
  }, [signAvatarEnabled]);
  const {
    transcript,
    interimTranscript,
    segments,
    startListening,
    stopListening,
    supported: sttSupported
  } = useSpeechRecognition(language);
  const { history, addSegment } = useCaptionHistory('current_call');
  const [mockTranscript, setMockTranscript] = useState('');
  const captionsEndRef = useRef<HTMLDivElement>(null);
  // Sync segments to history and avatar
  useEffect(() => {
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      addSegment({
        id: lastSegment.id,
        text: lastSegment.text,
        timestamp: new Date().toLocaleTimeString(),
        confidence: lastSegment.confidence,
        isFinal: true,
        speaker: callerName
      });
      // Feed text to avatar if it's a new final segment
      if (showAvatar && lastSegment.isFinal) {
        setCurrentAvatarText(lastSegment.text);
      }
    }
  }, [segments, callerName, showAvatar]);
  // Handle detected signs
  const handleSignDetected = (text: string) => {
    // Add detected sign to history as "Me"
    addSegment({
      id: Date.now().toString(),
      text: `[Sign] ${text}`,
      timestamp: new Date().toLocaleTimeString(),
      confidence: 1.0,
      isFinal: true,
      speaker: 'Me'
    });
  };
  // Auto-scroll captions
  useEffect(() => {
    if (captionsEndRef.current) {
      captionsEndRef.current.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, [transcript, interimTranscript, mockTranscript, showHistory, history]);
  // Call duration timer
  useEffect(() => {
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  // Manage Speech Recognition
  useEffect(() => {
    if (captionsEnabled) {
      if (sttSupported) {
        startListening();
      } else {
        // Fallback mock captions logic
        const phrases = [
        'Hello, can you hear me clearly?',
        ' ... ',
        'I wanted to discuss the project timeline.',
        ' ... ',
        'We need to finalize the design by Friday.',
        ' ... ',
        'The accessibility audit is scheduled for next week.'];

        let currentIndex = 0;
        let charIndex = 0;
        const interval = setInterval(() => {
          if (currentIndex >= phrases.length) return;
          const phrase = phrases[currentIndex];
          if (charIndex < phrase.length) {
            setMockTranscript((prev) => prev + phrase[charIndex]);
            charIndex++;
          } else {
            currentIndex++;
            charIndex = 0;
            // Also feed mock text to avatar
            if (showAvatar) {
              setCurrentAvatarText(phrases[currentIndex % phrases.length]);
            }
          }
        }, 100);
        return () => clearInterval(interval);
      }
    } else {
      stopListening();
    }
    return () => stopListening();
  }, [captionsEnabled, sttSupported, startListening, stopListening, showAvatar]);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <div
      className={`flex flex-col h-full relative ${highContrast ? 'bg-black text-white' : 'bg-gray-900 text-white'}`}>
      
      {/* Sign Language Panel Overlay (Input) */}
      {showSignPanel &&
      <SignLanguagePanel
        onClose={() => setShowSignPanel(false)}
        onSignDetected={handleSignDetected} />

      }

      {/* Avatar Player Overlay (Output) */}
      {showAvatar &&
      <div className="absolute top-24 left-4 z-40 shadow-xl">
          <SignAvatarPlayer
          text={currentAvatarText}
          isActive={!!currentAvatarText}
          size="compact"
          onComplete={() => setCurrentAvatarText('')} />
        
          <button
          onClick={() => setShowAvatar(false)}
          className="absolute -top-2 -right-2 bg-black/50 text-white rounded-full p-1 hover:bg-red-500">
          
            <User size={12} />
          </button>
        </div>
      }

      {/* Header */}
      <header className="p-6 text-center relative">
        <h1 className="text-2xl font-bold mb-1">{callerName}</h1>
        <p
          className="text-teal-200 font-mono text-lg"
          aria-label={`Call duration: ${formatTime(duration)}`}>
          
          {formatTime(duration)}
        </p>

        {/* Caption History Toggle */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`absolute right-6 top-6 p-2 rounded-full ${showHistory ? 'bg-teal-600 text-white' : 'bg-white/10 text-white'}`}
          aria-label={
          showHistory ? 'Hide caption history' : 'Show caption history'
          }>
          
          <History size={20} />
        </button>
      </header>

      {/* Captions Area */}
      <main className="flex-1 px-4 py-2 flex flex-col min-h-0 relative">
        {captionsEnabled ?
        <div
          className={`
            flex-1 rounded-2xl p-6 overflow-y-auto relative flex flex-col
            ${highContrast ? 'bg-gray-900 border-2 border-white' : 'backdrop-blur-md border border-white/10'}
          `}
          style={{
            backgroundColor: highContrast ?
            undefined :
            `rgba(0,0,0,${captionOverlayOpacity})`
          }}>
          
            <div className="absolute top-4 right-4 flex space-x-2 z-10">
              <button
              onClick={() =>
              setFontSize(
                fontSize === 'normal' ?
                'large' :
                fontSize === 'large' ?
                'xlarge' :
                'normal'
              )
              }
              className="p-2 bg-white/10 rounded-full hover:bg-white/20"
              aria-label="Adjust caption size">
              
                <Type size={20} />
              </button>
            </div>

            <div
            className="font-medium leading-relaxed tracking-wide flex-1"
            aria-live="polite"
            role="log">
            
              {showHistory ?
            <div className="space-y-4">
                  <h3 className="text-sm uppercase tracking-wider opacity-50 border-b border-white/20 pb-2 mb-4">
                    Transcript History
                  </h3>
                  {history.map((seg, i) =>
              <div key={i} className="flex flex-col">
                      <div className="flex justify-between text-xs opacity-50 mb-1">
                        <span
                    className={
                    seg.speaker === 'Me' ? 'text-yellow-400' : ''
                    }>
                    
                          {seg.speaker}
                        </span>
                        <span>{seg.timestamp}</span>
                      </div>
                      <p
                  className={
                  seg.confidence < 0.8 ? 'opacity-80 italic' : ''
                  }>
                  
                        {seg.text}
                      </p>
                    </div>
              )}
                  {history.length === 0 &&
              <p className="opacity-50 text-center py-4">
                      No history yet
                    </p>
              }
                </div> :

            <>
                  <span className="opacity-60 block mb-2 text-xs uppercase tracking-wider">
                    {sttSupported ? 'Live Captions' : 'Simulated Captions'}
                    {!sttSupported &&
                <span className="ml-2 text-yellow-400">
                        (Browser not supported)
                      </span>
                }
                  </span>

                  {sttSupported ?
              <div>
                      {/* Show last few finalized segments for context */}
                      {segments.slice(-2).map((seg) =>
                <span key={seg.id} className="opacity-70 mr-1">
                          {seg.text}
                        </span>
                )}
                      {/* Current interim result */}
                      <span className="font-bold text-white">
                        {interimTranscript}
                      </span>
                    </div> :

              <p>{mockTranscript}</p>
              }
                  <span className="animate-pulse inline-block w-2 h-4 bg-teal-400 ml-1 align-middle"></span>
                </>
            }
              <div ref={captionsEndRef} />
            </div>
          </div> :

        <div className="flex-1 flex items-center justify-center opacity-30">
            <div className="text-center">
              <Subtitles size={48} className="mx-auto mb-2" />
              <p>{t('call.captions')} Paused</p>
            </div>
          </div>
        }
      </main>

      {/* Controls */}
      <footer
        className={`
        p-6 pb-8 rounded-t-3xl
        ${highContrast ? 'bg-gray-800 border-t-2 border-white' : 'bg-gray-800/80 backdrop-blur-lg'}
      `}>
        
        <div className="grid grid-cols-5 gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex flex-col items-center space-y-2"
            aria-label={isMuted ? t('call.mute') : 'Unmute'}
            aria-pressed={isMuted}>
            
            <div
              className={`
              w-12 h-12 rounded-full flex items-center justify-center transition-colors
              ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}
            `}>
              
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </div>
            <span className="text-[10px] font-medium">{t('call.mute')}</span>
          </button>

          <button
            onClick={() => setShowSignPanel(!showSignPanel)}
            className="flex flex-col items-center space-y-2"
            aria-label={
            showSignPanel ? 'Hide sign language' : 'Show sign language'
            }
            aria-pressed={showSignPanel}>
            
            <div
              className={`
              w-12 h-12 rounded-full flex items-center justify-center transition-colors
              ${showSignPanel ? 'bg-teal-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}
            `}>
              
              <Hand size={20} />
            </div>
            <span className="text-[10px] font-medium">Sign</span>
          </button>

          <button
            onClick={() => setShowAvatar(!showAvatar)}
            className="flex flex-col items-center space-y-2"
            aria-label={showAvatar ? 'Hide avatar' : 'Show avatar'}
            aria-pressed={showAvatar}>
            
            <div
              className={`
              w-12 h-12 rounded-full flex items-center justify-center transition-colors
              ${showAvatar ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}
            `}>
              
              <User size={20} />
            </div>
            <span className="text-[10px] font-medium">Avatar</span>
          </button>

          <button
            onClick={() => setCaptionsEnabled(!captionsEnabled)}
            className="flex flex-col items-center space-y-2"
            aria-label={captionsEnabled ? 'Hide captions' : t('call.captions')}
            aria-pressed={captionsEnabled}>
            
            <div
              className={`
              w-12 h-12 rounded-full flex items-center justify-center transition-colors
              ${captionsEnabled ? 'bg-teal-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}
            `}>
              
              <Subtitles size={20} />
            </div>
            <span className="text-[10px] font-medium">
              {t('call.captions')}
            </span>
          </button>

          <button
            onClick={onEndCall}
            className="flex flex-col items-center space-y-2"
            aria-label={t('call.end')}>
            
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-600 text-white hover:bg-red-700">
              <PhoneOff size={20} />
            </div>
            <span className="text-[10px] font-medium">{t('call.end')}</span>
          </button>
        </div>
      </footer>
    </div>);

}