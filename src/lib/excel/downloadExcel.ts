export function downloadExcel(buffer: ArrayBuffer, filename = "STAFF.xlsx") {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  // Safari/iOS: asegurar que se ejecute tras interacción de usuario (onClick)
  a.click()
  URL.revokeObjectURL(url)
}


