import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    await new Promise((resolve) => setTimeout(resolve, 300))
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch agenda" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()

    // Simulate updating agenda
    const updatedAgenda = {
      id,
      ...body,
    }

    await new Promise((resolve) => setTimeout(resolve, 600))

    return NextResponse.json(updatedAgenda)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update agenda" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    await new Promise((resolve) => setTimeout(resolve, 400))

    return NextResponse.json({ message: "Agenda deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete agenda" }, { status: 500 })
  }
}
