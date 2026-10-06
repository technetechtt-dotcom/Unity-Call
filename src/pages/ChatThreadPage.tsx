import React, { useEffect, useState, useRef } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useUser } from '../context/UserContext';
import {
  ArrowLeft,
  Phone,
  Type,
  Mic,
  Send,
  StopCircle,
  Play,
  Pause } from
'lucide-react';
import { ChatBubble } from '../components/ChatBubble';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTTS } from '../hooks/useTTS';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useTranslation } from 'react-i18next';
import { QuickReplies } from '../components/QuickReplies';
interface Message {
  id: string;
  text: string;
  isSent: boolean;
  time: string;
  type: 'text' | 'voice';
  duration?: string;
  audioUrl?: string;
}
const MOCK_MESSAGES: Message[] = [
{
  id: '1',
  text: 'Hi! Are we still meeting today?',
  isSent: false,
  time: '2:30 PM',
  type: 'text'
},
{
  id: '2',
  text: 'Yes! Conference room B at 3pm',
  isSent: true,
  time: '2:32 PM',
  type: 'text'
},
{
  id: '3',
  text: 'Perfect. I will have captions enabled',
  isSent: false,
  time: '2:33 PM',
  type: 'text'
},
{
  id: '4',
  text: 'Voice message',
  isSent: true,
  time: '2:35 PM',
  type: 'voice',
  duration: '0:08'
},
{
  id: '5',
  text: 'See you at 3pm! 👋',
  isSent: false,
  time: '2:40 PM',
  type: 'text'
}];

