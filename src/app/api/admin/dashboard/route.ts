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
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'this_month';

    const externalApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/dashboard?period=${period}`;
    console.log('Dashboard API - Calling:', externalApiUrl);

    // Get auth token from header or cookie
    const token = getAuthToken(request);
    console.log('Dashboard API - Auth token:', token);

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Forward cookies from the browser to the external API
    const cookieHeader = request.headers.get('cookie') ?? '';
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    // Add Authorization header if token exists
    if (token && token !== 'true') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('Dashboard API - Request headers:', headers);

    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers,
    });

    console.log('Dashboard API - Response status:', response.status);
    
    const data = await response.json();
    console.log('Dashboard API - Response data:', data);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { success: false, message: data.message || 'Unauthorized' },
          { status: 401 }
        );
      }
      // Return the actual error from external API
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch dashboard', data: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}