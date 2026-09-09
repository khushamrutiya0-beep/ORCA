import { NextRequest, NextResponse } from 'next/server';
import { tideProvider, INDIAN_TIDE_STATIONS } from '@/lib/providers/tide/ITideProvider';

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

  const result = await tideProvider.getTideForecast(lat, lon);
  return NextResponse.json({
    ...result,
    referenceStations: INDIAN_TIDE_STATIONS,
  });
}