interface ChatThreadPageProps {
  onBack: () => void;
  onCall: () => void;
  contactName?: string;
}
export function ChatThreadPage({
  onBack,
  onCall,
  contactName = 'Thandi Nkosi'
}: ChatThreadPageProps) {
  const { highContrast, fontSize, setFontSize, ttsEnabled } = useAccessibility();
  const { user } = useUser();
  const { t } = useTranslation();
  const [messages, setMessages] = useLocalStorage<Message[]>(
    `chat_${contactName}`,
    MOCK_MESSAGES
  );
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { speak } = useTTS();
  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    audioUrl,
    resetRecording
  } = useVoiceRecorder();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  // Auto-read new incoming messages
  useEffect(() => {
    if (ttsEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (!lastMsg.isSent && lastMsg.type === 'text') {
        speak(lastMsg.text);
      }
    }
  }, [messages, ttsEnabled, speak]);
  // Handle voice recording completion
  useEffect(() => {
    if (audioUrl && !isRecording) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: 'Voice message',
        isSent: true,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        type: 'voice',
        duration: formatDuration(duration),
        audioUrl: audioUrl
      };
      setMessages((prev) => [...prev, newMessage]);
      resetRecording();
    }
  }, [audioUrl, isRecording]);
  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isSent: true,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      type: 'text'
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    // Simulate typing reply
    setTimeout(() => setIsTyping(true), 1000);
    setTimeout(() => {
      setIsTyping(false);
      const reply: Message = {
        id: Date.now().toString(),
        text: 'Got it, thanks!',
        isSent: false,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        type: 'text'
      };
      setMessages((prev) => [...prev, reply]);
    }, 3000);
  };
  const cycleFontSize = () => {
    if (fontSize === 'normal') setFontSize('large');else
    if (fontSize === 'large') setFontSize('xlarge');else
    setFontSize('normal');
  };
  return (
    <div
      className={`flex flex-col h-full ${highContrast ? 'bg-black text-white' : 'bg-background-light'}`}>
      
      {/* Header */}
      <header
        className={`
        px-4 py-3 flex items-center justify-between shadow-sm z-10
        ${highContrast ? 'bg-gray-900 border-b-2 border-white' : 'bg-white'}
      `}>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className={`p-2 rounded-full ${highContrast ? 'bg-white text-black' : 'hover:bg-gray-100'}`}
            aria-label={t('chat.back')}>
            
            <ArrowLeft size={24} />
          </button>

          <div className="flex flex-col">
            <h1 className="font-bold text-lg leading-tight">{contactName}</h1>
            <span
              className={`text-xs ${highContrast ? 'text-green-300' : 'text-green-600'}`}>
              
              {t('chat.online')}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={cycleFontSize}
            className={`p-2 rounded-full ${highContrast ? 'bg-gray-800 border border-white' : 'hover:bg-gray-100'}`}
            aria-label={`Change text size. Current: ${fontSize}`}>
            
            <Type size={20} />
          </button>
          <button
            onClick={onCall}
            className={`
              flex items-center space-x-1 px-3 py-2 rounded-full font-semibold text-sm
              ${highContrast ? 'bg-green-900 text-white border border-white' : 'bg-green-100 text-green-700'}
            `}
            aria-label={`${t('chat.call')} ${contactName}`}>
            
            <Phone size={18} />
            <span>{t('chat.call')}</span>
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <main
        className="flex-1 overflow-y-auto px-4 py-4"
        role="log"
        aria-label="Message history">
        
        {messages.map((msg) =>
        <ChatBubble
          key={msg.id}
          message={msg.text}
          isSent={msg.isSent}
          timestamp={msg.time}
          type={msg.type}
          duration={msg.duration} />

        )}

        {isTyping &&
        <div className="flex justify-start mb-4">
            <div
            className={`
              px-4 py-3 rounded-2xl rounded-bl-none
              ${highContrast ? 'bg-gray-800 border-2 border-white text-white' : 'bg-white border border-gray-200'}
            `}>
            
              <span className="text-sm opacity-70 animate-pulse">
                {t('chat.typing')}
              </span>
            </div>
          </div>
        }

        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer
        className={`
        p-4 border-t flex flex-col space-y-3
        ${highContrast ? 'bg-gray-900 border-white' : 'bg-white border-gray-200'}
      `}>
        
        {/* Quick Replies (only show if not recording) */}
        {!isRecording &&
        <QuickReplies
          onSelect={(text) => {
            setInputText(text);
            // Optional: auto-send or just fill input
          }} />

        }

        <form onSubmit={handleSend} className="flex items-end space-x-2">
          <div
            className={`
            flex-1 rounded-2xl flex items-center border-2 transition-colors overflow-hidden
            ${isRecording ? 'bg-red-50 border-red-500' : 'bg-gray-100 border-transparent focus-within:border-primary focus-within:bg-white'}
          `}>
            
            {isRecording ?
            <div className="flex-1 px-4 py-3 flex items-center justify-between text-red-600 font-medium animate-pulse">
                <span>Recording... {formatDuration(duration)}</span>
                <div className="flex space-x-1 h-4 items-end">
                  {[1, 2, 3, 4, 5].map((i) =>
                <div
                  key={i}
                  className="w-1 bg-red-500 animate-bounce"
                  style={{
                    height: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.1}s`
                  }} />

                )}
                </div>
              </div> :

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('chat.typeMessage')}
              className="flex-1 bg-transparent px-4 py-3 focus:outline-none min-h-[48px]"
              aria-label={t('chat.typeMessage')} />

            }
          </div>

          {inputText && !isRecording ?
          <button
            type="submit"
            className={`
                p-3 rounded-full flex-shrink-0
                ${highContrast ? 'bg-primary-dark border-2 border-white' : 'bg-primary text-white'}
              `}
            aria-label={t('chat.send')}>
            
              <Send size={24} />
            </button> :

          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`
                p-3 rounded-full flex-shrink-0 transition-colors
                ${isRecording ? 'bg-red-600 text-white animate-pulse' : highContrast ? 'bg-gray-800 border-2 border-white' : 'bg-gray-200 text-gray-700'}
              `}
            aria-label={isRecording ? t('chat.stopRecord') : t('chat.record')}>
            
              {isRecording ? <StopCircle size={24} /> : <Mic size={24} />}
            </button>
          }
        </form>
      </footer>
    </div>);

}