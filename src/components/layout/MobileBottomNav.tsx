'use client';

import React from 'react';
import { Home, Map as MapIcon, AlertTriangle, Compass, Bot } from 'lucide-react';

interface MobileBottomNavProps {
  activeView: string;
  onSelectView: (view: string) => void;
  activeAlertCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onSelectView,
  activeAlertCount = 0,
}) => {
  const items = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, count: activeAlertCount },
    { id: 'route', label: 'Route', icon: Compass },
    { id: 'chat', label: 'Intelligence', icon: Bot },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-2 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectView(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors ${
              isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
              {item.count && item.count > 0 ? (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[8px] font-bold flex items-center justify-center">
                  {item.count}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-blue-600 absolute bottom-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
