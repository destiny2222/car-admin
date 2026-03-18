import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Mock authentication - accept any credentials for demo
    // In production, validate against a real database
    if (email && password) {
      const response = NextResponse.json(
        {
          status: true,
          message: "Login successful",
          data: {
            user: {
              id: 1,
              email: email,
              name: "Admin User",
              role: "admin"
            }
          }
        },
        { status: 200 }
      );

      // Set auth cookie
      response.cookies.set('session', 'mock-session-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      response.cookies.set('token', 'mock-auth-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { status: false, message: "Invalid credentials" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
