// Paleta de colores HVQ (Hospital Vozandes Quito)
export const COLORS = {
  // Color predominante
  PRIMARY: '#7F0C43',
  
  // Tonos complementarios
  SECONDARY: '#C84D80',
  SECONDARY_HOVER: '#B8437A',
  PRIMARY_HOVER: '#6A0A38',
  
  // Fondos
  BACKGROUND: '#F9F4F6',
  WHITE: '#FFFFFF',
  
  // Bordes y contenedores
  BORDER: '#E5E5E5',
  BORDER_LIGHT: '#F8F9FA',
  
  // Textos
  TEXT_DARK: '#333333',
  TEXT_LIGHT: '#FFFFFF',
  TEXT_MUTED: '#666666',
  
  // Estados
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
} as const

// Constantes de la aplicación
export const APP_CONFIG = {
  ITEMS_PER_PAGE: 10,
  DEFAULT_BUILDING_ID: 2,
  DEFAULT_BUILDING_NAME: 'Hospital Principal',
} as const

// Tipos de agenda
export const AGENDA_TYPES = {
  CONSULTA: 'C',
  PROCEDIMIENTO: 'P',
} as const

// Días de la semana
export const DAYS_OF_WEEK = {
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
  DOMINGO: 7,
} as const

export const DAYS_NAMES = {
  [DAYS_OF_WEEK.LUNES]: 'Lunes',
  [DAYS_OF_WEEK.MARTES]: 'Martes',
  [DAYS_OF_WEEK.MIERCOLES]: 'Miércoles',
  [DAYS_OF_WEEK.JUEVES]: 'Jueves',
  [DAYS_OF_WEEK.VIERNES]: 'Viernes',
  [DAYS_OF_WEEK.SABADO]: 'Sábado',
  [DAYS_OF_WEEK.DOMINGO]: 'Domingo',
} as const

// Estados de carga
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const

// Estados de conexión
export const CONNECTION_STATES = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CHECKING: 'checking',
} as const
