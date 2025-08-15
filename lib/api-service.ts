// API Service for Hospital Vozandes Quito Medical Scheduling System
// Conectado al backend real en puerto 3001

import type { Doctor, Agenda, Edificio } from "./mock-data"

// Configuración para conectar con el backend real
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://10.129.180.151:3001',
  TIMEOUT: 30000, // 30 segundos
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

// API Response types
interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

class ApiService {
  private baseURL: string

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  // Método helper para hacer requests al backend real
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const config: RequestInit = {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...options.headers
      },
      ...options
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // No lanzar excepción: devolver un objeto de error controlado
        const errorData = await response
          .json()
          .catch(async () => ({ message: await response.text().catch(() => "") }))

        return {
          data: null as T,
          success: false,
          message: (errorData as any)?.message || `HTTP error ${response.status}`,
        }
      }

      // Intentar parsear JSON; si falla, devolver texto como data
      let data: any
      try {
        data = await response.json()
      } catch {
        data = await response.text().catch(() => null)
      }
      
      // Log para debug
      console.log(`API Response for ${endpoint}:`, data)

      return {
        data,
        success: true
      }
    } catch (error) {
      // Suavizar logging para evitar ruido en consola
      console.warn(`API Error (${endpoint}):`, error)
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          data: null as T,
          success: false,
          message: 'Request timeout'
        }
      }

      return {
        data: null as T,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ===== ENDPOINTS DE INFORMACIÓN =====
  
  async getApiInfo(): Promise<ApiResponse<any>> {
    return this.request<any>('/')
  }

  async getHealth(): Promise<ApiResponse<any>> {
    return this.request<any>('/health')
  }

  // ===== ENDPOINTS DE MÉDICOS =====
  
  async getDoctors(): Promise<ApiResponse<Doctor[]>> {
    return this.request<Doctor[]>('/api/medicos')
  }

  async getSpecialties(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('/api/medicos/especialidades')
  }

  async getDoctorsBySpecialty(especialidad: string): Promise<ApiResponse<Doctor[]>> {
    return this.request<Doctor[]>(`/api/medicos/especialidad/${encodeURIComponent(especialidad)}`)
  }

  async getDoctorByCode(codigo: string): Promise<ApiResponse<Doctor>> {
    return this.request<Doctor>(`/api/medicos/item/${encodeURIComponent(codigo)}`)
  }

  async getDoctorByName(nombre: string): Promise<ApiResponse<Doctor[]>> {
    return this.request<Doctor[]>(`/api/medicos/nombre/${encodeURIComponent(nombre)}`)
  }

  async getDoctorStats(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/medicos/estadisticas')
  }

  // ===== ENDPOINTS DE AGENDAS =====
  
  async getAgendas(filtros: {
    page?: number
    limit?: number
    fecha_inicio?: string
    fecha_fin?: string
    estado?: string
  } = {}): Promise<ApiResponse<Agenda[]>> {
    // Usar el endpoint correcto según tu configuración
    const endpoint = '/api/agnd-agenda'
    return this.request<Agenda[]>(endpoint)
  }

  async getAgenda(id: number): Promise<ApiResponse<Agenda>> {
    return this.request<Agenda>(`/api/agnd-agenda/${id}`)
  }

  async getAgendasByProvider(codigo: string): Promise<ApiResponse<Agenda[]>> {
    return this.request<Agenda[]>(`/api/agnd-agenda?codigo_prestador=${encodeURIComponent(codigo)}`)
  }

  async createAgenda(agenda: any): Promise<ApiResponse<Agenda>> {
    return this.request<Agenda>('/api/agnd-agenda', {
      method: 'POST',
      body: JSON.stringify(agenda)
    })
  }

  async updateAgenda(id: number, agenda: any): Promise<ApiResponse<Agenda>> {
    return this.request<Agenda>(`/api/agnd-agenda/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agenda)
    })
  }

  async cancelAgenda(id: number): Promise<ApiResponse<Agenda>> {
    return this.request<Agenda>(`/api/agnd-agenda/${id}/cancelar`, {
      method: 'PUT'
    })
  }

  async deleteAgenda(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/agnd-agenda/${id}`, {
      method: 'DELETE'
    })
  }

  async getAgendaStats(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/agnd-agenda/estadisticas')
  }

  // ===== ENDPOINTS DE CATÁLOGOS =====
  
  async getConsultorios(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/catalogos/consultorios')
  }

  async getDays(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/catalogos/dias')
  }

  async getBuildings(): Promise<ApiResponse<Edificio[]>> {
    return this.request<Edificio[]>('/api/catalogos/edificios')
  }

  async getBuildingFloors(codigo: string): Promise<ApiResponse<string[]>> {
    return this.request<string[]>(`/api/catalogos/edificios/${encodeURIComponent(codigo)}/pisos`)
  }

  // ===== ENDPOINTS DE AGENDA PERSONALIZADA =====
  
  async getCustomAgendas(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/agnd-agenda')
  }

  async getCustomAgenda(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/agnd-agenda/${id}`)
  }

  async createCustomAgenda(agenda: any): Promise<ApiResponse<any>> {
    return this.request<any>('/api/agnd-agenda', {
      method: 'POST',
      body: JSON.stringify(agenda)
    })
  }

  async updateCustomAgenda(id: number, agenda: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/agnd-agenda/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agenda)
    })
  }

  async deleteCustomAgenda(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/agnd-agenda/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== ENDPOINTS DE SERVICIOS EXTERNOS =====
  
  async getExternalDoctors(): Promise<ApiResponse<Doctor[]>> {
    return this.request<Doctor[]>('/api/external/medicos')
  }

  async getAuthStatus(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/external/auth/status')
  }

  async getExternalConfig(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/external/config')
  }
}

export const apiService = new ApiService()
