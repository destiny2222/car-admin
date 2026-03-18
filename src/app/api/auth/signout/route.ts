import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const response = NextResponse.json({
            status: true,
            message: "Signed out successfully",
        });

        response.cookies.delete("admin_token");

        return response;
    } catch (error) {
        console.error("Sign out error:", error);
        return NextResponse.json(
            { status: false, message: "Failed to sign out" },
            { status: 500 }
        );
    }
}