import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
      // console.log('Login API response:', data);
      // console.log('Login API status:', response.status);
      // console.log('Login Set-Cookie header:', response.headers.get('set-cookie'));

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Invalid credentials' },
        { status: response.status }
      );
    }

    // Create response with success data
    const nextResponse = NextResponse.json(
      { success: true, message: 'Login successful', data: data.data },
      { status: 200 }
    );

    // Forward ALL Set-Cookie headers from the external API
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      nextResponse.headers.set('set-cookie', setCookie);
    }

    return nextResponse;

  } catch (error) {
    // console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
