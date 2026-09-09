import { NextRequest, NextResponse } from 'next/server';
import { checkGeofences } from '@/lib/geofencing/geofenceService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');
  const radiusStr = searchParams.get('radius_km');

  if (!latStr || !lonStr) {
    return NextResponse.json(
      { error: 'Missing required query parameters: "lat" and "lon"' },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  const radiusKm = radiusStr ? parseFloat(radiusStr) : 60;

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json(
      { error: `Coordinates out of range: Lat ${latStr}, Lon ${lonStr}` },
      { status: 400 }
    );
  }

  const result = checkGeofences(lat, lon, radiusKm);
  return NextResponse.json(result);
}
