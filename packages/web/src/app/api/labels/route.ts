import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Use internal Docker network URL for server-side API calls
    const apiUrl = process.env.NODE_ENV === 'production' ? 'http://api:3001' : 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/labels`);

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Labels API error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch labels' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Use internal Docker network URL for server-side API calls
    const apiUrl = process.env.NODE_ENV === 'production' ? 'http://api:3001' : 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/labels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Backend API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Labels API error:', error);
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Failed to create label' } },
      { status: 500 }
    );
  }
}
