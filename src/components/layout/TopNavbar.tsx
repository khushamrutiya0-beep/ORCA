'use client';

import React, { useState, useEffect } from 'react';
import { Coordinates, DataStatus } from '@/lib/types';
import { useRole, UserRole, ROLE_DEFINITIONS } from '@/lib/context/RoleContext';
import { 
  Waves, 
  MapPin, 
  Bell, 
  LogOut, 
  ChevronDown, 
  Menu, 
  X, 
  RefreshCw, 
  Radio,
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface TopNavbarProps {
  currentCoordinates: Coordinates;
  locationName: string;
  onOpenLocationModal: () => void;
  onOpenAlertsModal?: () => void;
  onOpenChatDrawer?: () => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  oceanStatus?: DataStatus;
  weatherStatus?: DataStatus;
  activeAlertCount?: number;
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentCoordinates,
  locationName,
  onOpenLocationModal,
  onOpenAlertsModal,
  onOpenChatDrawer,
  isRefreshing = false,
  onRefresh,
  activeAlertCount = 0,
  onToggleMobileSidebar,
  isMobileSidebarOpen = false,
}) => {
  const { role, user, logout } = useRole();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [istTime, setIstTime] = useState<string>('');

  const currentRoleInfo = ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.FISHERMAN;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs backdrop-blur-md bg-white/95">
      
      {/* Left: Mobile Toggle & Brand Logo */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileSidebar}
          type="button"
          className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          aria-label={isMobileSidebarOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-900" />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm border border-slate-800">
            <Waves className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight font-sans">
                ORCA
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200/80 font-mono tracking-wider">
                OPS LIVE
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block -mt-0.5 font-medium tracking-tight">
              Marine Intelligence & Decision Support
            </p>
          </div>
        </div>
      </div>

      {/* Center: Sector HUD Indicator with Live Coordinates */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onOpenLocationModal}
          type="button"
          className="flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-slate-50/90 hover:bg-slate-100 border border-slate-200/90 text-xs text-slate-700 font-medium transition-all group shadow-2xs hover:border-blue-300"
          title="Click to select Indian coastal sector or enter GPS coordinates"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <MapPin className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
          <span className="font-bold text-slate-900 truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs">
            {locationName}
          </span>
          <span className="text-slate-500 font-mono-data text-[10px] hidden md:inline font-semibold">
            {currentCoordinates.latitude.toFixed(2)}°N, {currentCoordinates.longitude.toFixed(2)}°E
          </span>
        </button>

        {onRefresh && (
          <button
            onClick={onRefresh}
            type="button"
            disabled={isRefreshing}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 border border-slate-200/80 transition-all disabled:opacity-50"
            title="Refresh ocean and weather telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        )}
      </div>

      {/* Right Controls: Role Info, Alerts, IST Clock, User Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        
        {/* Role Badge HUD */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-semibold text-slate-800">
          <span className="text-sm">{currentRoleInfo.icon}</span>
          <span className="font-bold text-slate-900">{currentRoleInfo.title}</span>
        </div>

        {/* Live Alerts Trigger */}
        {onOpenAlertsModal && (
          <button
            onClick={onOpenAlertsModal}
            type="button"
            className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-700 transition-colors"
            title={`${activeAlertCount} active maritime hazard alerts`}
          >
            <Bell className="w-4 h-4" />
            {activeAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                {activeAlertCount}
              </span>
            )}
          </button>
        )}

        {/* IST Live Time Clock */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono-data font-semibold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{istTime || 'IST Live'}</span>
          <span className="text-[9px] text-slate-400 font-normal">IST</span>
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            type="button"
            className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-sky-400 font-bold text-xs flex items-center justify-center shadow-xs shrink-0 border border-slate-800">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 bg-slate-50 rounded-xl mb-2">
                <div className="text-xs font-bold text-slate-900">{user?.name || 'Authorized User'}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email || 'user@orca.in'}</div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-1 rounded-lg border border-sky-100">
                  <span>{currentRoleInfo.icon}</span>
                  <span>{currentRoleInfo.title}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  logout();
                }}
                type="button"
                className="w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out / Switch Role</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
