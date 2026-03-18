import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    
    const body = await request.json();
    const { status } = body;

    if (!listingId || !status) {
      return NextResponse.json(
        { status: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Mock successful status update
    const mockResponse = {
      status: true,
      message: "Listing status updated successfully",
      data: {
        id: parseInt(listingId),
        status: status,
        updated_at: new Date().toISOString()
      }
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
