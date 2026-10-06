import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { Search, Plus, Eye, Ear, MessageSquare } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ConnectionBanner } from '../components/ConnectionBanner';
import { useTranslation } from 'react-i18next';
interface Chat {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread: number;
  color: string;
  accessibility?: 'blind' | 'deaf' | 'hoh';
}
const INITIAL_CHATS: Chat[] = [
{
  id: '1',
  name: 'Thandi Nkosi',
  initials: 'TN',
  lastMessage: 'See you at 3pm! 👋',
  time: '2:40 PM',
  unread: 2,
  color: 'bg-purple-100 text-purple-700',
  accessibility: 'deaf'
},
{
  id: '2',
  name: 'James Wilson',
  initials: 'JW',
  lastMessage: 'The meeting notes are ready',
  time: '1:15 PM',
  unread: 0,
  color: 'bg-blue-100 text-blue-700'
},
{
  id: '3',
  name: 'Nomsa Dlamini',
  initials: 'ND',
  lastMessage: 'Voice message (0:12)',
  time: '11:30 AM',
  unread: 1,
  color: 'bg-green-100 text-green-700',
  accessibility: 'blind'
},
{
  id: '4',
  name: 'David Chen',
  initials: 'DC',
  lastMessage: 'Thanks for the update',
  time: 'Yesterday',
  unread: 0,
  color: 'bg-orange-100 text-orange-700'
},
{
  id: '5',
  name: 'Lerato Molefe',
  initials: 'LM',
  lastMessage: 'Can you send the captions?',
  time: 'Yesterday',
  unread: 3,
  color: 'bg-pink-100 text-pink-700',
  accessibility: 'hoh'
},
{
  id: '6',
  name: 'Sarah Johnson',
  initials: 'SJ',
  lastMessage: 'Great, talk tomorrow!',
  time: 'Mon',
  unread: 0,
  color: 'bg-teal-100 text-teal-700'
}];

interface ChatListPageProps {
  onNavigate: (page: string, params?: any) => void;
}
export function ChatListPage({ onNavigate }: ChatListPageProps) {
  const { highContrast } = useAccessibility();
  const { t } = useTranslation();
  const [chats] = useLocalStorage<Chat[]>('unitycall_chats', INITIAL_CHATS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const filteredChats = chats.filter(
    (chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div
      className={`flex flex-col h-full pb-20 ${highContrast ? 'bg-black text-white' : 'bg-background-light'}`}>
      
      {/* Header */}
      <header
        className={`
        px-6 py-4 sticky top-0 z-10
        ${highContrast ? 'bg-gray-900 border-b-2 border-white' : 'bg-white shadow-sm'}
      `}>
        
        {isSearching ?
        <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('home.search')}
              autoFocus
              className={`
                  w-full pl-10 pr-4 py-2 rounded-full border-2 focus:outline-none
                  ${highContrast ? 'bg-black border-white text-white placeholder-gray-400' : 'bg-gray-100 border-transparent text-gray-900 focus:bg-white focus:border-primary'}
                `}
              aria-label="Search conversations" />
            
              <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            
            </div>
            <button
            onClick={() => {
              setIsSearching(false);
              setSearchQuery('');
            }}
            className="p-2"
            aria-label="Cancel search">
            
              <span className="font-medium text-sm">Cancel</span>
            </button>
          </div> :

        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t('home.title')}</h1>
            <button
            onClick={() => setIsSearching(true)}
            className={`p-2 rounded-full ${highContrast ? 'bg-white text-black' : 'bg-gray-100 text-gray-700'}`}
            aria-label="Search conversations">
            
              <Search size={24} />
            </button>
          </div>
        }
      </header>

      <ConnectionBanner />

      {/* Chat List */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {filteredChats.length === 0 ?
        <div className="text-center py-10 opacity-60">
            <p>{t('home.noChats')}</p>
          </div> :

        filteredChats.map((chat) =>
        <button
          key={chat.id}
          onClick={() =>
          onNavigate('chatThread', {
            chatId: chat.id,
            name: chat.name
          })
          }
          className={`
                w-full flex items-center p-4 rounded-2xl transition-all text-left
                ${highContrast ? 'bg-gray-900 border-2 border-white hover:bg-gray-800' : 'bg-white hover:bg-gray-50 shadow-sm border border-transparent'}
              `}
          aria-label={`Chat with ${chat.name}, ${chat.unread} unread messages. Last message: ${chat.lastMessage}`}>
          
              {/* Avatar */}
              <div
            className={`
                w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mr-4 flex-shrink-0
                ${highContrast ? 'bg-white text-black border-2 border-white' : chat.color}
              `}>
            
                {chat.initials}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg truncate">
                      {chat.name}
                    </span>
                    {chat.accessibility === 'deaf' &&
                <Ear
                  size={16}
                  className="text-blue-500"
                  aria-label="User is deaf or hard of hearing" />

                }
                    {chat.accessibility === 'blind' &&
                <Eye
                  size={16}
                  className="text-green-600"
                  aria-label="User is blind or low vision" />

                }
                    {chat.accessibility === 'hoh' &&
                <Ear
                  size={16}
                  className="text-orange-500"
                  aria-label="User is hard of hearing" />

                }
                  </div>
                  <span
                className={`text-xs font-medium ${highContrast ? 'text-gray-300' : 'text-gray-500'}`}>
                
                    {chat.time}
                  </span>
                </div>
                <p
              className={`text-sm truncate ${highContrast ? 'text-gray-300' : 'text-gray-600'} ${chat.unread > 0 ? 'font-semibold' : ''}`}>
              
                  {chat.lastMessage}
                </p>
              </div>

              {/* Unread Badge */}
              {chat.unread > 0 &&
          <div
            className={`
                  ml-3 min-w-[24px] h-6 px-1.5 rounded-full flex items-center justify-center text-xs font-bold
                  ${highContrast ? 'bg-yellow-400 text-black border border-white' : 'bg-accent text-white'}
                `}>
            
                  {chat.unread}
                </div>
          }
            </button>
        )
        }
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => {}}
        className={`
          fixed bottom-24 right-6 p-4 rounded-full shadow-lg flex items-center space-x-2
          ${highContrast ? 'bg-yellow-400 text-black border-4 border-black ring-2 ring-white' : 'bg-primary text-white hover:bg-primary-dark'}
        `}
        aria-label="Start new chat">
        
        <Plus size={24} strokeWidth={3} />
        <span className="font-bold pr-1">{t('home.newChat')}</span>
      </button>

      <BottomNav
        currentTab="chats"
        onTabChange={(tab) => {
          if (tab === 'settings') onNavigate('settings');
          if (tab === 'calls') onNavigate('callHistory');
        }} />
      
    </div>);

}