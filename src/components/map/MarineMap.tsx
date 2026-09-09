'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, Polyline, ZoomControl, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Coordinates, PFZZone, RiskLevel, NearestPortInfo } from '@/lib/types';
import { OrcaAlert } from '@/lib/types/alert';
import { INDIAN_COASTAL_PORTS } from '@/lib/geospatial/indianPorts';
import { INDIAN_MARITIME_GEOFENCES } from '@/lib/geofencing/geofenceService';
import { Layers, MapPin, Eye, EyeOff, ShieldAlert, Anchor } from 'lucide-react';

interface MarineMapProps {
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

// CARTO Voyager Marine Basemap Configuration
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY || 'cb1_2ckc_1_704793e311683de92976b6e7';
const CARTO_TILE_URL = process.env.NEXT_PUBLIC_CARTO_TILE_URL || `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_KEY}`;
const CARTO_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>';

// Custom Leaflet Icons using HTML DivIcons for Modern Light UI
const createVesselIcon = (riskLevel: RiskLevel = 'LOW') => {
  const getGlowColor = (level: RiskLevel) => {
    switch (level) {
      case 'LOW': return '#10b981';
      case 'MODERATE': return '#f59e0b';
      case 'HIGH': return '#f97316';
      case 'SEVERE': return '#ef4444';
      default: return '#1468e8';
    }
  };

  const color = getGlowColor(riskLevel);

  return L.divIcon({
    className: 'custom-vessel-pin',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: radial-gradient(circle, #ffffff 0%, #eff6ff 100%);
        border: 3px solid ${color};
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 10px ${color}88;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      ">
        ⚓
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

const createAlertIcon = (severity: string) => {
  const color = severity === 'SEVERE' ? '#ef4444'
    : severity === 'HIGH' ? '#f97316'
    : severity === 'MODERATE' ? '#f59e0b'
    : '#64748b';
  const emoji = severity === 'SEVERE' ? '🔴'
    : severity === 'HIGH' ? '🟠'
    : severity === 'MODERATE' ? '🟡' : 'ℹ️';

  return L.divIcon({
    className: 'custom-alert-pin',
    html: `
      <div style="
        width: 34px;
        height: 34px;
        background: #ffffff;
        border: 2.5px solid ${color};
        border-radius: 50%;
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        animation: pulse 2s infinite;
      ">${emoji}</div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

const createPortIcon = (isNearest = false) =>
  L.divIcon({
    className: 'custom-port-pin',
    html: `
      <div style="
        width: ${isNearest ? '28px' : '22px'};
        height: ${isNearest ? '28px' : '22px'};
        background: ${isNearest ? '#1468e8' : '#ffffff'};
        border: 2px solid ${isNearest ? '#ffffff' : '#64748b'};
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${isNearest ? '#ffffff' : '#1e293b'};
        font-size: ${isNearest ? '14px' : '11px'};
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      ">
        🏛️
      </div>
    `,
    iconSize: [isNearest ? 28 : 22, isNearest ? 28 : 22],
    iconAnchor: [isNearest ? 14 : 11, isNearest ? 14 : 11],
  });

const MapClickHandler: React.FC<{ onLocationPicked: (coords: Coordinates) => void }> = ({
  onLocationPicked,
}) => {
  useMapEvents({
    click(e) {
      onLocationPicked({
        latitude: Math.round(e.latlng.lat * 10000) / 10000,
        longitude: Math.round(e.latlng.lng * 10000) / 10000,
      });
    },
  });
  return null;
};

const MapRecenter: React.FC<{ coords: Coordinates }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([coords.latitude, coords.longitude], map.getZoom(), {
      duration: 1.2,
    });
  }, [coords.latitude, coords.longitude, map]);
  return null;
};

const MapResizeHandler: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    // Invalidate immediately and in staggered intervals to catch Next.js dynamic hydration and layout reflows
    map.invalidateSize();
    const timers = [
      setTimeout(() => map.invalidateSize(), 50),
      setTimeout(() => map.invalidateSize(), 150),
      setTimeout(() => map.invalidateSize(), 300),
      setTimeout(() => map.invalidateSize(), 600),
      setTimeout(() => map.invalidateSize(), 1200),
    ];

    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', handleResize);

    const container = map.getContainer();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      observer = new ResizeObserver(() => {
        map.invalidateSize();
      });
      observer.observe(container);
    }

    return () => {
      timers.forEach(t => clearTimeout(t));
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [map]);

  return null;
};

export const MarineMap: React.FC<MarineMapProps> = ({
  currentCoordinates,
  onSelectCoordinates,
  pfzZones = [],
  showPfzLayer = true,
  showPortsLayer = true,
  showAlertsLayer = true,
  showGeofencesLayer = true,
  showRadiusLayer = true,
  alerts = [],
  riskLevel = 'LOW',
  nearestPort,
  routeWaypoints,
}) => {
  const [layers, setLayers] = useState({
    pfz: showPfzLayer,
    ports: showPortsLayer,
    alerts: showAlertsLayer,
    geofences: showGeofencesLayer,
    radius: showRadiusLayer,
  });

  const getRiskRingColor = (level: RiskLevel) => {
    switch (level) {
      case 'LOW': return '#10b981';
      case 'MODERATE': return '#f59e0b';
      case 'HIGH': return '#f97316';
      case 'SEVERE': return '#ef4444';
      default: return '#1468e8';
    }
  };

  const ringColor = getRiskRingColor(riskLevel);

  return (
    <div className="relative isolate z-0 w-full h-full min-h-[460px] rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100 flex flex-col">
      
      {/* Floating Tactical Layer Toolbar */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-1.5 shadow-md flex items-center gap-1 text-xs max-w-[calc(100%-24px)] overflow-x-auto">
        <div className="px-2 py-1 flex items-center gap-1.5 font-bold text-slate-700 border-r border-slate-200 shrink-0">
          <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="hidden sm:inline">Layers</span>
        </div>

        <button
          onClick={() => setLayers(l => ({ ...l, radius: !l.radius }))}
          className={`px-2 py-1 rounded-lg font-semibold transition-all ${
            layers.radius ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500 hover:bg-slate-100'
          }`}
          title="15 NM Reference Radius"
        >
          15 NM
        </button>

        <button
          onClick={() => setLayers(l => ({ ...l, pfz: !l.pfz }))}
          className={`px-2 py-1 rounded-lg font-semibold transition-all ${
            layers.pfz ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-500 hover:bg-slate-100'
          }`}
          title="Potential Fishing Zones (DEMO)"
        >
          PFZ
        </button>

        <button
          onClick={() => setLayers(l => ({ ...l, ports: !l.ports }))}
          className={`px-2 py-1 rounded-lg font-semibold transition-all ${
            layers.ports ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-500 hover:bg-slate-100'
          }`}
          title="Indian Coastal Ports"
        >
          Ports
        </button>

        <button
          onClick={() => setLayers(l => ({ ...l, alerts: !l.alerts }))}
          className={`px-2 py-1 rounded-lg font-semibold transition-all ${
            layers.alerts ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-500 hover:bg-slate-100'
          }`}
          title="GDACS Live Alerts"
        >
          Alerts {alerts.length > 0 && `(${alerts.length})`}
        </button>

        <button
          onClick={() => setLayers(l => ({ ...l, geofences: !l.geofences }))}
          className={`px-2 py-1 rounded-lg font-semibold transition-all ${
            layers.geofences ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:bg-slate-100'
          }`}
          title="Marine Protected Areas & Sanctuaries"
        >
          Protected
        </button>
      </div>

      <MapContainer
        center={[currentCoordinates.latitude, currentCoordinates.longitude]}
        zoom={8}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[460px] flex-1"
        style={{ width: '100%', height: '100%', minHeight: '100%' }}
      >
        <ZoomControl position="bottomright" />

        {/* Modern Clean Light Marine Basemap (CARTO Voyager) */}
        <TileLayer
          attribution={CARTO_ATTRIBUTION}
          url={CARTO_TILE_URL}
          maxZoom={18}
        />

        <MapRecenter coords={currentCoordinates} />
        <MapResizeHandler />
        <MapClickHandler onLocationPicked={(coords) => onSelectCoordinates(coords, 'Selected Maritime Location')} />

        {/* Track Line to Nearest Shelter Port */}
        {nearestPort && (
          <Polyline
            positions={[
              [currentCoordinates.latitude, currentCoordinates.longitude],
              nearestPort.coordinates,
            ]}
            pathOptions={{
              color: '#1468e8',
              weight: 2.5,
              dashArray: '5, 8',
              opacity: 0.85,
            }}
          >
            <Popup>
              <div className="p-1 text-xs">
                <div className="font-bold text-blue-600 mb-0.5">⚓ Nearest Safe Port Track</div>
                <div className="text-slate-700">
                  {nearestPort.portName} — {nearestPort.distanceKm} km ({nearestPort.distanceNM} NM)
                </div>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Safe Route Waypoint Corridor */}
        {routeWaypoints && routeWaypoints.length >= 2 && (
          <Polyline
            positions={routeWaypoints.map(wp => [wp.latitude, wp.longitude])}
            pathOptions={{
              color: '#3b82f6',
              weight: 4,
              opacity: 0.9,
            }}
          >
            <Popup>
              <div className="p-1 text-xs">
                <div className="font-bold text-blue-600 mb-0.5">🧭 Calculated Safest Passage Corridor</div>
                <div className="text-slate-600">Avoids high wave hazard zones and marine sanctuaries</div>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Target Position Marker */}
        <Marker
          position={[currentCoordinates.latitude, currentCoordinates.longitude]}
          icon={createVesselIcon(riskLevel)}
        >
          <Popup>
            <div className="p-1 text-xs">
              <div className="font-bold text-blue-600 mb-1">
                📍 Target Position
              </div>
              <p className="text-slate-700 font-mono text-[11px]">
                {currentCoordinates.latitude.toFixed(4)}°N, {currentCoordinates.longitude.toFixed(4)}°E
              </p>
              <div className="mt-1 text-slate-600">
                Assessed Risk: <strong style={{ color: ringColor }}>{riskLevel}</strong>
              </div>
              {nearestPort && (
                <div className="mt-1 text-[11px] text-slate-500">
                  Shelter Port: {nearestPort.portName} ({nearestPort.distanceNM} NM)
                </div>
              )}
            </div>
          </Popup>
        </Marker>

        {/* 15 NM Reference Radius Ring */}
        {layers.radius && (
          <Circle
            center={[currentCoordinates.latitude, currentCoordinates.longitude]}
            radius={27780}
            pathOptions={{
              color: ringColor,
              fillColor: ringColor,
              fillOpacity: 0.06,
              weight: 1.5,
              dashArray: '4, 6',
            }}
          >
            <Popup>
              <div className="p-1 text-xs font-sans">
                <strong className="text-slate-900 block">15 NM Marine Reference Zone</strong>
                <span className="text-[11px] text-slate-500">
                  Radius ~27.8 km evaluated by ORCA Risk Engine
                </span>
              </div>
            </Popup>
          </Circle>
        )}

        {/* GDACS Live Alerts Layer */}
        {layers.alerts && alerts.map((alert) => {
          if (!alert.coordinates) return null;
          return (
            <Marker
              key={alert.id}
              position={[alert.coordinates.latitude, alert.coordinates.longitude]}
              icon={createAlertIcon(alert.severity)}
            >
              <Popup>
                <div className="p-1 text-xs max-w-xs">
                  <div className="flex items-center gap-1 font-bold text-rose-700 mb-1">
                    <span>⚠️ {alert.type} ALERT</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-rose-100">
                      {alert.severity}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 mb-1">{alert.title}</div>
                  <div className="text-[11px] text-slate-600 mb-1">{alert.description}</div>
                  <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-1">
                    Source: <strong>{alert.source}</strong> ({alert.sourceType})
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Indian Coastal Ports Layer */}
        {layers.ports && INDIAN_COASTAL_PORTS.map((port) => {
          const isNearest = nearestPort?.portName === port.name;
          return (
            <Marker
              key={port.name}
              position={port.coordinates}
              icon={createPortIcon(isNearest)}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <div className="font-bold text-slate-900">{port.name}</div>
                  <div className="text-[11px] text-slate-500">{port.state} — {port.type} Port</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Marine Protected Areas & Geofences */}
        {layers.geofences && INDIAN_MARITIME_GEOFENCES.map((geo) => (
          <Polygon
            key={geo.id}
            positions={geo.coordinates}
            pathOptions={{
              color: geo.restrictionLevel === 'PROHIBITED' ? '#ef4444' : '#f59e0b',
              fillColor: geo.restrictionLevel === 'PROHIBITED' ? '#ef4444' : '#f59e0b',
              fillOpacity: 0.12,
              weight: 2,
              dashArray: geo.category === 'INTERNATIONAL_BOUNDARY' ? '4, 4' : undefined,
            }}
          >
            <Popup>
              <div className="p-1 text-xs max-w-xs">
                <div className="font-bold text-slate-900 mb-0.5">{geo.name}</div>
                <div className="text-[10px] font-semibold uppercase text-rose-700 mb-1">
                  [{geo.restrictionLevel}] {geo.authority}
                </div>
                <p className="text-[11px] text-slate-600 mb-1">{geo.description}</p>
                <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-1">
                  Source: {geo.source}
                </div>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* PFZ Zones Layer (DEMO) */}
        {layers.pfz && pfzZones.map((zone) => {
          if (!zone.polygon) return null;
          return (
            <Polygon
              key={zone.id}
              positions={zone.polygon}
              pathOptions={{
                color: '#6366f1',
                fillColor: '#6366f1',
                fillOpacity: 0.15,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <div className="font-bold text-indigo-700">🐟 PFZ Zone (DEMO)</div>
                  <div className="text-slate-800 font-semibold">{zone.name}</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Reference sample layer. Real PFZ available via INCOIS SAMUDRA app.
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}

      </MapContainer>
    </div>
  );
};
