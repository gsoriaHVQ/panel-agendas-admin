// Tipos base para datos del backend
export interface Doctor {
  id: number
  nombres: string
  especialidades?: Especialidad[]
}

export interface Agenda {
  codigo_agenda: number
  codigo_prestador: number
  codigo_consultorio: number
  codigo_item_agendamiento: number
  codigo_dia: number
  hora_inicio: string
  hora_fin: string
  tipo: string
  estado?: string
}

export interface Edificio {
  codigo_edificio?: number
  descripcion_edificio?: string
}

export interface Consultorio {
  codigo_consultorio: number
  codigo_edificio: number
  codigo_piso: number
  descripcion_consultorio?: string
  DES_CONSULTORIO?: string
}

export interface Especialidad {
  especialidadId: number
  descripcion: string
}

// Tipos para la interfaz de usuario
export interface CombinedRecord {
  id: string
  doctorId: number
  agendaId: number
  nombre: string
  especialidad: string
  tipo: "Consulta" | "Procedimiento"
  codigoItemAgendamiento: number
  edificio: string
  piso: string
  codigoConsultorio?: number
  consultorioDescripcion?: string
  dia: string
  horaInicio: string
  horaFin: string
  estado: string
  procedimiento: string
  isEditing: boolean
}

export interface Filters {
  especialidad: string
  edificio: string
  tipo: string
  search: string
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
}

// Tipos para props de componentes
export interface MedicalDashboardProps {
  onLogout?: () => void
}

export interface TableRowProps {
  record: CombinedRecord
  onEdit: (id: string) => void
  onSave: (id: string) => void
  onCancel: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (record: CombinedRecord) => void
  onFieldChange: (id: string, field: keyof CombinedRecord, value: string | number) => void
  onKeyDown: (event: React.KeyboardEvent, recordId: string) => void
  openPopovers: { [key: string]: boolean }
  togglePopover: (key: string) => void
  closePopover: (key: string) => void
  doctors: Doctor[]
  specialties: Especialidad[]
  buildings: Edificio[]
  consultorios: Consultorio[]
  getDoctorsBySpecialty: (especialidad: string) => Doctor[]
  getAvailableFloors: (edificio: string) => string[]
  getDefaultBuildingFloors: () => string[]
}

export interface FilterSectionProps {
  filters: Filters
  onFilterChange: (key: keyof Filters, value: string) => void
  onClearFilters: () => void
  specialties: Especialidad[]
  buildings: Edificio[]
  filteredRecords: CombinedRecord[]
  records: CombinedRecord[]
  paginatedRecords: CombinedRecord[]
}

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export interface ActionButtonsProps {
  record: CombinedRecord
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
  onDuplicate: () => void
}

// Tipos para estados de carga
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
export type ConnectionState = 'connected' | 'disconnected' | 'checking'

// Tipos para respuestas de API
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  total?: number
}

// Tipos para payloads de API
export interface AgendaPayload {
  codigo_prestador: number
  codigo_consultorio: number
  codigo_item_agendamiento: number
  codigo_dia: number
  hora_inicio: string
  hora_fin: string
  tipo: string
  codigo_agenda?: number
}
