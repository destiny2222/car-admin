import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '10';
  const status = searchParams.get('status') || 'all';
  const page = searchParams.get('page') || '1';

  // Mock listings/cars data
  const mockListings = [
    {
      id: 1,
      make: "Toyota",
      model: "Camry",
      year: 2023,
      price: 28000,
      mileage: 15000,
      fuel_type: "Petrol",
      transmission: "Automatic",
      status: "approved",
      image_url: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400",
      created_at: "2024-02-15T10:00:00Z"
    },
    {
      id: 2,
      make: "Honda",
      model: "Accord",
      year: 2022,
      price: 32000,
      mileage: 25000,
      fuel_type: "Petrol",
      transmission: "Automatic",
      status: "approved",
      image_url: "https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=400",
      created_at: "2024-02-20T14:30:00Z"
    },
    {
      id: 3,
      make: "Tesla",
      model: "Model 3",
      year: 2024,
      price: 45000,
      mileage: 5000,
      fuel_type: "Electric",
      transmission: "Automatic",
      status: "pending",
      image_url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400",
      created_at: "2024-03-01T09:15:00Z"
    },
    {
      id: 4,
      make: "BMW",
      model: "3 Series",
      year: 2023,
      price: 48000,
      mileage: 18000,
      fuel_type: "Petrol",
      transmission: "Automatic",
      status: "approved",
      image_url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400",
      created_at: "2024-02-10T11:45:00Z"
    },
    {
      id: 5,
      make: "Mercedes",
      model: "C-Class",
      year: 2023,
      price: 52000,
      mileage: 12000,
      fuel_type: "Petrol",
      transmission: "Automatic",
      status: "declined",
      image_url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400",
      created_at: "2024-01-25T16:20:00Z"
    },
    {
      id: 6,
      make: "Audi",
      model: "A4",
      year: 2022,
      price: 42000,
      mileage: 30000,
      fuel_type: "Petrol",
      transmission: "Automatic",
      status: "approved",
      image_url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400",
      created_at: "2024-02-05T13:10:00Z"
    }
  ];

  // Filter by status if provided
  let filteredListings = mockListings;
  if (status && status !== 'all') {
    filteredListings = mockListings.filter(l => l.status === status);
  }

  // Apply limit
  const limitedListings = filteredListings.slice(0, parseInt(limit as string));

  const mockResponse = {
    status: true,
    data: {
      listings: limitedListings,
      total: filteredListings.length,
      page: parseInt(page as string),
      total_pages: Math.ceil(filteredListings.length / 10)
    }
  };

  return NextResponse.json(mockResponse);
}
