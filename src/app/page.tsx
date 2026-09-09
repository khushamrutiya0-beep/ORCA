'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Coordinates, OceanObservation, WeatherObservation, PFZZone, RiskAssessment } from '@/lib/types';
import { OrcaAlert } from '@/lib/types/alert';
import { demoMarineProvider } from '@/lib/providers/demoProvider';
import { useRole } from '@/lib/context/RoleContext';
import { SignInPage } from '@/components/auth/SignInPage';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { QuickLocationPicker } from '@/components/dashboard/QuickLocationPicker';

// Role Dashboards
import { FishermanDashboard } from '@/components/roles/FishermanDashboard';
import { ResearcherDashboard } from '@/components/roles/ResearcherDashboard';
import { CoastalAuthorityDashboard } from '@/components/roles/CoastalAuthorityDashboard';
import { DisasterManagementDashboard } from '@/components/roles/DisasterManagementDashboard';
import { MaritimeOperatorDashboard } from '@/components/roles/MaritimeOperatorDashboard';

// Modular Dedicated Views
import { LiveMapView } from '@/components/views/LiveMapView';
import { MarineTelemetryView } from '@/components/views/MarineTelemetryView';
import { PFZView } from '@/components/views/PFZView';
import { TidesView } from '@/components/views/TidesView';
import { GeofencesView } from '@/components/views/GeofencesView';
import { SourcesView } from '@/components/views/SourcesView';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Sparkles, X } from 'lucide-react';

