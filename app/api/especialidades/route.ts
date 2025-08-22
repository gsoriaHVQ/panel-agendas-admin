import { NextResponse } from "next/server"
import { especialidades } from "@/lib/agendas-data"

export async function GET() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))

    return NextResponse.json(especialidades)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch specialties" }, { status: 500 })
  }
}
