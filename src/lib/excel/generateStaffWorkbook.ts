export type StaffItem = {
  especialidad: string
  medico: string
  dia: string
  consultorio: string | number | null
  hora: string
}

export type GenerateOptions = {
  rowsPerColumn?: number
  sheetName?: string
  title?: string
}

// Genera un workbook en memoria (importación dinámica de exceljs solo en cliente)
async function loadExcelJSFromCDN(): Promise<any> {
  if (typeof window === 'undefined') throw new Error('Solo disponible en cliente')
  // Reusar si ya está cargado
  const w = window as any
  if (w.ExcelJS) return w.ExcelJS
  // Cargar script de CDN
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('No se pudo cargar ExcelJS desde CDN'))
    document.head.appendChild(s)
  })
  const w2 = window as any
  if (!w2.ExcelJS) throw new Error('ExcelJS no disponible tras cargar CDN')
  return w2.ExcelJS
}

export async function generateStaffWorkbook(
  items: StaffItem[],
  options: GenerateOptions = {}
): Promise<ArrayBuffer> {
  // Importación dinámica compatible con Next (cliente)
  let ExcelJS: any
  try {
    ExcelJS = (await import("exceljs")).default
  } catch {
    // Fallback a CDN del bundle navegador
    ExcelJS = await loadExcelJSFromCDN()
  }

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(options.sheetName || "STAFF 2025")

  // Colores base
  const COLOR_HEADER = "FF7F0C43" // granate
  const COLOR_HEADER_FONT = "FFFFFFFF" // blanco
  const COLOR_BODY_LIGHT = "FFF9F4F6" // rosado claro

  // Título A1:K1
  const titleText = options.title || "STAFF DE MÉDICOS CONSULTA EXTERNA"
  ws.mergeCells("A1:K1")
  const titleCell = ws.getCell("A1")
  titleCell.value = titleText
  titleCell.font = { name: "Calibri", size: 72, bold: true }
  titleCell.alignment = { horizontal: "center" }
  ws.getRow(1).height = 93

  // Encabezados fila 2
  const headers = ["ESPECIALIDAD", "MÉDICOS ", "DÍA", "CONSULTORIO", "HORA"]
  const writeHeaderBlock = (startCol: number) => {
    headers.forEach((text, idx) => {
      const cell = ws.getCell(2, startCol + idx)
      cell.value = text
      cell.font = { name: "Calibri", bold: true, color: { argb: COLOR_HEADER_FONT } }
      cell.alignment = { horizontal: "center" }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER } }
    })
  }
  // Bloque izquierdo A:E (1..5), separador F (6), bloque derecho G:K (7..11)
  writeHeaderBlock(1)
  writeHeaderBlock(7)

  // Anchos de columnas
  ws.getColumn(1).width = 75.71 // A
  ws.getColumn(4).width = 30.71 // D
  ws.getColumn(5).width = 30.86 // E
  ws.getColumn(6).width = 5.14 // F separador
  ws.getColumn(7).width = 75.71 // G
  ws.getColumn(10).width = 30.86 // J
  // El resto puede quedar por defecto o con un ancho suave

  // Distribución de datos
  const startRow = 3
  const maxCleanupRow = 500
  let leftRows: StaffItem[] = []
  let rightRows: StaffItem[] = []

  if (options.rowsPerColumn && options.rowsPerColumn > 0) {
    leftRows = items.slice(0, options.rowsPerColumn)
    rightRows = items.slice(options.rowsPerColumn)
  } else {
    const half = Math.ceil(items.length / 2)
    leftRows = items.slice(0, half)
    rightRows = items.slice(half)
  }

  const writeDataBlock = (startCol: number, rows: StaffItem[]) => {
    rows.forEach((it, i) => {
      const r = startRow + i
      const cEsp = ws.getCell(r, startCol + 0)
      const cMed = ws.getCell(r, startCol + 1)
      const cDia = ws.getCell(r, startCol + 2)
      const cCon = ws.getCell(r, startCol + 3)
      const cHor = ws.getCell(r, startCol + 4)

      cEsp.value = it.especialidad ?? ""
      cMed.value = it.medico ?? ""
      cDia.value = it.dia ?? ""
      cCon.value = it.consultorio ?? ""
      cHor.value = it.hora ?? ""

      // Fondo rosado claro por defecto en columnas de texto
      ;[cEsp, cMed, cDia].forEach((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_BODY_LIGHT } }
      })

      // CONSULTORIO y HORA con fondo granate y texto blanco
      ;[cCon, cHor].forEach((cell) => {
        cell.alignment = { horizontal: "center" }
        cell.font = { color: { argb: COLOR_HEADER_FONT } }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER } }
      })
    })
  }

  // Escribir bloques: izquierdo A:E (col 1), derecho G:K (col 7)
  writeDataBlock(1, leftRows)
  writeDataBlock(7, rightRows)

  // Limpiar celdas sobrantes (A..E y G..K hasta fila 500)
  const lastUsedRow = startRow + Math.max(leftRows.length, rightRows.length) - 1
  const columnsToClean = ["A","B","C","D","E","G","H","I","J","K"]
  for (let r = Math.max(lastUsedRow + 1, startRow); r <= maxCleanupRow; r++) {
    columnsToClean.forEach((col) => {
      ws.getCell(`${col}${r}`).value = null
    })
  }

  return wb.xlsx.writeBuffer()
}


