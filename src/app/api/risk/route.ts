import { NextRequest, NextResponse } from 'next/server';
import { openMeteoWeatherProvider } from '@/lib/providers/openMeteoWeatherProvider';
import { openMeteoMarineProvider } from '@/lib/providers/openMeteoMarineProvider';
import { orcaRiskEngine } from '@/lib/risk/riskEngine';
import { getTomorrowMorningIso, formatTimeWindowLabel } from '@/lib/risk/timeWindows';
import { findNearestPort } from '@/lib/geospatial';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat') || searchParams.get('latitude');
    const lonStr = searchParams.get('lon') || searchParams.get('longitude');
    let time = searchParams.get('time') || undefined;

    if (!latStr || !lonStr) {
      return NextResponse.json(
        {
          error: 'Missing required query parameters: "lat" (latitude) and "lon" (longitude)',
          usage: '/api/risk?lat=18.9220&lon=72.8347&time=tomorrow_morning',
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

    // Handle "tomorrow_morning" alias
    let timeLabel = 'Current Observation';
    if (time === 'tomorrow_morning') {
      time = getTomorrowMorningIso(5.5); // IST UTC+5.5
      timeLabel = 'Tomorrow Morning (06:00 AM IST)';
    } else if (time) {
      timeLabel = formatTimeWindowLabel(time);
    }

    // Parallel fetch of live weather and marine models
    const [weatherObs, oceanObs] = await Promise.all([
      openMeteoWeatherProvider.getWeatherForecast(latitude, longitude, time),
      openMeteoMarineProvider.getOceanState(latitude, longitude, time),
    ]);

    // Find nearest safe port
    const nearestPort = findNearestPort(latitude, longitude);

    // Run deterministic risk evaluation
    const assessment = orcaRiskEngine.assessMarineRisk({
      coordinates: { latitude, longitude },
      targetTimeIso: time,
      timeLabel,
      weatherObservation: weatherObs,
      oceanObservation: oceanObs,
      nearestPort,
    });

    return NextResponse.json(assessment, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Internal server error processing marine risk assessment',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
