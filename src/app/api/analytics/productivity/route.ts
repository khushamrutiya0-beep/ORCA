import { NextRequest, NextResponse } from 'next/server';
import { analyzeMarineProductivity } from '@/lib/analytics/marineProductivity';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');
  const sstStr = searchParams.get('sst');

  if (!latStr || !lonStr) {
    return NextResponse.json(
      { error: 'Missing required query parameters: "lat" and "lon"' },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  const sst = sstStr ? parseFloat(sstStr) : undefined;

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json(
      { error: 'Invalid coordinates' },
      { status: 400 }
    );
  }

  const result = await analyzeMarineProductivity(lat, lon, sst);
  return NextResponse.json(result);
}
