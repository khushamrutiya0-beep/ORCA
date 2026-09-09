import { NextRequest, NextResponse } from 'next/server';
import { openMeteoWeatherProvider } from '@/lib/providers/openMeteoWeatherProvider';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat') || searchParams.get('latitude');
    const lonStr = searchParams.get('lon') || searchParams.get('longitude');
    const time = searchParams.get('time') || undefined;

    if (!latStr || !lonStr) {
      return NextResponse.json(
        {
          error: 'Missing required query parameters: "lat" (latitude) and "lon" (longitude)',
          usage: '/api/weather?lat=18.9220&lon=72.8347&time=2026-08-24T06:00:00Z',
        },
        { status: 400 }
      );
    }

    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lonStr);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Latitude and Longitude must be valid numerical values' },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        {
          error: `Coordinates out of range: Lat ${latitude}, Lon ${longitude}. Latitude must be between -90 and 90, Longitude between -180 and 180.`,
        },
        { status: 400 }
      );
    }

    const observation = await openMeteoWeatherProvider.getWeatherForecast(latitude, longitude, time);

    return NextResponse.json(observation, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Internal server error processing weather forecast request',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
