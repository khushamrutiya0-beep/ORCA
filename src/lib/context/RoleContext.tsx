'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole =
  | 'FISHERMAN'
  | 'RESEARCHER'
  | 'COASTAL_AUTHORITY'
  | 'DISASTER_MANAGEMENT'
  | 'MARITIME_OPERATOR';

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  organization?: string;
  vesselOrStation?: string;
}

export interface RoleInfo {
  id: UserRole;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  badgeColor: string;
  defaultView: string;
  allowedNavItems: string[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleInfo> = {
  FISHERMAN: {
    id: 'FISHERMAN',
    title: 'Fisherman',
    tagline: 'Sea Safety & Fishing Operations',
    description: 'Real-time sea conditions, wave forecasts, PFZ advisory and nearest shelter port guidance.',
    icon: '🎣',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    defaultView: 'home',
    allowedNavItems: [
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
  },
  RESEARCHER: {
    id: 'RESEARCHER',
    title: 'Researcher',
    tagline: 'Ocean Data, Analytics & Trends',
    description: 'Oceanographic parameter explorer, chlorophyll satellite proxy, productivity index and SST climatology.',
    icon: '🔬',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    defaultView: 'research',
    allowedNavItems: [
      'research',
      'map',
      'marine',
      'pfz',
      'productivity',
      'historical',
      'sources',
      'chat',
    ],
  },
  COASTAL_AUTHORITY: {
    id: 'COASTAL_AUTHORITY',
    title: 'Coastal Authority',
    tagline: 'Coastal Monitoring & Advisories',
    description: 'Indian coastal port administration, Marine Protected Area compliance, IMBL boundaries and vessel advisories.',
    icon: '🛡️',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    defaultView: 'coastal',
    allowedNavItems: [
      'coastal',
      'map',
      'ports',
      'geofences',
      'alerts',
      'marine',
      'command',
      'sources',
      'chat',
    ],
  },
  DISASTER_MANAGEMENT: {
    id: 'DISASTER_MANAGEMENT',
    title: 'Disaster Management',
    tagline: 'Disaster Alerts & Response',
    description: 'GDACS tropical cyclone tracking, storm surge warnings, multi-hazard alerts and shelter coordination.',
    icon: '🚨',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    defaultView: 'disaster',
    allowedNavItems: [
      'disaster',
      'alerts',
      'map',
      'command',
      'geofences',
      'sources',
      'chat',
    ],
  },
  MARITIME_OPERATOR: {
    id: 'MARITIME_OPERATOR',
    title: 'Maritime Operator',
    tagline: 'Fleet, Route Planning & Safety',
    description: 'A* deterministic passage corridor planning, geofence avoidance, transit ETA and voyage risk evaluation.',
    icon: '🧭',
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
    defaultView: 'fleet',
    allowedNavItems: [
      'fleet',
      'route',
      'map',
      'marine',
      'geofences',
      'ports',
      'alerts',
      'sources',
      'chat',
    ],
  },
};

interface RoleContextType {
  role: UserRole;
  user: UserProfile | null;
  isAuthenticated: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
  login: (user: UserProfile) => void;
  logout: () => void;
  quickLoginAs: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const DEFAULT_USER: UserProfile = {
  name: 'Captain Rajesh Varma',
  email: 'rajesh.varma@fisheries.in',
  role: 'FISHERMAN',
  organization: 'Kerala Coastal Fisheries Cooperative',
  vesselOrStation: 'Matsya Sagar IND-KL-07-2891',
};

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('FISHERMAN');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<string>('home');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('orca_auth');
      const savedUser = localStorage.getItem('orca_user');
      const savedRole = localStorage.getItem('orca_role') as UserRole;
      const savedView = localStorage.getItem('orca_view');

      if (savedAuth === 'true' && savedUser) {
        setIsAuthenticated(true);
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.role && ROLE_DEFINITIONS[parsed.role as UserRole]) {
          setRoleState(parsed.role);
        }
        if (savedView) {
          setActiveView(savedView);
        } else if (parsed.role && ROLE_DEFINITIONS[parsed.role as UserRole]) {
          setActiveView(ROLE_DEFINITIONS[parsed.role as UserRole].defaultView);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const setView = (view: string) => {
    setActiveView(view);
    localStorage.setItem('orca_view', view);
  };

  const login = (newUser: UserProfile) => {
    setUser(newUser);
    setRoleState(newUser.role);
    setIsAuthenticated(true);
    localStorage.setItem('orca_auth', 'true');
    localStorage.setItem('orca_user', JSON.stringify(newUser));
    localStorage.setItem('orca_role', newUser.role);
    const defView = ROLE_DEFINITIONS[newUser.role].defaultView;
    setActiveView(defView);
    localStorage.setItem('orca_view', defView);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('orca_auth');
    localStorage.removeItem('orca_user');
    localStorage.removeItem('orca_role');
    localStorage.removeItem('orca_view');
  };

  const quickLoginAs = (targetRole: UserRole) => {
    const roleProfiles: Record<UserRole, UserProfile> = {
      FISHERMAN: {
        name: 'Captain Rajesh Varma',
        email: 'rajesh.varma@fisheries.in',
        role: 'FISHERMAN',
        organization: 'Kochi Deep-Sea Artisanal Cooperative',
        vesselOrStation: 'Matsya Sagar IND-KL-07-2891',
      },
      RESEARCHER: {
        name: 'Dr. Ananya Nair',
        email: 'ananya.nair@ocean-institute.res.in',
        role: 'RESEARCHER',
        organization: 'National Institute of Oceanography (NIO)',
        vesselOrStation: 'Sagar Kanya Research Station',
      },
      COASTAL_AUTHORITY: {
        name: 'Commander Arun Mehta',
        email: 'arun.mehta@coastal-board.gov.in',
        role: 'COASTAL_AUTHORITY',
        organization: 'Maharashtra Maritime Board / Coastal Zone Authority',
        vesselOrStation: 'Mumbai Port Operations Center',
      },
      DISASTER_MANAGEMENT: {
        name: 'Officer Priya Sharma',
        email: 'priya.sharma@sdma.gov.in',
        role: 'DISASTER_MANAGEMENT',
        organization: 'State Disaster Management Authority (SDMA)',
        vesselOrStation: 'Emergency Operations Center (EOC)',
      },
      MARITIME_OPERATOR: {
        name: 'Capt. Vikramaditya Rathore',
        email: 'v.rathore@indian-shipping.com',
        role: 'MARITIME_OPERATOR',
        organization: 'Oceanic Coastal Logistics & Fleet Ops',
        vesselOrStation: 'Tug & Cargo Operations Base',
      },
    };

    const targetProfile = roleProfiles[targetRole] || roleProfiles.FISHERMAN;
    login(targetProfile);
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        user,
        isAuthenticated,
        activeView,
        setActiveView: setView,
        login,
        logout,
        quickLoginAs,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
