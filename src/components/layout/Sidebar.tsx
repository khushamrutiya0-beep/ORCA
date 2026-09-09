'use client';

import React from 'react';
import { useRole, ROLE_DEFINITIONS, UserRole } from '@/lib/context/RoleContext';
import { 
  Home, 
  Map as MapIcon, 
  Waves, 
  Fish, 
  AlertTriangle, 
  Compass, 
  Anchor, 
  Activity, 
  History, 
  Shield, 
  Database, 
  Bot, 
  LogOut,
  Radio,
  Clock,
  BarChart3,
  X,
  Layers,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onSelectView: (view: string) => void;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeType?: 'live' | 'demo' | 'info';
  category?: 'primary' | 'analytics' | 'governance' | 'system';
}

const ALL_NAV_ITEMS: Record<string, NavItem> = {
  home: { id: 'home', label: 'Operations Overview', icon: Home, category: 'primary' },
  map: { id: 'map', label: 'Tactical Map', icon: MapIcon, category: 'primary' },
  marine: { id: 'marine', label: 'Marine Telemetry', icon: Waves, badge: 'LIVE', badgeType: 'live', category: 'primary' },
  pfz: { id: 'pfz', label: 'PFZ Fishing Zones', icon: Fish, badge: 'DEMO', badgeType: 'demo', category: 'analytics' },
  alerts: { id: 'alerts', label: 'Alerts & Hazards', icon: AlertTriangle, badge: 'GDACS', badgeType: 'live', category: 'analytics' },
  tides: { id: 'tides', label: 'Tide Gauges', icon: Clock, category: 'analytics' },
  route: { id: 'route', label: 'Safe Passage Route', icon: Compass, category: 'primary' },
  ports: { id: 'ports', label: 'Ports & Shelter', icon: Anchor, category: 'primary' },
  
  // Research
  research: { id: 'research', label: 'Scientific Overview', icon: BarChart3, category: 'analytics' },
  productivity: { id: 'productivity', label: 'Chlorophyll & SST', icon: Activity, badge: 'PROXY', badgeType: 'demo', category: 'analytics' },
  historical: { id: 'historical', label: 'Historical Trends', icon: History, category: 'analytics' },
  
  // Governance & Operations
  coastal: { id: 'coastal', label: 'Authority Command', icon: Shield, category: 'governance' },
  disaster: { id: 'disaster', label: 'Disaster Monitoring', icon: Radio, category: 'governance' },
  fleet: { id: 'fleet', label: 'Fleet Navigation', icon: Compass, category: 'governance' },
  command: { id: 'command', label: 'Operations Overview', icon: Layers, category: 'governance' },
  geofences: { id: 'geofences', label: 'Marine Protected Areas', icon: Shield, category: 'governance' },
  
  // Intelligence & System
  chat: { id: 'chat', label: 'ORCA Intelligence', icon: Bot, badge: 'AI', badgeType: 'info', category: 'system' },
  sources: { id: 'sources', label: 'Data Provenance', icon: Database, category: 'system' },
};

// Role-to-items mapping
const ROLE_NAV_MAPPING: Record<UserRole, string[]> = {
  FISHERMAN: [
    'home',
    'map',
    'marine',
    'pfz',
    'alerts',
    'tides',
    'route',
    'ports',
    'chat',
    'sources',
  ],
  RESEARCHER: [
    'research',
    'map',
    'marine',
    'pfz',
    'productivity',
    'historical',
    'chat',
    'sources',
  ],
  COASTAL_AUTHORITY: [
    'coastal',
    'command',
    'map',
    'ports',
    'geofences',
    'alerts',
    'marine',
    'chat',
    'sources',
  ],
  DISASTER_MANAGEMENT: [
    'disaster',
    'command',
    'alerts',
    'map',
    'geofences',
    'marine',
    'chat',
    'sources',
  ],
  MARITIME_OPERATOR: [
    'fleet',
    'command',
    'map',
    'marine',
    'route',
    'ports',
    'geofences',
    'alerts',
    'chat',
    'sources',
  ],
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isOpenOnMobile = false,
  onCloseMobile,
}) => {
  const { role, user, logout } = useRole();
  const currentRoleInfo = ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.FISHERMAN;

  const allowedItemKeys = ROLE_NAV_MAPPING[role] || ROLE_NAV_MAPPING.FISHERMAN;
  const navItems = allowedItemKeys
    .map((key) => ALL_NAV_ITEMS[key])
    .filter(Boolean);

  const handleNavClick = (viewId: string) => {
    onSelectView(viewId);
    if (onCloseMobile) {
      onCloseMobile();
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Mobile Backdrop / Overlay */}
      {isOpenOnMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar / Mobile Drawer Container */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 w-72 sm:w-80 lg:w-64 lg:shrink-0 bg-white border-r border-slate-200/90 z-50 lg:z-10 flex flex-col justify-between py-4 px-3 overflow-y-auto transition-transform duration-200 ease-in-out shadow-2xl lg:shadow-none ${
          isOpenOnMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-4">
          
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-sky-400 font-bold text-xs border border-slate-800">
                🌊
              </div>
              <div>
                <span className="text-sm font-extrabold text-slate-900">ORCA Platform</span>
                <p className="text-[10px] text-slate-500 font-medium">Marine Intelligence & Operations</p>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              type="button"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Persona Banner Card */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1.5 rounded-xl bg-white shadow-2xs border border-slate-200/80 shrink-0">
                {currentRoleInfo.icon}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentRoleInfo.title}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">
                  {currentRoleInfo.tagline}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links List */}
          <nav className="space-y-1">
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Workspace Modules</span>
              <span className="text-[9px] font-mono font-semibold text-slate-400">{navItems.length} APPS</span>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-blue-600'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeType === 'live'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.badgeType === 'demo'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer: User Details & Logout */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="px-2 py-1 flex items-center justify-between text-[11px] text-slate-500">
            <span className="truncate max-w-[150px] font-semibold text-slate-700">
              {user?.name || currentRoleInfo.title}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">AUTHORIZED</span>
          </div>

          <button
            onClick={logout}
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out / Switch Role</span>
          </button>
        </div>
      </aside>
    </>
  );
};
