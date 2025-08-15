import { NextResponse } from "next/server"
import { mockEdificios } from "@/lib/mock-data"

export async function GET() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))

    return NextResponse.json(mockEdificios)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch buildings" }, { status: 500 })
  }
}
