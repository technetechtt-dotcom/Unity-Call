import React, { useState, Component } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { ArrowLeft, GripHorizontal, Pin, X, Type, Palette } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
interface CaptionOverlayPageProps {
  onBack: () => void;
}
export function CaptionOverlayPage({ onBack }: CaptionOverlayPageProps) {
  const {
    highContrast,
    captionOverlayOpacity,
    setCaptionOverlayOpacity,
    fontSize,
    setFontSize
  } = useAccessibility();
  const { t } = useTranslation();
  const [isPinned, setIsPinned] = useState(false);
  const [textColor, setTextColor] = useState<'white' | 'yellow' | 'green'>(
    'white'
  );
  return (
    <div className="flex flex-col h-full relative bg-gray-800">
      {/* Background Mock (Blurred App) */}
      <div className="absolute inset-0 opacity-30 pointer-events-none flex items-center justify-center">
        <span className="text-white text-xl">Background App Content</span>
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 flex items-center text-white bg-black/50 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full mr-2">
          
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold">{t('settings.captionOverlay')}</h1>
      </header>

      {/* The Overlay Component Demo */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div
          className={`
            w-full max-w-sm rounded-xl overflow-hidden shadow-2xl
            ${highContrast ? 'border-2 border-white' : ''}
          `}
          style={{
            backgroundColor: `rgba(0, 0, 0, ${captionOverlayOpacity})`,
            color:
            textColor === 'yellow' ?
            '#FDE047' :
            textColor === 'green' ?
            '#86EFAC' :
            'white'
          }}>
          
          {/* Overlay Header */}
          <div className="flex items-center justify-between p-2 bg-white/10 cursor-move">
            <GripHorizontal size={20} className="opacity-50" />
            <div className="flex space-x-2">
              <button
                onClick={() => setIsPinned(!isPinned)}
                className={`p-1.5 rounded hover:bg-white/20 ${isPinned ? 'text-teal-400' : 'text-white'}`}
                aria-label={isPinned ? 'Unpin overlay' : 'Pin overlay'}>
                
                <Pin size={16} fill={isPinned ? 'currentColor' : 'none'} />
              </button>
              <button className="p-1.5 rounded hover:bg-red-500/50 text-white">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Overlay Content */}
          <div className={`p-4 min-h-[120px] text-size-${fontSize}`}>
            <p className="font-medium leading-relaxed">
              This is how captions will appear over other apps. You can drag
              this window anywhere.
            </p>
          </div>
        </div>
      </main>

      {/* Controls */}
      <footer className="relative z-10 bg-white p-6 rounded-t-3xl">
        <h2 className="font-bold text-gray-900 mb-4">Appearance</h2>

        <div className="space-y-6 mb-6">
          {/* Opacity Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Opacity: {Math.round(captionOverlayOpacity * 100)}%
            </label>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.1"
              value={captionOverlayOpacity}
              onChange={(e) =>
              setCaptionOverlayOpacity(parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600" />
            
          </div>

          {/* Text Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Type size={16} className="mr-2" /> Text Size
            </label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['normal', 'large', 'xlarge'] as const).map((size) =>
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`
                    flex-1 py-2 rounded-md text-sm font-medium transition-all
                    ${fontSize === size ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}
                  `}>
                
                  {size === 'normal' ? 'Aa' : size === 'large' ? 'Aa+' : 'Aa++'}
                </button>
              )}
            </div>
          </div>

          {/* Text Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Palette size={16} className="mr-2" /> Text Color
            </label>
            <div className="flex space-x-3">
              <button
                onClick={() => setTextColor('white')}
                className={`w-8 h-8 rounded-full bg-gray-900 border-2 ${textColor === 'white' ? 'border-teal-500 ring-2 ring-teal-200' : 'border-gray-200'}`}
                aria-label="White text" />
              
              <button
                onClick={() => setTextColor('yellow')}
                className={`w-8 h-8 rounded-full bg-yellow-300 border-2 ${textColor === 'yellow' ? 'border-teal-500 ring-2 ring-teal-200' : 'border-gray-200'}`}
                aria-label="Yellow text" />
              
              <button
                onClick={() => setTextColor('green')}
                className={`w-8 h-8 rounded-full bg-green-300 border-2 ${textColor === 'green' ? 'border-teal-500 ring-2 ring-teal-200' : 'border-gray-200'}`}
                aria-label="Green text" />
              
            </div>
          </div>
        </div>

        <Button fullWidth onClick={onBack}>
          Save & Close
        </Button>
      </footer>
    </div>);

}