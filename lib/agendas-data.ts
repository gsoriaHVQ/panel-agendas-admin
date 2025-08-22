// Mock data for Hospital Vozandes Quito medical scheduling system

export interface Especialidad {
  especialidadId: number
  descripcion: string
  tipo?: string
  icono?: string
}

export interface Doctor {
  id: number
  nombres: string
  retrato?: string
  especialidades: Array<{
    especialidadId: number
    descripcion: string
    tipo: string
  }>
  // Campos legacy para compatibilidad
  nombre?: string
  especialidad?: string
  codigo_item?: string
  estadisticas?: {
    pacientes: number
  }
}

export interface Agenda {
  codigo_agenda: number
  codigo_consultorio: number
  codigo_prestador: number
  codigo_item_agendamiento: number
  codigo_dia: number
  hora_inicio: string
  hora_fin: string
  tipo: string // "C" = Consulta, "P" = Procedimiento
  // Campos legacy para compatibilidad
  id?: number
  edificio?: string
  piso?: string
  dia?: string
  horaInicio?: string
  horaFin?: string
  estado?: "Activa" | "Inactiva" | "Cancelada"
  procedimiento?: string
}

export interface Edificio {
  // Soporte para estructura nueva del backend
  codigo_edificio?: number
  descripcion_edificio?: string
  // Soporte legacy para mocks/compatibilidad
  codigo?: string
  nombre?: string
  descripcion?: string
  pisos?: string[]
}

/* export const mockDoctors: Doctor[] = [
  {
    id: 1,
    nombres: "Dr. Juan Pérez",
    especialidades: [{ especialidadId: 1, descripcion: "Cardiología", tipo: "AMBULATORY" }],
    estadisticas: { pacientes: 25 },
  },
  {
    id: 2,
    nombres: "Dra. María Torres",
    especialidades: [{ especialidadId: 2, descripcion: "Pediatría", tipo: "AMBULATORY" }],
    estadisticas: { pacientes: 18 },
  },
  {
    id: 3,
    nombres: "Dr. Carlos Mendoza",
    especialidades: [{ especialidadId: 3, descripcion: "Neurología", tipo: "AMBULATORY" }],
    estadisticas: { pacientes: 32 },
  },
  {
    id: 4,
    nombres: "Dra. Ana Rodríguez",
    especialidades: [{ especialidadId: 4, descripcion: "Ginecología", tipo: "AMBULATORY" }],
    estadisticas: { pacientes: 28 },
  },
]

export const mockAgendas: Agenda[] = [
  {
    codigo_agenda: 101,
    codigo_consultorio: 1,
    codigo_prestador: 1,
    codigo_item_agendamiento: 1,
    codigo_dia: 1,
    hora_inicio: "2025-01-01T08:00:00.000Z",
    hora_fin: "2025-01-01T12:00:00.000Z",
    tipo: "C",
  },
  {
    codigo_agenda: 102,
    codigo_consultorio: 2,
    codigo_prestador: 2,
    codigo_item_agendamiento: 2,
    codigo_dia: 2,
    hora_inicio: "2025-01-01T09:00:00.000Z",
    hora_fin: "2025-01-01T11:00:00.000Z",
    tipo: "P",
  },
  {
    codigo_agenda: 103,
    codigo_consultorio: 1,
    codigo_prestador: 3,
    codigo_item_agendamiento: 3,
    codigo_dia: 3,
    hora_inicio: "2025-01-01T14:00:00.000Z",
    hora_fin: "2025-01-01T18:00:00.000Z",
    tipo: "C",
  },
  {
    codigo_agenda: 104,
    codigo_consultorio: 2,
    codigo_prestador: 4,
    codigo_item_agendamiento: 4,
    codigo_dia: 4,
    hora_inicio: "2025-01-01T10:00:00.000Z",
    hora_fin: "2025-01-01T12:00:00.000Z",
    tipo: "P",
  },
]

export const mockEdificios: Edificio[] = [
  {
    codigo_edificio: 1,
    descripcion_edificio: "HOSPITAL PRINCIPAL",
    pisos: ["Piso 0", "Piso 1", "Piso 2", "Piso 3", "Piso 4"],
  },
  {
    codigo_edificio: 2,
    descripcion_edificio: "BLESS",
    pisos: ["Piso 0", "Piso 1", "Piso 2", "Piso 3", "Piso 4", "Piso 5", "Piso 6", "Piso 7"],
  },
]
*/
export const especialidades = [
  "Cardiología",
  "Pediatría",
  "Neurología",
  "Ginecología",
  "Traumatología",
  "Dermatología",
  "Oftalmología",
  "Otorrinolaringología",
]
