import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';
export function StatusBar() {
  return (
    <div
      className="h-12 bg-gray-900 text-white flex items-center justify-between px-6 select-none"
      aria-hidden="true">
      
      <span className="text-sm font-medium">9:41</span>
      <div className="flex items-center space-x-2">
        <Signal size={16} />
        <Wifi size={16} />
        <Battery size={16} />
      </div>
    </div>);

}