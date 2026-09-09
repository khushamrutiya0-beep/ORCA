import { NextRequest, NextResponse } from 'next/server';
import { optimizeSafestRoute } from '@/lib/routing/routeOptimizer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromLat = searchParams.get('from_lat');
  const fromLon = searchParams.get('from_lon');
  const fromName = searchParams.get('from_name') || 'Departure Point';
  const toLat = searchParams.get('to_lat');
  const toLon = searchParams.get('to_lon');
  const toName = searchParams.get('to_name') || 'Destination Point';

  if (!fromLat || !fromLon || !toLat || !toLon) {
    return NextResponse.json(
      { error: 'Missing required query parameters: "from_lat", "from_lon", "to_lat", "to_lon"' },
      { status: 400 }
    );
  }

  const fLat = parseFloat(fromLat);
  const fLon = parseFloat(fromLon);
  const tLat = parseFloat(toLat);
  const tLon = parseFloat(toLon);

  if (isNaN(fLat) || isNaN(fLon) || isNaN(tLat) || isNaN(tLon)) {
    return NextResponse.json(
      { error: 'Invalid numerical coordinates provided' },
      { status: 400 }
    );
  }

  const routeResult = optimizeSafestRoute({
    origin: { name: fromName, latitude: fLat, longitude: fLon },
    destination: { name: toName, latitude: tLat, longitude: tLon },
  });

  return NextResponse.json(routeResult);
}
