"use client"

import { useState, useEffect, useCallback } from "react"
import { apiService } from "@/lib/api-service"
import type { Doctor, Agenda, Edificio, Especialidad } from "@/lib/mock-data"
import { mockDoctors, mockAgendas, mockEdificios, especialidades } from "@/lib/mock-data"

// Estados de carga
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// Hook personalizado para usar la API del backend real
export function useBackendAPI() {
  const [loading, setLoading] = useState<LoadingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

  // Verificar conexión con el backend
  const checkConnection = useCallback(async () => {
    try {
      setConnectionStatus('checking')
      console.log('Verificando conexion con el backend...')
      const healthCheck = await apiService.getHealth()
      
      if (healthCheck.success) {
        setConnectionStatus('connected')
        setError(null)
        console.log('Conexion exitosa con el backend')
        console.log('Datos del servidor:', healthCheck.data)
      } else {
        setConnectionStatus('disconnected')
        setError('No se pudo conectar con el backend')
        console.error('Error de conexion:', healthCheck.message)
      }
    } catch (err) {
      setConnectionStatus('disconnected')
      setError('Error de conexión con el backend')
      console.error('Error de conexion:', err)
    }
  }, [])

  // Verificar conexión al montar el componente
  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  // ===== MÉDICOS =====
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [specialties, setSpecialties] = useState<Especialidad[]>([])

  const loadDoctors = useCallback(async () => {
    setLoading('loading')
    console.log('Cargando medicos desde el backend...')
    try {
      const result = await apiService.getDoctors()
      if (result.success) {
        // El backend devuelve {success: true, data: [...], total: X}
        console.log('Estructura completa de result.data para medicos:', result.data)
        const rawData = result.data?.data || result.data
        const doctorsData = Array.isArray(rawData) ? rawData : []
        setDoctors(doctorsData)
        setError(null)
        setLoading('success')
        console.log(`Medicos cargados: ${doctorsData.length} registros`)
        console.log('Primeros 3 medicos:', doctorsData.slice(0, 3))
        console.log('Estructura del primer medico:', doctorsData[0])
      } else {
        // Fallback a datos mock si el backend falla
        console.warn('Usando datos mock para medicos')
        setDoctors(mockDoctors)
        setError(null)
        setLoading('success')
      }
    } catch (err) {
      // Fallback a datos mock si hay error de conexión
      console.warn('Error de conexion, usando datos mock para medicos')
      setDoctors(mockDoctors)
      setError(null)
      setLoading('success')
    }
  }, [])

  const loadSpecialties = useCallback(async () => {
    setLoading('loading')
    console.log('Cargando especialidades desde el backend...')
    try {
      const result = await apiService.getSpecialties()
      if (result.success) {
        // El backend devuelve {success: true, data: [...], total: X}
        console.log('Estructura completa de result.data para especialidades:', result.data)
        const rawData = result.data?.data || result.data
        const dataArray = Array.isArray(rawData) ? rawData : []
        // Guardar objetos completos de especialidades con especialidadId y descripcion
        const specialtiesData = dataArray.filter((esp: any) => esp.especialidadId && esp.descripcion)
        setSpecialties(specialtiesData)
        setError(null)
        setLoading('success')
        console.log(`Especialidades cargadas: ${specialtiesData.length} registros`)
        console.log('Primeras 3 especialidades:', specialtiesData.slice(0, 3))
        console.log('Estructura de especialidad:', specialtiesData[0])
      } else {
        // Fallback a datos mock si el backend falla
        console.warn('Usando datos mock para especialidades')
        setSpecialties(especialidades)
        setError(null)
        setLoading('success')
      }
    } catch (err) {
      // Fallback a datos mock si hay error de conexión
      console.warn('Error de conexion, usando datos mock para especialidades')
      setSpecialties(especialidades)
      setError(null)
      setLoading('success')
    }
  }, [])

  const getDoctorsBySpecialty = useCallback(async (especialidad: string) => {
    setLoading('loading')
    try {
      const result = await apiService.getDoctorsBySpecialty(especialidad)
      if (result.success) {
        const rawData = result.data?.data || result.data
        const doctorsData = Array.isArray(rawData) ? rawData : []
        setDoctors(doctorsData)
        setError(null)
        setLoading('success')
      } else {
        setError(result.message || 'Error al filtrar médicos')
        setLoading('error')
      }
    } catch (err) {
      setError('Error al filtrar médicos')
      setLoading('error')
    }
  }, [])

  // ===== AGENDAS =====
  const [agendas, setAgendas] = useState<Agenda[]>([])

  const loadAgendas = useCallback(async (filtros?: {
    page?: number
    limit?: number
    fecha_inicio?: string
    fecha_fin?: string
    estado?: string
  }) => {
    setLoading('loading')
    console.log('Cargando agendas desde el backend...', filtros || 'sin filtros')
    try {
      const result = await apiService.getAgendas(filtros)
      if (result.success) {
        // El backend devuelve {success: true, data: [...], total: X}
        console.log('Estructura completa de result.data para agendas:', result.data)
        const rawData = result.data?.data || result.data
        const agendasData = Array.isArray(rawData) ? rawData : []
        setAgendas(agendasData)
        setError(null)
        setLoading('success')
        console.log(`Agendas cargadas: ${agendasData.length} registros`)
        if (agendasData.length > 0) {
          console.log('Primera agenda:', agendasData[0])
          console.log('Estructura completa de la primera agenda:', JSON.stringify(agendasData[0], null, 2))
        }
      } else {
        // Fallback a datos mock si el backend falla
        console.warn('Usando datos mock para agendas')
        setAgendas(mockAgendas)
        setError(null)
        setLoading('success')
      }
    } catch (err) {
      // Fallback a datos mock si hay error de conexión
      console.warn('Error de conexion, usando datos mock para agendas')
      setAgendas(mockAgendas)
      setError(null)
      setLoading('success')
    }
  }, [])

  const createAgenda = useCallback(async (agendaData: Omit<Agenda, "id">) => {
    setLoading('loading')
    console.log('Creando nueva agenda:', agendaData)
    try {
      const result = await apiService.createAgenda(agendaData)
      if (result.success) {
        // Recargar agendas después de crear
        await loadAgendas()
        setError(null)
        setLoading('success')
        console.log('Agenda creada exitosamente:', result.data)
        return result.data
      } else {
        setError(result.message || 'Error al crear agenda')
        setLoading('error')
        console.error('Error al crear agenda:', result.message)
        return null
      }
    } catch (err) {
      setError('Error al crear agenda')
      setLoading('error')
      console.error('Error al crear agenda:', err)
      return null
    }
  }, [loadAgendas])

  const updateAgenda = useCallback(async (id: number, agendaData: Partial<Agenda>) => {
    setLoading('loading')
    console.log('Actualizando agenda ID:', id, 'Datos:', agendaData)
    try {
      const result = await apiService.updateAgenda(id, agendaData)
      if (result.success) {
        // Recargar agendas después de actualizar
        await loadAgendas()
        setError(null)
        setLoading('success')
        console.log('Agenda actualizada exitosamente:', result.data)
        return result.data
      } else {
        setError(result.message || 'Error al actualizar agenda')
        setLoading('error')
        console.error('Error al actualizar agenda:', result.message)
        return null
      }
    } catch (err) {
      setError('Error al actualizar agenda')
      setLoading('error')
      console.error('Error al actualizar agenda:', err)
      return null
    }
  }, [loadAgendas])

  const deleteAgenda = useCallback(async (id: number) => {
    setLoading('loading')
    try {
      const result = await apiService.deleteAgenda(id)
      if (result.success) {
        // Recargar agendas después de eliminar
        await loadAgendas()
        setError(null)
        setLoading('success')
        return true
      } else {
        setError(result.message || 'Error al eliminar agenda')
        setLoading('error')
        return false
      }
    } catch (err) {
      setError('Error al eliminar agenda')
      setLoading('error')
      return false
    }
  }, [loadAgendas])

  const cancelAgenda = useCallback(async (id: number) => {
    setLoading('loading')
    try {
      const result = await apiService.cancelAgenda(id)
      if (result.success) {
        // Recargar agendas después de cancelar
        await loadAgendas()
        setError(null)
        setLoading('success')
        return result.data
      } else {
        setError(result.message || 'Error al cancelar agenda')
        setLoading('error')
        return null
      }
    } catch (err) {
      setError('Error al cancelar agenda')
      setLoading('error')
      return null
    }
  }, [loadAgendas])

  // ===== CATÁLOGOS =====
  const [buildings, setBuildings] = useState<Edificio[]>([])
  const [consultorios, setConsultorios] = useState<any[]>([])
  const [days, setDays] = useState<any[]>([])

  const loadBuildings = useCallback(async () => {
    setLoading('loading')
    console.log('Cargando edificios desde el backend...')
    try {
      const result = await apiService.getBuildings()
      if (result.success) {
        // El backend devuelve {success: true, data: [...], total: X}
        const rawData = result.data?.data || result.data
        const buildingsData = Array.isArray(rawData) ? rawData : []
        setBuildings(buildingsData)
        setError(null)
        setLoading('success')
        console.log(`Edificios cargados: ${buildingsData.length} registros`)
        console.log('Edificios:', buildingsData)
      } else {
        // Fallback a datos mock si el backend falla
        console.warn('Usando datos mock para edificios')
        setBuildings(mockEdificios)
        setError(null)
        setLoading('success')
      }
    } catch (err) {
      // Fallback a datos mock si hay error de conexión
      console.warn('Error de conexion, usando datos mock para edificios')
      setBuildings(mockEdificios)
      setError(null)
      setLoading('success')
    }
  }, [])

  const loadConsultorios = useCallback(async () => {
    setLoading('loading')
    try {
      const result = await apiService.getConsultorios()
      if (result.success) {
        const rawData = result.data?.data || result.data
        const consultoriosData = Array.isArray(rawData) ? rawData : []
        // Normalizar llaves posibles del backend (CD_* mayúsculas)
        const normalized = consultoriosData.map((c: any) => ({
          codigo_consultorio: c.codigo_consultorio ?? c.CD_CONSULTORIO ?? c.cd_consultorio ?? null,
          codigo_edificio: c.codigo_edificio ?? c.CD_EDIFICIO ?? c.cd_edificio ?? null,
          codigo_piso: c.codigo_piso ?? c.CD_PISO ?? c.cd_piso ?? null,
          descripcion_consultorio: c.descripcion_consultorio ?? c.DES_CONSULTORIO ?? c.des_consultorio ?? c.descripcion ?? null,
          // preservar resto por si se usa en otro lado
          ...c,
        }))
        console.log('Consultorios cargados del backend:', normalized.length, 'registros')
        console.log('Estructura de consultorio ejemplo:', normalized[0])
        setConsultorios(normalized)
        setError(null)
        setLoading('success')
      } else {
        console.warn('Backend no retornó consultorios exitosamente, usando datos mock')
        setConsultorios(mockConsultorios)
        setError(null)
        setLoading('success')
      }
    } catch (err) {
      console.warn('Error al cargar consultorios del backend, usando datos mock')
      setConsultorios(mockConsultorios)
      setError(null)
      setLoading('success')
    }
  }, [])

  const loadDays = useCallback(async () => {
    setLoading('loading')
    try {
      const result = await apiService.getDays()
      if (result.success) {
        const rawData = result.data?.data || result.data
        const daysData = Array.isArray(rawData) ? rawData : []
        setDays(daysData)
        setError(null)
        setLoading('success')
      } else {
        setError(result.message || 'Error al cargar días')
        setLoading('error')
      }
    } catch (err) {
      setError('Error al cargar días')
      setLoading('error')
    }
  }, [])

  // ===== FUNCIONES DE UTILIDAD =====
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const resetLoading = useCallback(() => {
    setLoading('idle')
  }, [])

  return {
    // Estados
    loading,
    error,
    connectionStatus,
    
    // Datos
    doctors,
    specialties,
    agendas,
    buildings,
    consultorios,
    days,
    
    // Funciones de médicos
    loadDoctors,
    loadSpecialties,
    getDoctorsBySpecialty,
    
    // Funciones de agendas
    loadAgendas,
    createAgenda,
    updateAgenda,
    deleteAgenda,
    cancelAgenda,
    
    // Funciones de catálogos
    loadBuildings,
    loadConsultorios,
    loadDays,
    
    // Funciones de utilidad
    checkConnection,
    clearError,
    resetLoading
  }
}
