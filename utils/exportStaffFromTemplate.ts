// src/utils/exportStaffFromTemplate.ts
export type StaffItem = {
  especialidad: string;
  medico: string;
  dia: string;
  consultorio: string | number | null;
  hora: string;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportAsCsv(items: StaffItem[]) {
  const headers = [
    "ESPECIALIDAD", "MÉDICO", "DÍA", "CONSULTORIO", "HORA",
    "",
    "ESPECIALIDAD", "MÉDICO", "DÍA", "CONSULTORIO", "HORA"
  ]

  const half = Math.ceil(items.length / 2)
  const left = items.slice(0, half)
  const right = items.slice(half)

  const maxRows = Math.max(left.length, right.length)
  const csvRows: string[] = [headers.join(",")]

  for (let i = 0; i < maxRows; i++) {
    const L = left[i]
    const R = right[i]
    const l = L ? [
      `"${L.especialidad}"`,
      `"${L.medico}"`,
      `"${L.dia}"`,
      `"${L.consultorio ?? ""}"`,
      `"${L.hora}"`,
    ] : ["", "", "", "", ""]
    const r = R ? [
      `"${R.especialidad}"`,
      `"${R.medico}"`,
      `"${R.dia}"`,
      `"${R.consultorio ?? ""}"`,
      `"${R.hora}"`,
    ] : ["", "", "", "", ""]
    csvRows.push([...l, "", ...r].join(","))
  }

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" })
  downloadBlob(blob, `STAFF_${new Date().toISOString().split("T")[0]}.csv`)
}

export async function exportStaffFromTemplate(items: StaffItem[]) {
  try {
    // Importación dinámica solo en cliente para evitar SSR
    let ExcelJS: any
    try {
      ExcelJS = (await import("exceljs")).default
    } catch {
      // Intentar con el build para navegador
      try {
        ExcelJS = (await import("exceljs/dist/exceljs.min.js")).default
      } catch (e) {
        throw e
      }
    }

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet("STAFF")

    ws.columns = [
      { header: "ESPECIALIDAD", key: "especialidad" },
      { header: "MÉDICOS", key: "medico" },
      { header: "DÍA", key: "dia" },
      { header: "CONSULTORIO", key: "consultorio" },
      { header: "HORA", key: "hora" },
    ]

    ws.addRows(items)

    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    downloadBlob(blob, "STAFF.xlsx")
  } catch (error) {
    console.warn("Fallo ExcelJS, exportando como CSV. Detalle:", error)
    exportAsCsv(items)
  }
}
