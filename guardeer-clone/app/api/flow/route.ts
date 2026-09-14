import { NextResponse } from "next/server";

export async function GET() {
  try {
    const basePrice = 2350.50 + Number((Math.random() * 2 - 1).toFixed(2));
    return NextResponse.json({
      price: basePrice,
      volume: Math.floor(Math.random() * 8) + 1,
      direction: Math.random() > 0.48 ? 1 : -1
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stream" }, { status: 500 });
  }
}