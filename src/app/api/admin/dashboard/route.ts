import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'this_month';

  // Mock data for dashboard
  const mockData = {
    status: true,
    data: {
      listings: {
        total: 156,
        pending: 12,
        approved: 128,
        declined: 16,
        pending_change: 8,
        approved_change: 15,
        declined_change: -5
      },
      bookings: {
        total: 342,
        pending: 24,
        in_progress: 18,
        completed: 300,
        pending_change: 12,
        in_progress_change: 5,
        completed_change: 25
      },
      users: {
        total: 89,
        monthly_change: 18
      },
      revenue: {
        total: 45680,
        monthly_change: 23
      }
    },
    period
  };

  return NextResponse.json(mockData);
}