export default function OrcaDashboard() {
  const { isAuthenticated, role, activeView, setActiveView } = useRole();

  // Selected Location: Default to Mumbai Offshore (Arabian Sea)
  const [coordinates, setCoordinates] = useState<Coordinates>({
    latitude: 18.9220,
    longitude: 72.8347,
  });
  const [locationName, setLocationName] = useState('Mumbai Offshore (Arabian Sea)');
  const [oceanData, setOceanData] = useState<OceanObservation | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherObservation | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [pfzZones, setPfzZones] = useState<PFZZone[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<OrcaAlert[]>([]);
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<'current' | 'tomorrow_morning'>('tomorrow_morning');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showFloatingChat, setShowFloatingChat] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const fetchTelemetryAndRisk = useCallback(async (coords: Coordinates, timeWindow: 'current' | 'tomorrow_morning') => {
    setIsRefreshing(true);
    setFetchError(null);

    const timeParam = timeWindow === 'tomorrow_morning' ? 'tomorrow_morning' : '';

    try {
      const [marineRes, weatherRes, riskRes, alertsRes, demoPfz] = await Promise.all([
        fetch(`/api/marine?lat=${coords.latitude}&lon=${coords.longitude}${timeParam ? '&time=' + timeParam : ''}`),
        fetch(`/api/weather?lat=${coords.latitude}&lon=${coords.longitude}${timeParam ? '&time=' + timeParam : ''}`),
        fetch(`/api/risk?lat=${coords.latitude}&lon=${coords.longitude}${timeParam ? '&time=' + timeParam : ''}`),
        fetch(`/api/alerts?lat=${coords.latitude}&lon=${coords.longitude}`),
        demoMarineProvider.getNearbyPFZ(coords.latitude, coords.longitude),
      ]);

      if (!marineRes.ok) throw new Error(`Marine API returned status ${marineRes.status}`);
      if (!weatherRes.ok) throw new Error(`Weather API returned status ${weatherRes.status}`);
      if (!riskRes.ok) throw new Error(`Risk API returned status ${riskRes.status}`);

      const marineJson: OceanObservation = await marineRes.json();
      const weatherJson: WeatherObservation = await weatherRes.json();
      const riskJson: RiskAssessment = await riskRes.json();
      const alertsJson = alertsRes.ok ? await alertsRes.json() : { alerts: [] };

      setOceanData(marineJson);
      setWeatherData(weatherJson);
      setRiskAssessment(riskJson);
      setActiveAlerts(alertsJson.alerts || []);
      setPfzZones(demoPfz);
    } catch (err: any) {
      console.error('Telemetry fetch error:', err);
      setFetchError(err.message || 'Failed to fetch ocean/weather telemetry');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetryAndRisk(coordinates, selectedTimeWindow);
  }, [coordinates, selectedTimeWindow, fetchTelemetryAndRisk]);

  const handleLocationChange = (newCoords: Coordinates, name?: string) => {
    setCoordinates(newCoords);
    if (name) setLocationName(name);
  };

  // If user is not authenticated, render the 2-step Role Selection & Sign-In Screen
  if (!isAuthenticated) {
    return <SignInPage />;
  }

  // Render view based on activeView
  const renderActiveView = () => {
    switch (activeView) {
      // 1. Role Core Dashboards & Dedicated Views
      case 'home':
        return (
          <FishermanDashboard
            coordinates={coordinates}
            locationName={locationName}
            oceanData={oceanData}
            weatherData={weatherData}
            riskAssessment={riskAssessment}
            pfzZones={pfzZones}
            activeAlerts={activeAlerts}
            selectedTimeWindow={selectedTimeWindow}
            onTimeWindowChange={setSelectedTimeWindow}
            onSelectCoordinates={handleLocationChange}
            onSelectView={setActiveView}
          />
        );

      case 'marine':
        return (
          <MarineTelemetryView
            coordinates={coordinates}
            locationName={locationName}
            oceanData={oceanData}
            weatherData={weatherData}
            onSelectCoordinates={handleLocationChange}
            onSelectView={setActiveView}
          />
        );

      case 'research':
      case 'productivity':
      case 'historical':
        return (
          <ResearcherDashboard
            coordinates={coordinates}
            locationName={locationName}
            oceanData={oceanData}
            weatherData={weatherData}
            onSelectView={setActiveView}
          />
        );

      case 'coastal':
      case 'ports':
        return (
          <CoastalAuthorityDashboard
            coordinates={coordinates}
            locationName={locationName}
            riskAssessment={riskAssessment}
            activeAlerts={activeAlerts}
            onSelectCoordinates={handleLocationChange}
            onSelectView={setActiveView}
          />
        );

      case 'disaster':
      case 'alerts':
        return (
          <DisasterManagementDashboard
            coordinates={coordinates}
            locationName={locationName}
            activeAlerts={activeAlerts}
            onSelectView={setActiveView}
          />
        );

      case 'fleet':
      case 'route':
        return (
          <MaritimeOperatorDashboard
            coordinates={coordinates}
            locationName={locationName}
            onSelectCoordinates={handleLocationChange}
            onSelectView={setActiveView}
          />
        );

      case 'command':
        if (role === 'COASTAL_AUTHORITY') {
          return (
            <CoastalAuthorityDashboard
              coordinates={coordinates}
              locationName={locationName}
              riskAssessment={riskAssessment}
              activeAlerts={activeAlerts}
              onSelectCoordinates={handleLocationChange}
              onSelectView={setActiveView}
            />
          );
        } else if (role === 'DISASTER_MANAGEMENT') {
          return (
            <DisasterManagementDashboard
              coordinates={coordinates}
              locationName={locationName}
              activeAlerts={activeAlerts}
              onSelectView={setActiveView}
            />
          );
        } else if (role === 'MARITIME_OPERATOR') {
          return (
            <MaritimeOperatorDashboard
              coordinates={coordinates}
              locationName={locationName}
              onSelectCoordinates={handleLocationChange}
              onSelectView={setActiveView}
            />
          );
        }
        return (
          <FishermanDashboard
            coordinates={coordinates}
            locationName={locationName}
            oceanData={oceanData}
            weatherData={weatherData}
            riskAssessment={riskAssessment}
            pfzZones={pfzZones}
            activeAlerts={activeAlerts}
            selectedTimeWindow={selectedTimeWindow}
            onTimeWindowChange={setSelectedTimeWindow}
            onSelectCoordinates={handleLocationChange}
            onSelectView={setActiveView}
          />
        );

      // 2. Standalone Modular Views
      case 'map':
        return (
          <LiveMapView
            coordinates={coordinates}
            locationName={locationName}
            onSelectCoordinates={handleLocationChange}
            pfzZones={pfzZones}
            alerts={activeAlerts}
            riskLevel={riskAssessment?.riskLevel || 'LOW'}
            nearestPort={riskAssessment?.nearestPort}
          />
        );

      case 'pfz':
        return (
          <PFZView
            coordinates={coordinates}
            locationName={locationName}
            pfzZones={pfzZones}
            onSelectCoordinates={handleLocationChange}
          />
        );

      case 'tides':
        return (
          <TidesView
            coordinates={coordinates}
            locationName={locationName}
          />
        );

      case 'geofences':
        return (
          <GeofencesView
            coordinates={coordinates}
            locationName={locationName}
            onSelectCoordinates={handleLocationChange}
          />
        );

      case 'sources':
        return <SourcesView />;

      case 'chat':
        return (
          <div className="h-[calc(100vh-140px)]">
            <ChatPanel
              currentCoordinates={coordinates}
              locationName={locationName}
              onLocationChange={handleLocationChange}
              onRiskAssessmentUpdate={setRiskAssessment}
            />
          </div>
        );

      default:
        return (
          <FishermanDashboard
            coordinates={coordinates}
            locationName={locationName}
            oceanData={oceanData}
            weatherData={weatherData}
            riskAssessment={riskAssessment}
            pfzZones={pfzZones}
            activeAlerts={activeAlerts}
            selectedTimeWindow={selectedTimeWindow}
            onTimeWindowChange={setSelectedTimeWindow}
            onSelectCoordinates={handleLocationChange}
            onSelectView={setActiveView}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      
      {/* Top Clean Navbar (No role or language dropdowns) */}
      <TopNavbar
        locationName={locationName}
        currentCoordinates={coordinates}
        onOpenLocationModal={() => setShowLocationModal(true)}
        activeAlertCount={activeAlerts.length}
        onOpenAlertsModal={() => setActiveView('alerts')}
        onOpenChatDrawer={() => setShowFloatingChat(true)}
        onRefresh={() => fetchTelemetryAndRisk(coordinates, selectedTimeWindow)}
        isRefreshing={isRefreshing}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      {/* Main Workspace with Sidebar & Content */}
      <div className="flex-1 flex overflow-hidden relative w-full min-w-0">
        
        {/* Role-Filtered Sidebar (Desktop persistent + Mobile Drawer with Backdrop) */}
        <Sidebar
          activeView={activeView}
          onSelectView={(v) => {
            setActiveView(v);
            setIsMobileSidebarOpen(false);
          }}
          isOpenOnMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Main View Area */}
        <main className="flex-1 min-w-0 w-full overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 relative">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeView={activeView}
        onSelectView={(v) => {
          setActiveView(v);
          setIsMobileSidebarOpen(false);
        }}
        activeAlertCount={activeAlerts.length}
      />

      {/* Floating AI Chat Trigger (when not on chat view) */}
      {activeView !== 'chat' && (
        <button
          onClick={() => setShowFloatingChat(true)}
          type="button"
          className="fixed bottom-20 lg:bottom-6 right-6 z-30 p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg hover:shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 group"
          title="Open ORCA Intelligence Assistant"
        >
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold hidden sm:inline">ORCA AI</span>
        </button>
      )}

      {/* Floating Chat Drawer Modal */}
      {showFloatingChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full h-[650px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-3.5 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900">ORCA Multi-Agent Intelligence</span>
              </div>
              <button
                onClick={() => setShowFloatingChat(false)}
                type="button"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatPanel
                currentCoordinates={coordinates}
                locationName={locationName}
                onLocationChange={handleLocationChange}
                onRiskAssessmentUpdate={setRiskAssessment}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Location Picker Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full sm:w-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            <QuickLocationPicker
              currentCoordinates={coordinates}
              onSelectCoordinates={handleLocationChange}
              onClose={() => setShowLocationModal(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
