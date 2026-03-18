import { NextRequest, NextResponse } from 'next/server';

// Helper to get auth token from cookie or header
function getAuthToken(request: NextRequest): string | null {
  // First try Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').replace('Bearer', '').trim();
    if (token) return token;
  }
  
  // Fall back to cookies
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

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { status: false, message: 'Unauthorized' },
        { status: 401, headers: getCorsHeaders() }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query string
    const queryParams = new URLSearchParams({
      page,
      limit,
    });
    
    if (status && status !== 'all') {
      queryParams.append('status', status);
    }
    if (search) {
      queryParams.append('search', search);
    }

    const externalApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/bookings?${queryParams.toString()}`;
    console.log('Bookings API - Calling:', externalApiUrl);

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Forward cookies
    const cookieHeader = request.headers.get('cookie') ?? '';
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    // Add Authorization header if token exists and is not 'true'
    if (token && token !== 'true') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Try calling external API with Bearer token first
    let response = await fetch(externalApiUrl, { 
      method: 'GET', 
      headers
    });
    console.log('Bookings API - First attempt status:', response.status);
    
    // If 401/403, try without Bearer prefix
    if (response.status === 401 || response.status === 403) {
      response = await fetch(externalApiUrl, { 
        method: 'GET', 
        headers: { 'Authorization': token, 'Content-Type': 'application/json' }
      });
      console.log('Bookings API - Second attempt status:', response.status);
    }
    
    // If still not OK, try with token header instead
    if (!response.ok) {
      response = await fetch(externalApiUrl, { 
        method: 'GET', 
        headers: { 'token': token, 'Content-Type': 'application/json' }
      });
      console.log('Bookings API - Third attempt status:', response.status);
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { status: false, message: data.message || 'Failed to fetch bookings' },
        { status: response.status, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json(data, { headers: getCorsHeaders() });
  } catch (error) {
    console.error('Bookings API error:', error);
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
