import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Phone,
  MessageSquare } from
'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from '../hooks/useLocalStorage';
interface CallRecord {
  id: string;
  name: string;
  initials: string;
  type: 'incoming' | 'outgoing' | 'missed';
  date: string;
  duration?: string;
  color: string;
  hasCaptions?: boolean;
}
const MOCK_CALLS: CallRecord[] = [
{
  id: '1',
  name: 'Thandi Nkosi',
  initials: 'TN',
  type: 'incoming',
  date: 'Today, 2:15 PM',
  duration: '5 min',
  color: 'bg-purple-100 text-purple-700',
  hasCaptions: true
},
{
  id: '2',
  name: 'James Wilson',
  initials: 'JW',
  type: 'outgoing',
  date: 'Today, 11:00 AM',
  duration: '12 min',
  color: 'bg-blue-100 text-blue-700'
},
{
  id: '3',
  name: 'Nomsa Dlamini',
  initials: 'ND',
  type: 'missed',
  date: 'Yesterday, 4:30 PM',
  color: 'bg-green-100 text-green-700'
},
{
  id: '4',
  name: 'Lerato Molefe',
  initials: 'LM',
  type: 'incoming',
  date: 'Yesterday, 10:00 AM',
  duration: '3 min',
  color: 'bg-pink-100 text-pink-700',
  hasCaptions: true
},
{
  id: '5',
  name: 'David Chen',
  initials: 'DC',
  type: 'outgoing',
  date: 'Mon, 3:45 PM',
  duration: '8 min',
  color: 'bg-orange-100 text-orange-700'
}];

interface CallHistoryPageProps {
  onNavigate: (page: string, params?: any) => void;
}
export function CallHistoryPage({ onNavigate }: CallHistoryPageProps) {
  const { highContrast } = useAccessibility();
  const { t } = useTranslation();
  const [calls] = useLocalStorage<CallRecord[]>('unitycall_history', MOCK_CALLS);
  const getIcon = (type: CallRecord['type']) => {
    switch (type) {
      case 'incoming':
        return <PhoneIncoming size={16} className="text-green-500" />;
      case 'outgoing':
        return <PhoneOutgoing size={16} className="text-gray-500" />;
      case 'missed':
        return <PhoneMissed size={16} className="text-red-500" />;
    }
  };
  const getLabel = (type: CallRecord['type']) => {
    switch (type) {
      case 'incoming':
        return t('call.incomingLabel');
      case 'outgoing':
        return t('call.outgoing');
      case 'missed':
        return t('call.missed');
    }
  };
  return (
    <div
      className={`flex flex-col h-full pb-20 ${highContrast ? 'bg-black text-white' : 'bg-background-light'}`}>
      
      <header
        className={`
        px-6 py-4 sticky top-0 z-10 flex items-center justify-between
        ${highContrast ? 'bg-gray-900 border-b-2 border-white' : 'bg-white shadow-sm'}
      `}>
        
        <h1 className="text-2xl font-bold">{t('call.history')}</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {calls.length === 0 ?
        <div className="text-center py-10 opacity-60">
            <p>{t('call.noCalls')}</p>
          </div> :

        calls.map((call) =>
        <div
          key={call.id}
          className={`
                w-full flex items-center p-4 rounded-2xl transition-all
                ${highContrast ? 'bg-gray-900 border-2 border-white' : 'bg-white shadow-sm border border-transparent'}
              `}>
          
              <div
            className={`
                w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mr-4 flex-shrink-0
                ${highContrast ? 'bg-white text-black border-2 border-white' : call.color}
              `}>
            
                {call.initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-lg truncate">
                    {call.name}
                  </span>
                  {call.hasCaptions &&
              <MessageSquare
                size={14}
                className="text-teal-500 ml-2"
                aria-label="Captions used" />

              }
                </div>
                <div className="flex items-center space-x-2 text-sm opacity-70">
                  {getIcon(call.type)}
                  <span>{getLabel(call.type)}</span>
                  {call.duration && <span>• {call.duration}</span>}
                </div>
                <div className="text-xs opacity-50 mt-1">{call.date}</div>
              </div>

              <button
            onClick={() =>
            onNavigate('chatThread', {
              name: call.name
            })
            }
            className={`
                  p-3 rounded-full ml-2
                  ${highContrast ? 'bg-white text-black border border-black' : 'bg-gray-100 text-teal-700 hover:bg-teal-50'}
                `}
            aria-label={`${t('call.callback')} ${call.name}`}>
            
                <Phone size={20} />
              </button>
            </div>
        )
        }
      </main>

      <BottomNav
        currentTab="calls"
        onTabChange={(tab) => {
          if (tab === 'chats') onNavigate('chatList');
          if (tab === 'settings') onNavigate('settings');
        }} />
      
    </div>);

}