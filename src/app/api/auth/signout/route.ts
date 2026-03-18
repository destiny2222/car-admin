import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  // Clear all auth cookies
  response.cookies.set('session', '', { expires: new Date(0) });
  response.cookies.set('token', '', { expires: new Date(0) });
  response.cookies.set('auth_token', '', { expires: new Date(0) });
  response.cookies.set('admin_token', '', { expires: new Date(0) });

  return response;
}
