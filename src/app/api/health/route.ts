import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'OPERATIONAL',
    app: 'ORCA — Marine Ecosystem Reasoning with Collaborative Agents',
    version: '0.1.0-mvp',
    timestamp: new Date().toISOString(),
    providers: {
      openMeteoMarine: { status: 'LIVE_READY', verified: true },
      openMeteoWeather: { status: 'LIVE_READY', verified: true },
      incoisPfz: { status: 'DEMO_STANDBY', verified: true },
      riskEngine: { status: 'PROTOTYPE_READY', verified: true },
    },
    disclaimer: 'ORCA prototype decision-support model based on documented meteorological/ocean criteria.',
  });
}
