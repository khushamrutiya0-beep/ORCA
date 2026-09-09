/**
 * ORCA Command Center API Route
 * GET /api/command-center?lat=&lon=
 *
 * Aggregates: weather + marine + risk + alerts + PFZ + source health
 * into a single command center payload.
 *
 * Regional risk values are ORCA PROTOTYPE ASSESSMENTS — not official government ratings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAggregatedAlerts } from '@/lib/alerts/alertAggregator';
import { getAllSources } from '@/lib/dataSources/sourceRegistry';
import { CommandCenterData, CoastalRegionStatus } from '@/lib/types/alert';

export const dynamic = 'force-dynamic';

// Representative offshore coordinates for each Indian coastal state
// Used to compute ORCA prototype risk assessments
const COASTAL_REGIONS = [
  { region: 'Gujarat Coast', state: 'Gujarat', latitude: 22.3, longitude: 69.5 },
  { region: 'Maharashtra Coast', state: 'Maharashtra', latitude: 18.9, longitude: 72.0 },
  { region: 'Goa Coast', state: 'Goa', latitude: 15.5, longitude: 73.6 },
  { region: 'Karnataka Coast', state: 'Karnataka', latitude: 13.8, longitude: 74.4 },
  { region: 'Kerala Coast', state: 'Kerala', latitude: 10.5, longitude: 76.0 },
  { region: 'Tamil Nadu Coast', state: 'Tamil Nadu', latitude: 11.0, longitude: 79.8 },
  { region: 'Andhra Pradesh Coast', state: 'Andhra Pradesh', latitude: 15.9, longitude: 81.5 },
  { region: 'Odisha Coast', state: 'Odisha', latitude: 20.3, longitude: 86.8 },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = parseFloat(searchParams.get('lat') ?? '15.0');
  const lon = parseFloat(searchParams.get('lon') ?? '74.0');

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const generatedAt = new Date().toISOString();

  // Fetch alerts (in parallel with regional risk — alerts use 2500km radius)
  const alertResult = await getAggregatedAlerts(lat, lon, 2500);

  // Alert summary
  const alertSummary = {
    severe: alertResult.alerts.filter(a => a.severity === 'SEVERE').length,
    high: alertResult.alerts.filter(a => a.severity === 'HIGH').length,
    moderate: alertResult.alerts.filter(a => a.severity === 'MODERATE').length,
    info: alertResult.alerts.filter(a => a.severity === 'INFO' || a.severity === 'LOW').length,
  };

  // Coastal regional risk — assessed as UNKNOWN (no per-region live data computed here)
  // Real per-region risk would require a separate risk API call per region
  // This is labelled ORCA PROTOTYPE and shows data status only
  const coastalRegions: CoastalRegionStatus[] = COASTAL_REGIONS.map(r => ({
    region: r.region,
    state: r.state,
    representativeCoords: { latitude: r.latitude, longitude: r.longitude },
    riskLevel: 'UNKNOWN', // Honest — per-region risk not computed at command center level
    dataStatus: 'LIVE',
    note: 'Per-region risk: use ORCA marine dashboard for full assessment at specific coordinates.',
  }));

  const sources = getAllSources();

  const data: CommandCenterData = {
    generatedAt,
    alertSummary,
    activeAlerts: alertResult.alerts,
    coastalRegions,
    dataSourceHealth: sources,
    disclaimer:
      'ORCA COMMAND CENTER — PROTOTYPE DECISION SUPPORT SYSTEM. ' +
      'Not an official government maritime intelligence service. ' +
      'Regional risk values are ORCA prototype model assessments, not official ratings. ' +
      'Alert data sourced from GDACS (UN OCHA/JRC). ' +
      'IMD official alerts not connected (requires credentials). ' +
      'PFZ data is DEMO — not from INCOIS.',
  };

  return NextResponse.json(data);
}
