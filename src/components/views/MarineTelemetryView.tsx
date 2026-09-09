'use client';

import React from 'react';
import { Coordinates, OceanObservation, WeatherObservation } from '@/lib/types';
import { StatusBadge } from '../ui/StatusBadge';
import { 
  Waves, 
  Wind, 
  Thermometer, 
  Navigation, 
  Gauge, 
  Clock, 
  Compass, 
  Activity, 
  Radio, 
  CloudSun,
  CloudRain,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';

interface MarineTelemetryViewProps {
  coordinates: Coordinates;
  locationName: string;
  oceanData: OceanObservation | null;
  weatherData: WeatherObservation | null;
  onSelectCoordinates?: (coords: Coordinates, name?: string) => void;
  onSelectView?: (view: string) => void;
}

interface DetailedMetricCardProps {
  label: string;
  subLabel: string;
  value: string | number | null | undefined;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  status?: string;
  statusColor?: string;
  secondaryValue?: string;
}

const DetailedMetricCard: React.FC<DetailedMetricCardProps> = ({
  label,
  subLabel,
  value,
  unit,
  icon: Icon,
  description,
  status = 'NORMAL',
  statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200',
  secondaryValue,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-cardHover hover:border-slate-300 transition-all flex flex-col justify-between space-y-3 marine-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-800 shadow-2xs">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">{label}</span>
            <span className="text-[10px] text-slate-400 font-medium">{subLabel}</span>
          </div>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border font-mono-data ${statusColor}`}>
          {status}
        </span>
      </div>

      <div className="pt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono-data tracking-tight text-slate-900">
            {value !== null && value !== undefined ? value : 'N/A'}
          </span>
          <span className="text-xs font-semibold text-slate-500">{unit}</span>
        </div>
        {secondaryValue && (
          <div className="text-[11px] text-slate-600 font-medium mt-0.5 flex items-center gap-1 font-mono-data">
            <ArrowUpRight className="w-3 h-3 text-sky-600" />
            <span>{secondaryValue}</span>
          </div>
        )}
      </div>

      {description && (
        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed font-normal">
          {description}
        </div>
      )}
    </div>
  );
};

export const MarineTelemetryView: React.FC<MarineTelemetryViewProps> = ({
  coordinates,
  locationName,
  oceanData,
  weatherData,
  onSelectView,
}) => {
  const waveHeight = oceanData?.waveHeight;
  const wavePeriod = oceanData?.wavePeriod;
  const waveDirection = oceanData?.waveDirection;
  const windWaveHeight = oceanData?.windWaveHeight;
  const swellHeight = oceanData?.swellWaveHeight;
  const swellPeriod = oceanData?.swellWavePeriod;
  const oceanCurrent = oceanData?.oceanCurrentVelocity;
  const currentDirection = oceanData?.oceanCurrentDirection;
  const seaTemp = oceanData?.seaSurfaceTemperature;

  const windSpeed = weatherData?.windSpeed;
  const windGusts = weatherData?.windGusts;
  const windDirection = weatherData?.windDirection;
  const pressure = weatherData?.surfacePressure;
  const precipitation = weatherData?.precipitation;
  const weatherCode = weatherData?.weatherCode;
  const weatherDesc = weatherData?.weatherDescription || 'Fair Marine Conditions';

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 shadow-sm">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                High-Resolution Marine Environmental Telemetry
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono-data">
                LIVE METRICS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive physical oceanography and atmospheric boundary layer metrics for <strong className="text-slate-800">{locationName}</strong> ({coordinates.latitude.toFixed(4)}°N, {coordinates.longitude.toFixed(4)}°E).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status="LIVE" source="Open-Meteo Marine & Weather API" showDetails />
        </div>
      </div>

      {/* Section 1: Oceanographic & Wave Spectrum Telemetry */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Ocean Dynamics & Wave Spectral Telemetry
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <DetailedMetricCard
            label="Significant Wave Height (Hs)"
            subLabel="Combined Sea State"
            value={waveHeight?.value}
            unit="m"
            icon={Waves}
            description="Mean height of the highest third of waves. Critical for small-craft vessel stability."
            status={waveHeight?.value && waveHeight.value > 2.5 ? 'ELEVATED' : 'FAVORABLE'}
            statusColor={waveHeight?.value && waveHeight.value > 2.5 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}
            secondaryValue={waveDirection?.value !== undefined && waveDirection?.value !== null ? `Heading: ${waveDirection.value}°` : undefined}
          />

          <DetailedMetricCard
            label="Wave Peak Period (Tp)"
            subLabel="Dominant Wave Energy"
            value={wavePeriod?.value}
            unit="s"
            icon={Clock}
            description="Time between successive wave crests. Longer periods (>10s) indicate powerful groundswell."
            status="STABLE"
          />

          <DetailedMetricCard
            label="Open Ocean Swell"
            subLabel="Remote Oceanic Propagation"
            value={swellHeight?.value}
            unit="m"
            icon={Waves}
            description="Distant storm-generated swells. Less steep than wind waves but carries high momentum."
            secondaryValue={swellPeriod?.value ? `Period: ${swellPeriod.value}s` : undefined}
          />

          <DetailedMetricCard
            label="Sea Surface Temp (SST)"
            subLabel="Thermal Ocean Surface"
            value={seaTemp?.value}
            unit="°C"
            icon={Thermometer}
            description="High SST (>28°C) provides thermal energy for cyclogenesis and influences pelagic fish migration."
            status="OPTIMAL"
          />

          <DetailedMetricCard
            label="Ocean Surface Current"
            subLabel="Eulerian Surface Drift"
            value={oceanCurrent?.value}
            unit="km/h"
            icon={Navigation}
            description="Surface drift velocity affecting vessel fuel consumption, passage drift, and net setting."
            secondaryValue={currentDirection?.value !== undefined && currentDirection?.value !== null ? `Bearing: ${currentDirection.value}°` : undefined}
          />

          <DetailedMetricCard
            label="Wind Wave Height"
            subLabel="Local Wind-Generated Chop"
            value={windWaveHeight?.value}
            unit="m"
            icon={Wind}
            description="Locally generated steep chop driven by current surface wind friction."
          />
        </div>
      </div>

      {/* Section 2: Surface Meteorology & Atmospheric Boundary Layer */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Marine Atmospheric Boundary Layer
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <DetailedMetricCard
            label="Surface Wind Velocity (10m)"
            subLabel="10-Meter Marine Exposure"
            value={windSpeed?.value}
            unit="km/h"
            icon={Wind}
            description="Sustained wind speed driving local sea state friction and navigational drift."
            status={windSpeed?.value && windSpeed.value > 40 ? 'GALE WARNING' : 'CALM / MODERATE'}
            statusColor={windSpeed?.value && windSpeed.value > 40 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}
            secondaryValue={windDirection?.value !== undefined && windDirection?.value !== null ? `Direction: ${windDirection.value}°` : undefined}
          />

          <DetailedMetricCard
            label="Peak Wind Gusts"
            subLabel="Turbulent Maximum Velocity"
            value={windGusts?.value}
            unit="km/h"
            icon={Wind}
            description="Instantaneous peak velocity during wind squalls. Important for vessel rigging safety."
            status={windGusts?.value && windGusts.value > 50 ? 'HIGH SQUALL RISK' : 'NORMAL'}
            statusColor={windGusts?.value && windGusts.value > 50 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}
          />

          <DetailedMetricCard
            label="Atmospheric Pressure (MSL)"
            subLabel="Mean Sea Level Barometer"
            value={pressure?.value}
            unit="hPa"
            icon={Gauge}
            description="Rapid barometric drops (>3 hPa in 3h) provide early warning of approaching squalls/low-pressure depressions."
            status="BAROMETRIC EQUILIBRIUM"
          />

          <DetailedMetricCard
            label="Precipitation Rate"
            subLabel="Surface Marine Rain"
            value={precipitation?.value !== undefined && precipitation?.value !== null ? precipitation.value : 0}
            unit="mm/h"
            icon={CloudRain}
            description="Liquid precipitation affecting on-deck visibility and sea surface roughness."
          />

          <DetailedMetricCard
            label="Weather Condition"
            subLabel="Observed State"
            value={weatherDesc}
            unit=""
            icon={CloudSun}
            description={`WMO Standard Weather Synoptic Code: ${weatherCode?.value !== undefined && weatherCode?.value !== null ? weatherCode.value : '0'}`}
          />
        </div>
      </div>

    </div>
  );
};
