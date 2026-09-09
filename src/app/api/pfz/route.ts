/**
 * ORCA PFZ API Route
 * GET /api/pfz?lat=&lon=
 *
 * Returns PFZ zone data.
 * Currently: DEMO only (INCOIS has no public API).
 * Status clearly labelled in every response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { demoPfzProvider } from '@/lib/providers/pfz/demoPfzProvider';
import { incoisPfzProvider } from '@/lib/providers/pfz/incoisPfzProvider';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');

  const lat = latStr ? parseFloat(latStr) : 15.0;
  const lon = lonStr ? parseFloat(lonStr) : 74.0;

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  // Check INCOIS first (UNAVAILABLE — documented)
  const incoisResult = await incoisPfzProvider.getPFZZones(lat, lon);
  // Fall back to DEMO
  const demoResult = await demoPfzProvider.getPFZZones(lat, lon);

  return NextResponse.json({
    pfzStatus: {
      incois: {
        status: incoisResult.status,
        message: incoisResult.error ?? incoisResult.disclaimer,
      },
      activeProvider: 'DEMO',
    },
    zones: demoResult.zones,
    source: demoResult.source,
    sourceType: demoResult.sourceType,
    status: demoResult.status,
    retrievedAt: demoResult.retrievedAt,
    disclaimer: demoResult.disclaimer,
    note: 'INCOIS PFZ API not publicly available. DEMO zones are NOT real PFZ data. For real advisories visit incois.gov.in or use the SAMUDRA app.',
  });
}
