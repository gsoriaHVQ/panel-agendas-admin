"use client"

import { Button } from "@/components/ui/button"
import { FileSpreadsheet } from "lucide-react"
import type { StaffItem } from "@/src/lib/excel/generateStaffWorkbook"
import { generateStaffWorkbook } from "@/src/lib/excel/generateStaffWorkbook"
import { downloadExcel } from "@/src/lib/excel/downloadExcel"

export default function BtnExportarStaff() {
  const handleClick = async () => {
    const items: StaffItem[] = [
      { especialidad: "ALERGOLOGÍA", medico: "Acosta Gabriela", dia: "Martes", consultorio: 228, hora: "17h00-18h30" },
      { especialidad: "ALERGOLOGÍA", medico: "Molinet Ansberto", dia: "Lunes", consultorio: 228, hora: "17h00-19h00" },
      { especialidad: "NEFROLOGÍA", medico: "Chediak Cristina", dia: "Lunes", consultorio: 227, hora: "16h00-19h00" },
    ]

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


