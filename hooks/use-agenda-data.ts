"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useBackendAPI } from "./use-backend-api"
import { 
  decodeTipo, 
  formatTime, 
  getDayName, 
  mapDayToCode, 
  formatTimeForBackend,
  generateUniqueId,
  isValidTimeFormat,
  sortByName,
  filterByText
} from "@/lib/utils"
import { APP_CONFIG } from "@/lib/constants"
import type { 
  CombinedRecord, 
  Filters, 
  Doctor, 
  Agenda, 
  Edificio, 
  Consultorio, 
  Especialidad,
  AgendaPayload 
} from "@/lib/types"

export function useAgendaData() {
  const {
    loading,
    error,
    connectionStatus,
    doctors,
    agendas,
    buildings,
    specialties,
    consultorios,
    loadDoctors,
    loadAgendas,
    loadBuildings,
    loadSpecialties,
    loadConsultorios,
    createAgenda,
    updateAgenda,
    deleteAgenda,
    clearError,
  } = useBackendAPI()

  const [records, setRecords] = useState<CombinedRecord[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    especialidad: "",
    edificio: "",
    tipo: "",
    search: "",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [openPopovers, setOpenPopovers] = useState<{[key: string]: boolean}>({})

  // Cargar datos del backend
  useEffect(() => {
    if (connectionStatus === 'connected') {
      loadDoctors()
      loadAgendas()
      loadBuildings()
      loadSpecialties()
      loadConsultorios()
    }
  }, [connectionStatus, loadDoctors, loadAgendas, loadBuildings, loadSpecialties, loadConsultorios])

  // Combinar datos de médicos y agendas
  useEffect(() => {
    if (agendas.length > 0 && consultorios.length > 0) {
      const combinedRecords: CombinedRecord[] = agendas.map((agenda: Agenda) => {
        const doctor = doctors.find((d: Doctor) => d.id === agenda.codigo_prestador)
        const dia = getDayName(agenda.codigo_dia)
        const horaInicio = formatTime(agenda.hora_inicio)
        const horaFin = formatTime(agenda.hora_fin)

        // Buscar la especialidad
        let especialidad = 'Sin especialidad'
        if (agenda.codigo_item_agendamiento) {
          const especialidadEncontrada = specialties.find((esp: Especialidad) => 
            esp.especialidadId === agenda.codigo_item_agendamiento
          )
          if (especialidadEncontrada) {
            especialidad = especialidadEncontrada.descripcion
          } else {
            const especialidadDelMedico = doctor?.especialidades?.find((esp: any) => 
              esp.especialidadId === agenda.codigo_item_agendamiento
            )
            especialidad = especialidadDelMedico?.descripcion || 'Sin especialidad'
          }
        } else if (doctor?.especialidades && doctor.especialidades.length > 0) {
          especialidad = doctor.especialidades[0].descripcion
        }

        // Mapear edificio, piso y descripción de consultorio
        const consultorio = consultorios.find((c: Consultorio) => c.codigo_consultorio === agenda.codigo_consultorio)
        const edificioData = buildings.find((b: Edificio) => b.codigo_edificio === consultorio?.codigo_edificio)
        const edificioNombre = edificioData?.descripcion_edificio || APP_CONFIG.DEFAULT_BUILDING_NAME
        const pisoNombre = consultorio ? `Piso ${consultorio.codigo_piso}` : "1"
        const consultorioDescripcion = consultorio?.descripcion_consultorio || consultorio?.DES_CONSULTORIO || ""

        return {
          id: `${agenda.codigo_agenda}-${doctor?.id || 0}`,
          doctorId: doctor?.id || 0,
          agendaId: agenda.codigo_agenda,
          nombre: doctor?.nombres || "Doctor no encontrado",
          especialidad,
          tipo: decodeTipo(agenda.tipo || "C"),
          codigoItemAgendamiento: agenda.codigo_item_agendamiento || 0,
          edificio: edificioNombre,
          piso: pisoNombre,
          codigoConsultorio: agenda.codigo_consultorio,
          consultorioDescripcion,
          dia,
          horaInicio,
          horaFin,
          estado: "Activa",
          procedimiento: "",
          isEditing: false,
        }
      })
      
      const sortedRecords = combinedRecords.sort((a, b) => b.agendaId - a.agendaId)
      setRecords(sortedRecords)
    } else {
      setRecords([])
    }
  }, [doctors, agendas, consultorios, buildings, specialties])

  // Filtrar registros
  const filteredRecords = useMemo(() => {
    let filtered = records

    // Filtro por especialidad
    if (filters.especialidad && filters.especialidad !== "todas") {
      filtered = filtered.filter(record => record.especialidad === filters.especialidad)
    }

    // Filtro por edificio
    if (filters.edificio && filters.edificio !== "todos") {
      filtered = filtered.filter(record => record.edificio === filters.edificio)
    }

    // Filtro por tipo
    if (filters.tipo && filters.tipo !== "todos") {
      filtered = filtered.filter(record => record.tipo === filters.tipo)
    }

    // Filtro por búsqueda
    if (filters.search) {
      filtered = filterByText(filtered, filters.search, [
        'nombre', 'especialidad', 'edificio', 'dia', 'consultorioDescripcion'
      ])
    }

    // Mantener el orden original de los registros (no ordenar)
    return filtered
  }, [records, filters])

  // Paginación
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * APP_CONFIG.ITEMS_PER_PAGE
    const endIndex = startIndex + APP_CONFIG.ITEMS_PER_PAGE
    return filteredRecords.slice(startIndex, endIndex)
  }, [filteredRecords, currentPage])

  const totalPages = Math.ceil(filteredRecords.length / APP_CONFIG.ITEMS_PER_PAGE)

  // Funciones helper optimizadas con useMemo y useCallback
  const getEspecialidadIdByDescripcion = useCallback((descripcion: string): number | null => {
    if (!descripcion || descripcion === "todas") return null
    const especialidad = specialties.find((esp: Especialidad) => esp.descripcion === descripcion)
    return especialidad?.especialidadId || null
  }, [specialties])

  const getDoctorsBySpecialty = useCallback((especialidadDescripcion: string): Doctor[] => {
    if (!especialidadDescripcion || especialidadDescripcion === "todas") {
      return sortByName(doctors)
    }
    const especialidadId = getEspecialidadIdByDescripcion(especialidadDescripcion)
    if (!especialidadId) return []
    
    return sortByName(doctors.filter((doctor: Doctor) => 
      doctor.especialidades && 
      doctor.especialidades.some((esp: any) => esp.especialidadId === especialidadId)
    ))
  }, [doctors, getEspecialidadIdByDescripcion])

  const getAvailableFloors = useCallback((edificio: string): string[] => {
    if (!edificio || !consultorios.length) return []

    const building = buildings.find((e: Edificio) => 
      e.descripcion_edificio === edificio || 
      e.codigo_edificio.toString() === edificio
    )
    
    if (building) {
      const consultoriosDelEdificio = consultorios.filter((c: Consultorio) => 
        c.codigo_edificio === building.codigo_edificio
      )
      
      const pisosFromConsultorios = consultoriosDelEdificio
        .map((c: Consultorio) => `Piso ${c.codigo_piso}`)
        .filter((piso, index, arr) => arr.indexOf(piso) === index)
        .sort()
      
      return pisosFromConsultorios
    }
    
    return []
  }, [buildings, consultorios])

  const getDefaultBuildingFloors = useCallback((): string[] => {
    const edificioPorDefecto = buildings.find((b: Edificio) => b.codigo_edificio === APP_CONFIG.DEFAULT_BUILDING_ID)
    if (!edificioPorDefecto) return []
    
    const consultoriosDelEdificio = consultorios.filter((c: Consultorio) => 
      c.codigo_edificio === APP_CONFIG.DEFAULT_BUILDING_ID
    )
    
    return consultoriosDelEdificio
      .map((c: Consultorio) => `Piso ${c.codigo_piso}`)
      .filter((piso, index, arr) => arr.indexOf(piso) === index)
      .sort()
  }, [buildings, consultorios])

  const obtenerCodigoConsultorio = useCallback((edificio: string, piso: string): number => {
    const building = buildings.find((e: Edificio) => e.descripcion_edificio === edificio)
    if (!building) return 1
    
    const pisoNumero = parseInt(piso.replace('Piso ', '')) || 1
    
    const consultorio = consultorios.find((c: Consultorio) => 
      c.codigo_edificio === building.codigo_edificio && c.codigo_piso === pisoNumero
    )
    
    return consultorio?.codigo_consultorio || 1
  }, [buildings, consultorios])

  // Funciones de manejo de datos optimizadas
  const handleFilterChange = useCallback((key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      especialidad: "",
      edificio: "",
      tipo: "",
      search: "",
    })
    setCurrentPage(1)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleFieldChange = (id: string, field: keyof CombinedRecord, value: string | number) => {
    setRecords((prev) =>
      prev.map((record) => {
        if (record.id === id) {
          const updated = { ...record, [field]: value }
          if (field === "edificio") {
            updated.piso = ""
          }
          return updated
        }
        return record
      }),
    )
    setHasChanges(true)
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setRecords((prev) =>
      prev.map((record) => (record.id === id ? { ...record, isEditing: true } : { ...record, isEditing: false })),
    )
  }

  const handleCancel = (id: string) => {
    setEditingId(null)
    setRecords((prev) => prev.map((record) => (record.id === id ? { ...record, isEditing: false } : record)))
  }

  const handleSave = async (id: string) => {
    try {
      const record = records.find(r => r.id === id)
      if (!record) return
      
      // Validaciones
      const codigoItemAgendamiento = Number(record.codigoItemAgendamiento) || 0
      if (!codigoItemAgendamiento) {
        alert('Por favor complete todos los campos requeridos.')
        return
      }

      const codigoConsultorio = obtenerCodigoConsultorio(record.edificio, record.piso)
      if (!record.doctorId || !codigoConsultorio || !record.horaInicio || !record.horaFin || !record.dia) {
        alert('Por favor complete todos los campos requeridos, incluyendo las horas de inicio y fin.')
        return
      }
      
      if (!isValidTimeFormat(record.horaInicio) || !isValidTimeFormat(record.horaFin)) {
        alert('Por favor ingrese horas válidas en formato HH:MM')
        return
      }

      const horaInicioFormateada = formatTimeForBackend(record.horaInicio)
      const horaFinFormateada = formatTimeForBackend(record.horaFin)
      
      const payload: AgendaPayload = {
        codigo_prestador: record.doctorId,
        codigo_consultorio: codigoConsultorio,
        codigo_item_agendamiento: codigoItemAgendamiento,
        codigo_dia: mapDayToCode(record.dia),
        hora_inicio: horaInicioFormateada,
        hora_fin: horaFinFormateada,
        tipo: record.tipo === "Consulta" ? "C" : "P"
      }
      
      let saveResult = null

      if (record.agendaId === 0) {
        // Crear nueva agenda
        const createPayload = { ...payload }
        delete createPayload.codigo_agenda
        saveResult = await createAgenda(createPayload)
      } else {
        // Actualizar agenda existente
        payload.codigo_agenda = record.agendaId
        saveResult = await updateAgenda(record.agendaId, payload)
      }
      
      if (saveResult) {
        setRecords(prev => prev.map(r => r.id === id ? { ...r, isEditing: false } : r))
        setHasChanges(false)
      }
    } catch (error) {
      console.error('Error guardando:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const record = records.find(r => r.id === id)
      if (!record || record.agendaId === 0) {
        setRecords((prev) => prev.filter((r) => r.id !== id))
        return
      }

      await deleteAgenda(record.agendaId)
    } catch (error) {
      console.error("Error deleting record:", error)
    }
  }

  const handleDuplicate = (record: CombinedRecord) => {
    const newId = generateUniqueId()
    const edificioPorDefecto = buildings.find((b: Edificio) => b.codigo_edificio === APP_CONFIG.DEFAULT_BUILDING_ID)
    const edificioPorDefectoNombre = edificioPorDefecto?.descripcion_edificio || APP_CONFIG.DEFAULT_BUILDING_NAME
    
    const duplicatedRecord: CombinedRecord = {
      ...record,
      id: newId,
      agendaId: 0,
      edificio: edificioPorDefectoNombre,
      piso: "",
      isEditing: true,
    }
    
    setRecords((prev) => [duplicatedRecord, ...prev])
    setEditingId(newId)
  }

  const handleAddRecord = () => {
    const newId = generateUniqueId()
    const edificioPorDefecto = buildings.find((b: Edificio) => b.codigo_edificio === APP_CONFIG.DEFAULT_BUILDING_ID)
    const edificioPorDefectoNombre = edificioPorDefecto?.descripcion_edificio || APP_CONFIG.DEFAULT_BUILDING_NAME
    
    const newRecord: CombinedRecord = {
      id: newId,
      doctorId: 0,
      agendaId: 0,
      nombre: "",
      especialidad: "",
      tipo: "Consulta",
      codigoItemAgendamiento: 0,
      edificio: edificioPorDefectoNombre,
      piso: "",
      dia: "Lunes",
      horaInicio: "",
      horaFin: "",
      estado: "Activa",
      procedimiento: "",
      isEditing: true,
    }
    
    setRecords((prev) => [newRecord, ...prev])
    setEditingId(newId)
  }

  const handleAddRecordFromDoctor = (doctor: Doctor) => {
    const newId = generateUniqueId()
    const firstSpecialty = doctor.especialidades && doctor.especialidades.length > 0 
      ? doctor.especialidades[0] 
      : null
    
    const edificioPorDefecto = buildings.find((b: Edificio) => b.codigo_edificio === APP_CONFIG.DEFAULT_BUILDING_ID)
    const edificioPorDefectoNombre = edificioPorDefecto?.descripcion_edificio || APP_CONFIG.DEFAULT_BUILDING_NAME
    
    const newRecord: CombinedRecord = {
      id: newId,
      doctorId: doctor.id,
      agendaId: 0,
      nombre: doctor.nombres,
      especialidad: firstSpecialty?.descripcion || "",
      tipo: "Consulta",
      codigoItemAgendamiento: firstSpecialty?.especialidadId || 0,
      edificio: edificioPorDefectoNombre,
      piso: "",
      dia: "Lunes",
      horaInicio: "",
      horaFin: "",
      estado: "Activa",
      procedimiento: "",
      isEditing: true,
    }
    
    setRecords((prev) => [newRecord, ...prev])
    setEditingId(newId)
  }

  // Funciones para popovers optimizadas
  const togglePopover = useCallback((key: string) => {
    setOpenPopovers(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const closePopover = useCallback((key: string) => {
    setOpenPopovers(prev => ({ ...prev, [key]: false }))
  }, [])

  // Función para guardar con Enter optimizada
  const handleKeyDown = useCallback((event: React.KeyboardEvent, recordId: string) => {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault()
      handleSave(recordId)
    }
  }, [])

  return {
    // Estados
    records,
    filteredRecords,
    paginatedRecords,
    loading,
    error,
    connectionStatus,
    filters,
    currentPage,
    totalPages,
    editingId,
    hasChanges,
    openPopovers,
    
    // Datos del backend
    doctors,
    specialties,
    buildings,
    consultorios,
    
    // Funciones
    handleFilterChange,
    clearFilters,
    handlePageChange,
    handleFieldChange,
    handleEdit,
    handleCancel,
    handleSave,
    handleDelete,
    handleDuplicate,
    handleAddRecord,
    handleAddRecordFromDoctor,
    handleKeyDown,
    togglePopover,
    closePopover,
    clearError,
    
    // Funciones helper
    getDoctorsBySpecialty,
    getAvailableFloors,
    getDefaultBuildingFloors,
  }
}
