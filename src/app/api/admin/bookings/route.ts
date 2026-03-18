import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '10';
  const status = searchParams.get('status') || 'all';
  const page = searchParams.get('page') || '1';

  // Mock bookings data
  const mockBookings = [
    {
      id: 1,
      customer_name: "John Doe",
      car_model: "Toyota Camry",
      car_year: 2023,
      pickup_date: "2024-03-15",
      return_date: "2024-03-20",
      status: "completed",
      total_amount: 450,
      created_at: "2024-03-10T10:00:00Z"
    },
    {
      id: 2,
      customer_name: "Jane Smith",
      car_model: "Honda Accord",
      car_year: 2022,
      pickup_date: "2024-03-18",
      return_date: "2024-03-22",
      status: "in_progress",
      total_amount: 380,
      created_at: "2024-03-12T14:30:00Z"
    },
    {
      id: 3,
      customer_name: "Mike Johnson",
      car_model: "Tesla Model 3",
      car_year: 2024,
      pickup_date: "2024-03-20",
      return_date: "2024-03-25",
      status: "pending",
      total_amount: 620,
      created_at: "2024-03-14T09:15:00Z"
    },
    {
      id: 4,
      customer_name: "Sarah Williams",
      car_model: "BMW 3 Series",
      car_year: 2023,
      pickup_date: "2024-03-22",
      return_date: "2024-03-27",
      status: "pending",
      total_amount: 550,
      created_at: "2024-03-15T11:45:00Z"
    },
    {
      id: 5,
      customer_name: "David Brown",
      car_model: "Mercedes C-Class",
      car_year: 2023,
      pickup_date: "2024-03-10",
      return_date: "2024-03-15",
      status: "completed",
      total_amount: 720,
      created_at: "2024-03-05T16:20:00Z"
    }
  ];

  // Filter by status if provided
  let filteredBookings = mockBookings;
  if (status && status !== 'all') {
    filteredBookings = mockBookings.filter(b => b.status === status);
  }

  // Apply limit
  const limitedBookings = filteredBookings.slice(0, parseInt(limit as string));

  const mockResponse = {
    status: true,
    data: {
      bookings: limitedBookings,
      total: filteredBookings.length,
      page: parseInt(page as string),
      total_pages: Math.ceil(filteredBookings.length / 10)
    }
  };

  return NextResponse.json(mockResponse);
}
