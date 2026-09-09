'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Coordinates, PFZZone, RiskLevel, NearestPortInfo } from '@/lib/types';
import { OrcaAlert } from '@/lib/types/alert';
import { Loader2 } from 'lucide-react';

const DynamicMarineMap = dynamic(
  () => import('./MarineMap').then((mod) => mod.MarineMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[420px] rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-blue-600 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs font-semibold tracking-wider text-slate-600">
          INITIALIZING TACTICAL MARINE CHART...
        </span>
      </div>
    ),
  }
);

interface MapContainerWrapperProps {
  currentCoordinates: Coordinates;
  onSelectCoordinates: (coords: Coordinates, locationName?: string) => void;
  pfzZones?: PFZZone[];
  showPfzLayer?: boolean;
  showPortsLayer?: boolean;
  showAlertsLayer?: boolean;
  showGeofencesLayer?: boolean;
  showRadiusLayer?: boolean;
  alerts?: OrcaAlert[];
  riskLevel?: RiskLevel;
  nearestPort?: NearestPortInfo;
  routeWaypoints?: Array<{ latitude: number; longitude: number }>;
}

export const MapContainerWrapper: React.FC<MapContainerWrapperProps> = (props) => {
  return <DynamicMarineMap {...props} />;
};
