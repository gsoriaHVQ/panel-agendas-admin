import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { AGENDA_TYPES, DAYS_NAMES, DAYS_OF_WEEK } from './constants'

// Función cn para combinar clases de Tailwind CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Funciones helper para el campo TIPO
export const decodeTipo = (tipoBackend: string): "Consulta" | "Procedimiento" => {
  if (!tipoBackend) return "Consulta"
  const t = tipoBackend.trim().toUpperCase()
  return t.startsWith(AGENDA_TYPES.CONSULTA) ? "Consulta" : "Procedimiento"
}

export const encodeTipo = (tipoTexto: "Consulta" | "Procedimiento"): string => {
  return tipoTexto === "Consulta" ? AGENDA_TYPES.CONSULTA : AGENDA_TYPES.PROCEDIMIENTO
}

// Función para obtener el nombre del día desde el código
export const getDayName = (codigoDia: number): string => {
  return DAYS_NAMES[codigoDia as keyof typeof DAYS_NAMES] || 'Sin día'
}

// Función para mapear nombre del día a código
export const mapDayToCode = (dia: string): number => {
  const dayMap: { [key: string]: number } = {
    'Lunes': DAYS_OF_WEEK.LUNES,
    'Martes': DAYS_OF_WEEK.MARTES,
    'Miércoles': DAYS_OF_WEEK.MIERCOLES,
    'Jueves': DAYS_OF_WEEK.JUEVES,
    'Viernes': DAYS_OF_WEEK.VIERNES,
    'Sábado': DAYS_OF_WEEK.SABADO,
    'Domingo': DAYS_OF_WEEK.DOMINGO,
  }
  return dayMap[dia] || DAYS_OF_WEEK.LUNES
}

// Formatear horas desde diferentes formatos de BD SIN usar Date/TZ (tratamiento "naive")
export const formatTime = (horaString: string): string => {
  if (!horaString) {
    return ''
  }

  const raw = String(horaString).trim()

  // 1) HH:MM directo
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [h, m] = raw.split(':')
    return `${String(h).padStart(2, '0')}:${m}`
  }

  // 2) YYYY-MM-DD[ T]HH:MM[:SS]
  const fechaHora = raw.match(/^\d{4}-\d{2}-\d{2}[ T](\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (fechaHora) {
    const h = fechaHora[1]
    const m = fechaHora[2]
    return `${String(h).padStart(2, '0')}:${m}`
  }

  // 3) ISO con T (ignorando TZ), extraer solo HH:MM
  const isoMatch = raw.match(/T(\d{2}):(\d{2})/)
  if (isoMatch) {
    return `${isoMatch[1]}:${isoMatch[2]}`
  }

  // 4) Cualquier otra cadena que contenga HH:MM
  const anyMatch = raw.match(/(\d{1,2}):(\d{2})/)
  if (anyMatch) {
    return `${String(anyMatch[1]).padStart(2, '0')}:${anyMatch[2]}`
  }

  return ''
}

// Formato requerido por backend: "YYYY-MM-DD HH:MM"
export const formatTimeForBackend = (horaString: string): string => {
  if (!horaString) {
    return '1900-01-01 00:00'
  }
  
  // Si ya viene en formato completo de fecha, extraer solo la hora y usar fecha fija
  if (horaString.includes('-') && horaString.includes(' ')) {
    const partes = horaString.split(' ')
    if (partes.length === 2) {
      const horaParte = partes[1]
      return `1900-01-01 ${horaParte}`
    }
  }
  
  // Si viene solo en formato HH:MM, agregar fecha fija
  if (horaString.match(/^\d{1,2}:\d{2}$/)) {
    const [horas, minutos] = horaString.split(':')
    return `1900-01-01 ${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
  }
  
  return `1900-01-01 ${horaString}`
}

// Función para obtener fecha actual en formato YYYY-MM-DD
export const getTodayDateString = (): string => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Función para generar ID único
export const generateUniqueId = (): string => {
  return `new-${Date.now()}`
}

// Función para validar formato de hora
export const isValidTimeFormat = (time: string): boolean => {
  return /^\d{1,2}:\d{2}$/.test(time)
}

// Función para ordenar arrays por nombre
export const sortByName = <T extends { nombres?: string; descripcion?: string }>(array: T[]): T[] => {
  return [...array].sort((a, b) => {
    const nameA = a.nombres || a.descripcion || ''
    const nameB = b.nombres || b.descripcion || ''
    return nameA.localeCompare(nameB)
  })
}

// Función para filtrar arrays por texto
export const filterByText = <T extends Record<string, any>>(
  array: T[], 
  searchText: string, 
  fields: (keyof T)[]
): T[] => {
  if (!searchText) return array
  
  const lowerSearchText = searchText.toLowerCase()
  return array.filter(item => 
    fields.some(field => {
      const value = item[field]
      return value && String(value).toLowerCase().includes(lowerSearchText)
    })
  )
}
