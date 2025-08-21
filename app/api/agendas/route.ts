import { NextResponse } from "next/server"


export async function GET() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500))
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch agendas" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    await new Promise((resolve) => setTimeout(resolve, 800))
  } catch (error) {
    return NextResponse.json({ error: "Failed to create agenda" }, { status: 500 })
  }
}
