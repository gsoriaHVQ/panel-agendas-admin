export type StaffItem = {
  especialidad: string
  medico: string
  dia: string
  edificio: string
  piso: string
  consultorio: string | number | null
  horaInicio: string
  horaFin: string
  tipo: string
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
    // @ts-ignore - Dynamic import for client-side only
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

  // Título A1:I1 (más pequeño)
  const titleText = options.title || "STAFF DE MÉDICOS"
  ws.mergeCells("A1:I1")
  const titleCell = ws.getCell("A1")
  titleCell.value = titleText
  titleCell.font = { name: "Calibri", size: 36, bold: true } // Tamaño más pequeño
  titleCell.alignment = { horizontal: "center" }
  ws.getRow(1).height = 50 // Altura más pequeña
  
  // Agregar borde al título
  titleCell.border = {
    top: { style: "medium", color: { argb: "FF000000" } },
    left: { style: "medium", color: { argb: "FF000000" } },
    bottom: { style: "medium", color: { argb: "FF000000" } },
    right: { style: "medium", color: { argb: "FF000000" } }
  }

  // Encabezados fila 2 (todas las nuevas columnas)
  const headers = ["ESPECIALIDAD", "NOMBRE DEL MÉDICO", "DÍA", "EDIFICIO", "PISO", "CONSULTORIO", "HORA INICIO", "HORA FIN", "TIPO DE AGENDA"]
  const writeHeaderBlock = (startCol: number) => {
    headers.forEach((text, idx) => {
      const cell = ws.getCell(2, startCol + idx)
      cell.value = text
      cell.font = { name: "Calibri", bold: true, color: { argb: COLOR_HEADER_FONT } }
      cell.alignment = { horizontal: "center" }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER } }
      
      // Agregar bordes a los headers
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } }
      }
    })
  }
  // Solo un bloque A:I (sin duplicación)
  writeHeaderBlock(1)

  // Anchos de columnas ajustados para 9 columnas
  ws.getColumn(1).width = 30 // A - Especialidad
  ws.getColumn(2).width = 40 // B - Nombre del Médico (mismo tamaño que especialidad)
  ws.getColumn(3).width = 12 // C - Día
  ws.getColumn(4).width = 18 // D - Edificio
  ws.getColumn(5).width = 12 // E - Piso
  ws.getColumn(6).width = 15 // F - Consultorio
  ws.getColumn(7).width = 15 // G - Hora Inicio
  ws.getColumn(8).width = 15 // H - Hora Fin
  ws.getColumn(9).width = 20 // I - Tipo de Agenda

  // Datos en una sola columna (sin división)
  const startRow = 3
  const maxCleanupRow = 500

  const writeDataBlock = (startCol: number, rows: StaffItem[]) => {
    rows.forEach((it, i) => {
      const r = startRow + i
      const cEsp = ws.getCell(r, startCol + 0) // A - Especialidad
      const cMed = ws.getCell(r, startCol + 1) // B - Nombre del Médico
      const cDia = ws.getCell(r, startCol + 2) // C - Día
      const cEdi = ws.getCell(r, startCol + 3) // D - Edificio
      const cPis = ws.getCell(r, startCol + 4) // E - Piso
      const cCon = ws.getCell(r, startCol + 5) // F - Consultorio
      const cHorI = ws.getCell(r, startCol + 6) // G - Hora Inicio
      const cHorF = ws.getCell(r, startCol + 7) // H - Hora Fin
      const cTipo = ws.getCell(r, startCol + 8) // I - Tipo

      cEsp.value = it.especialidad ?? ""
      cMed.value = it.medico ?? ""
      cDia.value = it.dia ?? ""
      cEdi.value = it.edificio ?? ""
      cPis.value = it.piso ?? ""
      cCon.value = it.consultorio ?? ""
      cHorI.value = it.horaInicio ?? ""
      cHorF.value = it.horaFin ?? ""
      cTipo.value = it.tipo ?? ""

      // Agregar bordes a todas las celdas
      const allCells = [cEsp, cMed, cDia, cEdi, cPis, cCon, cHorI, cHorF, cTipo]
      allCells.forEach((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } }
        }
      })

      // Fondo rosado claro por defecto en columnas de texto
      ;[cEsp, cMed, cDia, cEdi, cPis, cTipo].forEach((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_BODY_LIGHT } }
      })

      // CONSULTORIO y HORAS con fondo granate y texto blanco
      ;[cCon, cHorI, cHorF].forEach((cell) => {
        cell.alignment = { horizontal: "center" }
        cell.font = { color: { argb: COLOR_HEADER_FONT } }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER } }
      })
    })
  }

  // Escribir solo un bloque A:I (col 1)
  writeDataBlock(1, items)

  // Limpiar celdas sobrantes (A..I hasta fila 500)
  const lastUsedRow = startRow + items.length - 1
  const columnsToClean = ["A","B","C","D","E","F","G","H","I"]
  for (let r = Math.max(lastUsedRow + 1, startRow); r <= maxCleanupRow; r++) {
    columnsToClean.forEach((col) => {
      ws.getCell(`${col}${r}`).value = null
    })
  }

  return wb.xlsx.writeBuffer()
}


