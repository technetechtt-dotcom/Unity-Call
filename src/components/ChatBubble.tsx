import React from 'react';
import { Play, Volume2, FileText } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTTS } from '../hooks/useTTS';
import { useTranslation } from 'react-i18next';
interface ChatBubbleProps {
  message: string;
  isSent: boolean;
  timestamp: string;
  type?: 'text' | 'voice';
  duration?: string;
  audioUrl?: string;
}
export function ChatBubble({
  message,
  isSent,
  timestamp,
  type = 'text',
  duration,
  audioUrl
}: ChatBubbleProps) {
  const { highContrast } = useAccessibility();
  const { speak } = useTTS();
  const { t } = useTranslation();
  const bubbleClasses = isSent ?
  highContrast ?
  'bg-primary-dark border-2 border-white text-white' :
  'bg-primary text-white rounded-br-none' :
  highContrast ?
  'bg-gray-800 border-2 border-white text-white' :
  'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm';
  const alignClasses = isSent ? 'justify-end' : 'justify-start';
  const handlePlayAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };
  return (
    <div className={`flex w-full mb-4 ${alignClasses}`}>
      <div
        className={`
          max-w-[80%] p-4 rounded-2xl relative
          ${bubbleClasses}
        `}
        role="article"
        aria-label={`${isSent ? 'Sent' : 'Received'} ${type} message at ${timestamp}`}>
        
        {type === 'voice' ?
        <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <button
              onClick={handlePlayAudio}
              className={`
                  p-2 rounded-full flex-shrink-0
                  ${isSent ? 'bg-white/20 hover:bg-white/30' : 'bg-primary/10 hover:bg-primary/20 text-primary'}
                `}
              aria-label={`Play voice message, duration ${duration}`}>
              
                <Play size={20} fill="currentColor" />
              </button>
              <div className="flex flex-col">
                <span className="font-medium">Voice Message</span>
                <span className="text-xs opacity-80">{duration}</span>
              </div>
            </div>

            {/* Transcription Button/Area */}
            <div
            className={`
              mt-2 pt-2 border-t ${isSent ? 'border-white/20' : 'border-gray-200'}
            `}>
            
              <button className="flex items-center space-x-1 text-xs font-medium opacity-80 hover:opacity-100">
                <FileText size={12} />
                <span>Transcribe Audio</span>
              </button>
            </div>
          </div> :

        <p className="whitespace-pre-wrap leading-relaxed">{message}</p>
        }

        {/* Message Footer */}
        <div
          className={`
          flex items-center justify-between mt-2 space-x-4
          ${isSent ? 'text-white/80' : 'text-gray-500'}
        `}>
          
          <span className="text-xs">{timestamp}</span>

          {!isSent && type === 'text' &&
          <button
            onClick={() => speak(message)}
            className="p-1 hover:bg-black/5 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={t('chat.readAloud')}>
            
              <Volume2 size={14} />
            </button>
          }
        </div>
      </div>
    </div>);

}