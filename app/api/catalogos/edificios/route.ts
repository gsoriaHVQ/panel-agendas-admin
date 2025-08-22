import { NextResponse } from "next/server"
// Los datos ahora vienen del backend real

export async function GET() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))

    return NextResponse.json(mockEdificios)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch buildings" }, { status: 500 })
  }
}
