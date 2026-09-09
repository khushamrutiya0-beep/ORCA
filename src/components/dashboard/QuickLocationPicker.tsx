'use client';

import React, { useState } from 'react';
import { Coordinates } from '@/lib/types';
import { Compass, Navigation, Check, X, MapPin } from 'lucide-react';
import { INDIAN_COASTAL_PORTS } from '@/lib/geospatial/indianPorts';

interface QuickLocationPickerProps {
  currentCoordinates: Coordinates;
  onSelectCoordinates: (coords: Coordinates, locationName?: string) => void;
  onClose?: () => void;
}

const PRESET_COASTAL_REGIONS = [
  { name: 'Mumbai Offshore (Arabian Sea)', lat: 18.9220, lon: 72.8347, state: 'Maharashtra', tag: 'West Coast' },
  { name: 'Kochi Coastal Waters', lat: 9.9312, lon: 76.2673, state: 'Kerala', tag: 'South-West' },
  { name: 'Chennai Bay of Bengal', lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu', tag: 'Coromandel' },
  { name: 'Visakhapatnam Deep Waters', lat: 17.6868, lon: 83.2185, state: 'Andhra Pradesh', tag: 'East Coast' },
  { name: 'Kanyakumari Confluence', lat: 8.0883, lon: 77.5385, state: 'Tamil Nadu', tag: 'Cape Comorin' },
  { name: 'Porbandar Offshore (Saurashtra)', lat: 21.6417, lon: 69.6293, state: 'Gujarat', tag: 'Saurashtra' },
  { name: 'Port Blair (Andaman Sea)', lat: 11.6234, lon: 92.7265, state: 'Andaman & Nicobar', tag: 'Island Zone' },
];

export const QuickLocationPicker: React.FC<QuickLocationPickerProps> = ({
  currentCoordinates,
  onSelectCoordinates,
  onClose,
}) => {
  const [customLat, setCustomLat] = useState(currentCoordinates.latitude.toString());
  const [customLon, setCustomLon] = useState(currentCoordinates.longitude.toString());
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setErrorMessage('Latitude must be between -90 and 90');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setErrorMessage('Longitude must be between -180 and 180');
      return;
    }

    onSelectCoordinates({ latitude: lat, longitude: lon }, 'Custom Coordinates');
    if (onClose) onClose();
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setCustomLat(lat.toFixed(4));
        setCustomLon(lon.toFixed(4));
        onSelectCoordinates({ latitude: lat, longitude: lon }, 'My GPS Location');
        if (onClose) onClose();
      },
      (error) => {
        setIsLocating(false);
        setErrorMessage(`GPS error: ${error.message}.`);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="bg-white border-t sm:border border-slate-200/90 rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 max-w-lg w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto pb-6 sm:pb-5">
      {/* Mobile Bottom Sheet Pull Bar */}
      <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-1 mb-2" />
      
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">
              Indian Coastal Location Selector
            </h3>
            <span className="text-[11px] text-slate-500">
              Select a sector or enter coordinates
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUseGps}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-semibold text-blue-700 transition-colors disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'GPS'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preset Coastal Sectors */}
      <div>
        <span className="text-xs font-bold text-slate-700 block mb-2">
          Key Indian Marine Hubs
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESET_COASTAL_REGIONS.map((region) => {
            const isSelected =
              Math.abs(currentCoordinates.latitude - region.lat) < 0.01 &&
              Math.abs(currentCoordinates.longitude - region.lon) < 0.01;

            return (
              <button
                key={region.name}
                onClick={() => {
                  onSelectCoordinates({ latitude: region.lat, longitude: region.lon }, region.name);
                  if (onClose) onClose();
                }}
                className={`text-left p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-2 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/70 shadow-2xs font-semibold text-blue-900'
                    : 'border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-bold truncate">{region.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {region.state} • {region.lat.toFixed(2)}°N, {region.lon.toFixed(2)}°E
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Major Indian Ports Shortcut */}
      <div>
        <span className="text-xs font-bold text-slate-700 block mb-2">
          Major Indian Ports
        </span>
        <div className="flex flex-wrap gap-1.5">
          {INDIAN_COASTAL_PORTS.slice(0, 8).map((port) => (
            <button
              key={port.name}
              onClick={() => {
                onSelectCoordinates(
                  { latitude: port.coordinates[0], longitude: port.coordinates[1] },
                  port.name
                );
                if (onClose) onClose();
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-700 font-medium transition-colors"
            >
              {port.name}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Coordinate Input Form */}
      <form onSubmit={handleApplyCustom} className="pt-3 border-t border-slate-100 space-y-3">
        <span className="text-xs font-bold text-slate-700 block">
          Custom Coordinate Input
        </span>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Latitude (°N / °S)
            </label>
            <input
              type="text"
              value={customLat}
              onChange={(e) => setCustomLat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              placeholder="e.g. 18.9220"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Longitude (°E / °W)
            </label>
            <input
              type="text"
              value={customLon}
              onChange={(e) => setCustomLon(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              placeholder="e.g. 72.8347"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="text-xs text-rose-600 font-medium">{errorMessage}</div>
        )}

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          Apply Coordinates & Fetch Telemetry
        </button>
      </form>
    </div>
  );
};
