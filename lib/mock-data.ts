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
  tipo: number // 1 = Consulta, otro = Procedimiento
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
  codigo: string
  nombre: string
  descripcion?: string
  pisos: string[]
}

export const mockDoctors: Doctor[] = [
  {
    id: 1,
    nombre: "Dr. Juan Pérez",
    especialidad: "Cardiología",
    codigo_item: "MED001",
    estadisticas: { pacientes: 25 },
  },
  {
    id: 2,
    nombre: "Dra. María Torres",
    especialidad: "Pediatría",
    codigo_item: "MED002",
    estadisticas: { pacientes: 18 },
  },
  {
    id: 3,
    nombre: "Dr. Carlos Mendoza",
    especialidad: "Neurología",
    codigo_item: "MED003",
    estadisticas: { pacientes: 32 },
  },
  {
    id: 4,
    nombre: "Dra. Ana Rodríguez",
    especialidad: "Ginecología",
    codigo_item: "MED004",
    estadisticas: { pacientes: 28 },
  },
]

export const mockAgendas: Agenda[] = [
  {
    id: 101,
    codigo_prestador: "MED001",
    tipo: "Consulta",
    edificio: "Hospital Principal",
    piso: "Planta Baja",
    dia: "Lunes",
    horaInicio: "08:00",
    horaFin: "12:00",
    estado: "Activa",
  },
  {
    id: 102,
    codigo_prestador: "MED002",
    tipo: "Procedimiento",
    edificio: "Bless",
    piso: "3",
    dia: "Martes",
    horaInicio: "09:00",
    horaFin: "11:00",
    estado: "Activa",
    procedimiento: "Ecocardiograma",
  },
  {
    id: 103,
    codigo_prestador: "MED003",
    tipo: "Consulta",
    edificio: "Hospital Principal",
    piso: "2",
    dia: "Miércoles",
    horaInicio: "14:00",
    horaFin: "18:00",
    estado: "Activa",
  },
  {
    id: 104,
    codigo_prestador: "MED004",
    tipo: "Procedimiento",
    edificio: "Bless",
    piso: "5",
    dia: "Jueves",
    horaInicio: "10:00",
    horaFin: "12:00",
    estado: "Activa",
    procedimiento: "Laparoscopía",
  },
]

export const mockEdificios: Edificio[] = [
  {
    codigo: "HOSP",
    nombre: "Hospital Principal",
    pisos: ["Planta Baja", "1", "2", "3", "4"],
  },
  {
    codigo: "BLESS",
    nombre: "Bless",
    pisos: ["Planta Baja", "1", "2", "3", "4", "5", "6", "7"],
  },
]

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
