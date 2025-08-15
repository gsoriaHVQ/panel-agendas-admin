import { NextResponse } from "next/server"
import { mockAgendas } from "@/lib/mock-data"

export async function GET() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json(mockAgendas)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch agendas" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Simulate creating a new agenda
    const newAgenda = {
      id: Math.floor(Math.random() * 1000) + 200,
      ...body,
      estado: "Activa",
    }

    await new Promise((resolve) => setTimeout(resolve, 800))

    return NextResponse.json(newAgenda, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create agenda" }, { status: 500 })
  }
}
