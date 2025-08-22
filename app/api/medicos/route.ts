import { NextResponse } from "next/server"
// Los datos ahora vienen del backend real

export async function GET() {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json(mockDoctors)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 })
  }
}
