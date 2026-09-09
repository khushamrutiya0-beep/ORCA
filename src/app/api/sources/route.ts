/**
 * ORCA Data Source Health API Route
 * GET /api/sources
 *
 * Returns the status of every investigated data source.
 * Status is honest — never claims LIVE for unavailable sources.
 */

import { NextResponse } from 'next/server';
import { getAllSources, getSourceHealthSummary } from '@/lib/dataSources/sourceRegistry';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sources = getAllSources();
  const summary = getSourceHealthSummary();

  return NextResponse.json({
    sources,
    summary,
    generatedAt: new Date().toISOString(),
    note: 'This registry reflects ORCA\'s honest assessment of each data source. Status is only LIVE when the source has been tested and verified.',
  });
}
