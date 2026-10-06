import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTranslation } from 'react-i18next';
interface QuickRepliesProps {
  onSelect: (text: string) => void;
}
export function QuickReplies({ onSelect }: QuickRepliesProps) {
  const { highContrast } = useAccessibility();
  const { t } = useTranslation();
  const replies = [
  t('quickReply.sure'),
  t('quickReply.thanks'),
  t('quickReply.onMyWay'),
  t('quickReply.soundsGood'),
  t('quickReply.letMeCheck'),
  t('quickReply.callYouBack')];

  return (
    <div className="flex space-x-2 overflow-x-auto pb-2 px-1 no-scrollbar">
      {replies.map((reply, index) =>
      <button
        key={index}
        onClick={() => onSelect(reply)}
        className={`
            flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap
            ${highContrast ? 'bg-gray-800 border border-white text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'}
          `}>
        
          {reply}
        </button>
      )}
    </div>);

}