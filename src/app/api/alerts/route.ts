/**
 * ORCA Alerts API Route
 * GET /api/alerts?lat=&lon=&radius_nm=
 *
 * Returns verified live marine alerts from configured providers.
 * Currently connected: GDACS (LIVE)
 * Not connected: IMD (REQUIRES_CREDENTIALS)
 *
 * All server-side. No API keys in response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAggregatedAlerts } from '@/lib/alerts/alertAggregator';

export const dynamic = 'force-dynamic';

const INDIA_MARITIME_RADIUS_KM = 2500; // covers Arabian Sea, Indian Ocean, Bay of Bengal

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');
  const radiusNmStr = searchParams.get('radius_nm');

  // Default to Indian Ocean center if no coords supplied
  const lat = latStr ? parseFloat(latStr) : 15.0;
  const lon = lonStr ? parseFloat(lonStr) : 74.0;
  const radiusNm = radiusNmStr ? parseFloat(radiusNmStr) : 1350; // ~2500 km
  const radiusKm = radiusNm * 1.852;

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  try {
    const result = await getAggregatedAlerts(lat, lon, Math.min(radiusKm, INDIA_MARITIME_RADIUS_KM));

    return NextResponse.json({
      alerts: result.alerts,
      alertCount: result.alerts.length,
      liveProviders: result.liveProviders,
      unavailableProviders: result.unavailableProviders,
      providerStatus: result.providerResults.map(p => ({
        source: p.source,
        status: p.status,
        alertCount: p.alerts.length,
        error: p.error,
        fromCache: p.fromCache,
      })),
      retrievedAt: result.retrievedAt,
      queryCoordinates: { lat, lon },
      radiusKm: Math.min(radiusKm, INDIA_MARITIME_RADIUS_KM),
      note: 'Alert data from GDACS (UN OCHA/JRC). IMD official alerts not yet connected (requires credentials).',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/alerts] Error:', message);
    return NextResponse.json(
      {
        error: 'Alert service error',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    );
  }
}
