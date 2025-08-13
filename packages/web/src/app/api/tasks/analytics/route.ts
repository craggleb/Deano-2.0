import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const days = searchParams.get('days');

    // Build the query string for the backend API
    const queryParams = new URLSearchParams();
    if (date) queryParams.append('date', date);
    if (days) queryParams.append('days', days);

    // Use internal Docker network URL for server-side API calls
    const apiUrl = process.env.NODE_ENV === 'production' ? 'http://api:3001' : 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/tasks/analytics?${queryParams.toString()}`);

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch analytics' } },
      { status: 500 }
    );
  }
}
