import { NextRequest, NextResponse } from 'next/server';

// Helper to get auth token from cookie
function getAuthToken(request: NextRequest): string | null {
  const token = request.cookies.get('admin_token')?.value 
    || request.cookies.get('token')?.value
    || request.cookies.get('session')?.value
    || request.cookies.get('auth_token')?.value;
  return token || null;
}

// Helper to create CORS headers
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function PATCH(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { status: false, message: 'Unauthorized' },
        { status: 401, headers: getCorsHeaders() }
      );
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json(
        { status: false, message: 'Listing ID is required' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const body = await request.json();
    const { status, reason } = body;

    if (!status || !['approved', 'declined'].includes(status)) {
      return NextResponse.json(
        { status: false, message: 'Valid status (approved or declined) is required' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const externalApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/listings/status?listingId=${listingId}`;
    console.log('Listing Status API - Calling:', externalApiUrl);

    // Try calling external API with Bearer token first
    let response = await fetch(externalApiUrl, { 
      method: 'PATCH', 
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(reason && { reason }) }),
    });
    console.log('Listing Status API - First attempt status:', response.status);
    
    // If 401/403, try without Bearer prefix
    if (response.status === 401 || response.status === 403) {
      response = await fetch(externalApiUrl, { 
        method: 'PATCH', 
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(reason && { reason }) }),
      });
      console.log('Listing Status API - Second attempt status:', response.status);
    }
    
    // If still not OK, try with token header instead
    if (!response.ok) {
      response = await fetch(externalApiUrl, { 
        method: 'PATCH', 
        headers: { 'token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(reason && { reason }) }),
      });
      console.log('Listing Status API - Third attempt status:', response.status);
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { status: false, message: data.message || 'Failed to update listing status' },
        { status: response.status, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json(data, { headers: getCorsHeaders() });
  } catch (error) {
    console.error('Listing status update API error:', error);
    return NextResponse.json(
      { status: false, message: 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

// Handle OPTIONS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}
