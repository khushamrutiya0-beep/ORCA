import { NextRequest, NextResponse } from 'next/server';
import { demoSatelliteProvider } from '@/lib/providers/satellite/ISatelliteProvider';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');

  if (!latStr || !lonStr) {
    return NextResponse.json(
      { error: 'Missing required query parameters: "lat" and "lon"' },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json(
      { error: 'Invalid coordinates' },
      { status: 400 }
    );
  }

  const chlorophyll = await demoSatelliteProvider.getChlorophyll(lat, lon);
  const sst = await demoSatelliteProvider.getSST(lat, lon);

  return NextResponse.json({
    chlorophyll,
    sst,
    sourceAttribution: 'ORCA Satellite Ocean Color (DEMO Proxy) + Open-Meteo SST (LIVE)',
    retrievedAt: new Date().toISOString(),
  });
}
