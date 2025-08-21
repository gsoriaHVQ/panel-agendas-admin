"use client"

import { Button } from "@/components/ui/button"
import { FileSpreadsheet } from "lucide-react"
import type { StaffItem } from "@/lib/excel/generateStaffWorkbook"
import { generateStaffWorkbook } from "@/lib/excel/generateStaffWorkbook"
import { downloadExcel } from "@/lib/excel/downloadExcel"

interface BtnExportarStaffProps {
  items: StaffItem[]
}

export default function BtnExportarStaff({ items }: BtnExportarStaffProps) {
  const handleClick = async () => {
    const buffer = await generateStaffWorkbook(items, { rowsPerColumn: 40, sheetName: "STAFF 2025" })
    downloadExcel(buffer, "STAFF.xlsx")
  }

  return (
    <Button onClick={handleClick} variant="outline" className="border-[#7F0C43] text-[#7F0C43] hover:bg-[#7F0C43] hover:text-white bg-transparent">
      <FileSpreadsheet className="w-4 h-4 mr-2" />
      Descargar STAFF
    </Button>
  )
}


