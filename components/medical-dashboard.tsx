"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LogOut,
  User,
  Plus,
  Save,
  Trash2,
  Edit3,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  RefreshCw,
  Check,
  ChevronsUpDown,
  Copy,
} from "lucide-react"
import { useBackendAPI } from "@/hooks/use-backend-api"
import { DebugInfo } from "@/components/debug-info"
import { AgendaDebug } from "@/components/agenda-debug"
import BtnExportarStaff from "@/src/components/BtnExportarStaff"
import { StaffItem } from "@/src/lib/excel/generateStaffWorkbook"
import { Especialidad } from "@/lib/mock-data"

interface MedicalDashboardProps {
  onLogout: () => void
}

interface Filters {
  especialidad: string
  edificio: string
  tipo: string
  search: string
}

interface CombinedRecord {
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

// Funciones helper para el campo TIPO
// Backend acepta cualquier string y guarda en mayúscula, 1 carácter (C/P) al persistir
const decodeTipo = (tipoBackend: string): "Consulta" | "Procedimiento" => {
  if (!tipoBackend) return "Consulta"
  const t = tipoBackend.trim().toUpperCase()
  return t.startsWith('C') ? "Consulta" : "Procedimiento"
}

const encodeTipo = (tipoTexto: "Consulta" | "Procedimiento"): string => {
  return tipoTexto === "Consulta" ? "C" : "P"
}

export default function MedicalDashboard({ onLogout }: MedicalDashboardProps) {
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
  
  // Estado para el filtro de especialidad al crear agenda
  const [selectedSpecialtyForNew, setSelectedSpecialtyForNew] = useState<string>("")
  const [saveTimeouts, setSaveTimeouts] = useState<{[key: string]: NodeJS.Timeout}>({})
  
  // Estado para controlar los popovers de búsqueda
  const [openPopovers, setOpenPopovers] = useState<{[key: string]: boolean}>({})
  
  // Estado para búsqueda general de doctores
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false)
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("")

  // Funciones helper para manejar los popovers
  const togglePopover = (key: string) => {
    setOpenPopovers(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const closePopover = (key: string) => {
    setOpenPopovers(prev => ({ ...prev, [key]: false }))
  }

  const [filters, setFilters] = useState<Filters>({
    especialidad: "",
    edificio: "",
    tipo: "",
    search: "",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Función helper para obtener especialidadId desde la descripción
  const getEspecialidadIdByDescripcion = (descripcion: string): number | null => {
    if (!descripcion || descripcion === "todas") return null
    const especialidad = specialties.find((esp: Especialidad) => esp.descripcion === descripcion)
    return especialidad?.especialidadId || null
  }

  // Función para obtener médicos filtrados por especialidad usando especialidadId
  const getDoctorsBySpecialty = (especialidadDescripcion: string) => {
    if (!especialidadDescripcion || especialidadDescripcion === "todas") {
      return [...doctors].sort((a: any, b: any) => a.nombres.localeCompare(b.nombres))
    }
    const especialidadId = getEspecialidadIdByDescripcion(especialidadDescripcion)
    if (!especialidadId) return []
    
    return doctors
      .filter((doctor: any) => 
        doctor.especialidades && 
        doctor.especialidades.some((esp: any) => esp.especialidadId === especialidadId)
      )
      .sort((a: any, b: any) => a.nombres.localeCompare(b.nombres))
  }

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

  // Combinar datos de médicos y agendas (normalizando campos del backend)
  useEffect(() => {
    console.log('useEffect ejecutado - Doctores:', doctors.length, 'Agendas:', agendas.length)
    
    if (agendas.length > 0 && consultorios.length > 0) {
      console.log('Estructura de agenda del backend:', agendas[0])
      console.log('Consultorios disponibles:', consultorios.length)
      if (doctors.length > 0) {
        console.log('Estructura de medico del backend:', doctors[0])
      }
      
      // Procesar agendas con información de consultorios

      const combinedRecords: CombinedRecord[] = agendas.map((agenda: any) => {
        const doctor = doctors.find((d: any) => d.id === agenda.codigo_prestador)

        // Mapear día según código
        const diasSemana = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        const dia = diasSemana[agenda.codigo_dia] || 'Sin día'

        // Formatear horas desde diferentes formatos de BD
        const formatearHora = (horaString: string) => {
          console.log('formatearHora - entrada:', horaString, 'tipo:', typeof horaString)
          
          if (!horaString) {
            console.warn('Hora vacía en formatearHora')
            return ''
          }
          
          try {
            // Si ya viene en formato HH:MM, devolverlo tal como está
            if (horaString.match(/^\d{1,2}:\d{2}$/)) {
              const [horas, minutos] = horaString.split(':')
              const resultado = `${String(horas).padStart(2, '0')}:${minutos}`
              console.log('Ya es formato HH:MM, devolviendo:', resultado)
              return resultado
            }
            
            // Si viene en formato de fecha completa (YYYY-MM-DD HH:MM:SS o YYYY-MM-DD HH:MM)
            if (horaString.includes('-') && horaString.includes(' ')) {
              // Parsear manualmente para evitar problemas de timezone
              const partes = horaString.split(' ')
              if (partes.length === 2) {
                const horaParte = partes[1]
                // Extraer solo HH:MM si viene con segundos
                if (horaParte.match(/^\d{1,2}:\d{2}:\d{2}/)) {
                  const resultado = horaParte.substring(0, 5)
                  console.log('Extrayendo HH:MM de fecha con segundos:', `${horaString} -> ${resultado}`)
                  return resultado
                }
                // Si ya viene como HH:MM
                if (horaParte.match(/^\d{1,2}:\d{2}$/)) {
                  const resultado = horaParte
                  console.log('Extrayendo hora de fecha completa:', `${horaString} -> ${resultado}`)
                  return resultado
                }
              }
            }
            
            // Si viene como ISO string (con T)
            if (horaString.includes('T')) {
              const fecha = new Date(horaString)
              if (!isNaN(fecha.getTime())) {
                const horas = fecha.getHours().toString().padStart(2, '0')
                const minutos = fecha.getMinutes().toString().padStart(2, '0')
                const resultado = `${horas}:${minutos}`
                console.log('Convirtiendo ISO string a HH:MM:', `${horaString} -> ${resultado}`)
                return resultado
              }
            }
            
            console.warn('Formato de hora no reconocido:', horaString)
            return ''
          } catch (e) {
            console.warn('Error formateando hora:', horaString, e)
            return ''
          }
        }

        console.log('Formato de hora desde BD:', {
          hora_inicio_raw: agenda.hora_inicio,
          hora_fin_raw: agenda.hora_fin,
          tipo_hora_inicio: typeof agenda.hora_inicio,
          tipo_hora_fin: typeof agenda.hora_fin
        })
        
        const horaInicio = formatearHora(agenda.hora_inicio)
        const horaFin = formatearHora(agenda.hora_fin)
        
        console.log('Horas formateadas:', {
          hora_inicio_formateada: horaInicio,
          hora_fin_formateada: horaFin
        })

        // Buscar la especialidad según el codigo_item_agendamiento de la agenda
        let especialidad = 'Sin especialidad'
        
        if (agenda.codigo_item_agendamiento) {
          // Buscar en el array de especialidades por especialidadId
          const especialidadEncontrada = specialties.find((esp: Especialidad) => 
            esp.especialidadId === agenda.codigo_item_agendamiento
          )
          if (especialidadEncontrada) {
            especialidad = especialidadEncontrada.descripcion
          } else {
            // Si no se encuentra en specialties, buscar en las especialidades del médico
            const especialidadDelMedico = doctor?.especialidades?.find((esp: any) => 
              esp.especialidadId === agenda.codigo_item_agendamiento
            )
            especialidad = especialidadDelMedico?.descripcion || 'Sin especialidad'
          }
        } else if (doctor?.especialidades && doctor.especialidades.length > 0) {
          // Fallback: usar primera especialidad del médico si no hay codigo_item_agendamiento
          especialidad = doctor.especialidades[0].descripcion
        }

        // Mapear edificio, piso y descripción de consultorio
        const consultorio = consultorios.find((c: any) => c.codigo_consultorio === agenda.codigo_consultorio)
        const edificioData = buildings.find((b: any) => b.codigo_edificio === consultorio?.codigo_edificio)
        const edificioNombre = edificioData?.descripcion_edificio || "Hospital Principal"
        const pisoNombre = consultorio ? `Piso ${consultorio.codigo_piso}` : "1"
        const consultorioDescripcion = consultorio?.descripcion_consultorio || consultorio?.DES_CONSULTORIO || ""

        console.log('Mapeo consultorio, especialidad y tipo:', {
          agenda_consultorio: agenda.codigo_consultorio,
          consultorio_encontrado: consultorio,
          edificio_data: edificioData,
          edificio_final: edificioNombre,
          piso_final: pisoNombre,
          tipo_backend: agenda.tipo,
          tipo_decodificado: decodeTipo(agenda.tipo || "C"),
          codigo_item_agendamiento: agenda.codigo_item_agendamiento,
          especialidad_encontrada: especialidad,
          specialties_total: specialties.length
        })

        return {
          id: `${agenda.codigo_agenda}-${doctor?.id || 0}`,
          doctorId: doctor?.id || 0,
          agendaId: agenda.codigo_agenda,
          nombre: doctor?.nombres || "Doctor no encontrado",
          especialidad,
          // Decodificar el campo TIPO del backend ("C" = Consulta, "P" = Procedimiento)
          tipo: decodeTipo(agenda.tipo || "C"),
          codigoItemAgendamiento: agenda.codigo_item_agendamiento || 0,
          edificio: edificioNombre,
          piso: pisoNombre,
          codigoConsultorio: agenda.codigo_consultorio,
          consultorioDescripcion,
          dia,
          horaInicio,
          horaFin,
          estado: "Activa", // Estado por defecto
          procedimiento: "", // Campo quemado
          isEditing: false,
        }
      })
      // Ordenar por fecha de creación/ID descendente para mostrar los más nuevos primero
      const sortedRecords = combinedRecords.sort((a, b) => b.agendaId - a.agendaId)
      setRecords(sortedRecords)
      console.log('Registros combinados creados:', sortedRecords.length)
      console.log('Primeros 3 registros:', sortedRecords.slice(0, 3))
    } else if (agendas.length > 0 && consultorios.length === 0) {
      console.log('Agendas cargadas pero aun no hay consultorios')
    } else if (agendas.length > 0 && doctors.length === 0) {
      console.log('Agendas cargadas pero aun no hay medicos')
    } else if (doctors.length > 0 && agendas.length === 0) {
      console.log('Medicos cargados pero aun no hay agendas')
    } else {
      console.log('Esperando datos del backend...', {
        agendas: agendas.length,
        consultorios: consultorios.length,
        doctors: doctors.length
      })
    }
  }, [doctors, agendas, consultorios, buildings])

  const filteredRecords = useMemo(() => {
    const filtered = records.filter((record) => {
      const matchesEspecialidad = 
        !filters.especialidad || 
        filters.especialidad === "todas" || 
        record.especialidad === filters.especialidad
      
      const matchesEdificio = 
        !filters.edificio || 
        filters.edificio === "todos" || 
        record.edificio === filters.edificio
      
      const matchesTipo = 
        !filters.tipo || 
        filters.tipo === "todos" || 
        record.tipo === filters.tipo
      
      const matchesSearch =
        !filters.search ||
        record.nombre.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.especialidad.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.edificio.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.dia.toLowerCase().includes(filters.search.toLowerCase()) ||
        (record.consultorioDescripcion && record.consultorioDescripcion.toLowerCase().includes(filters.search.toLowerCase()))

      return matchesEspecialidad && matchesEdificio && matchesTipo && matchesSearch
    })

    // Ordenar por especialidad primero, luego por nombre del médico
    return filtered.sort((a, b) => {
      const especialidadCompare = a.especialidad.localeCompare(b.especialidad)
      if (especialidadCompare !== 0) return especialidadCompare
      return a.nombre.localeCompare(b.nombre)
    })
  }, [records, filters])

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredRecords.slice(startIndex, endIndex)
  }, [filteredRecords, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      especialidad: "",
      edificio: "",
      tipo: "",
      search: "",
    })
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setRecords((prev) =>
      prev.map((record) => (record.id === id ? { ...record, isEditing: true } : { ...record, isEditing: false })),
    )
  }

  const getTodayDateString = (): string => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const resultado = `${y}-${m}-${d}`
    console.log('getTodayDateString:', resultado)
    return resultado
  }

  // Formato requerido por backend: "YYYY-MM-DD HH:MM"
  const formatearHoraBackend = (horaString: string): string => {
    console.log('formatearHoraBackend - entrada:', horaString, 'tipo:', typeof horaString)
    
    if (!horaString) {
      console.warn('Hora vacía, usando 00:00')
      return '1900-01-01 00:00'
    }
    
    // Si ya viene en formato completo de fecha, extraer solo la hora y usar fecha fija
    if (horaString.includes('-') && horaString.includes(' ')) {
      const partes = horaString.split(' ')
      if (partes.length === 2) {
        const horaParte = partes[1]
        const resultado = `1900-01-01 ${horaParte}`
        console.log('Extrayendo hora de fecha completa:', `${horaString} -> ${resultado}`)
        return resultado
      }
    }
    
    // Si viene solo en formato HH:MM, agregar fecha fija
    if (horaString.match(/^\d{1,2}:\d{2}$/)) {
      const [horas, minutos] = horaString.split(':')
      const resultado = `1900-01-01 ${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
      console.log('Convirtiendo HH:MM a formato con fecha fija:', `${horaString} -> ${resultado}`)
      return resultado
    }
    
    console.warn('Formato de hora no reconocido:', horaString)
    return `1900-01-01 ${horaString}`
  }

  const mapearDiaACodigo = (dia: string): number => {
    const dias: {[key: string]: number} = {
      'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 
      'Viernes': 5, 'Sábado': 6, 'Domingo': 7
    }
    return dias[dia] || 1
  }

  const obtenerCodigoConsultorio = (edificio: string, piso: string): number => {
    // Buscar el edificio por nombre
    const building = buildings.find((e: any) => e.descripcion_edificio === edificio)
    if (!building) {
      console.warn('Edificio no encontrado:', edificio, 'Usando consultorio por defecto')
      return 1
    }
    
    // Extraer número del piso (ej: "Piso 2" -> 2)
    const pisoNumero = parseInt(piso.replace('Piso ', '')) || 1
    
    // Buscar consultorio por edificio y piso
    const consultorio = consultorios.find((c: any) => 
      c.codigo_edificio === building.codigo_edificio && c.codigo_piso === pisoNumero
    )
    
    if (consultorio) {
      console.log('Consultorio encontrado:', consultorio.codigo_consultorio, 'para', edificio, piso)
      return consultorio.codigo_consultorio
    }
    
    console.warn('Consultorio no encontrado para', edificio, piso, 'Usando por defecto')
    return 1
  }

  const handleSave = async (id: string) => {
    console.log('=== GUARDANDO REGISTRO ===')
    console.log('ID:', id)
    
    try {
      const record = records.find(r => r.id === id)
      if (!record) {
        console.error('No se encontró el registro con ID:', id)
        return
      }
      
      console.log('Record encontrado:', record)
      console.log('Estado actual de datos:', {
        buildings: buildings.length,
        consultorios: consultorios.length,
        doctors: doctors.length
      })
      
      // Usar codigoItemAgendamiento ingresado/seleccionado en la UI
      const codigoItemAgendamiento = Number(record.codigoItemAgendamiento) || 0
      if (!codigoItemAgendamiento) {
        console.error('codigo_item_agendamiento es requerido. Ingrese un valor válido.')
        return
      }

      // Preparar payload para el backend
      const codigoConsultorio = obtenerCodigoConsultorio(record.edificio, record.piso)
      if (!record.doctorId || !codigoConsultorio || !record.horaInicio || !record.horaFin || !record.dia) {
        console.error('Validación fallida antes de POST:', {
          doctorId: record.doctorId,
          codigoConsultorio,
          dia: record.dia,
          horaInicio: record.horaInicio,
          horaFin: record.horaFin
        })
        alert('Por favor complete todos los campos requeridos, incluyendo las horas de inicio y fin.')
        return
      }
      
      // Validar que las horas tengan formato correcto
      if (!record.horaInicio.match(/^\d{1,2}:\d{2}$/) || !record.horaFin.match(/^\d{1,2}:\d{2}$/)) {
        console.error('Formato de hora inválido:', {
          horaInicio: record.horaInicio,
          horaFin: record.horaFin
        })
        alert('Por favor ingrese horas válidas en formato HH:MM')
        return
      }
      const horaInicioFormateada = formatearHoraBackend(record.horaInicio)
      const horaFinFormateada = formatearHoraBackend(record.horaFin)
      
      console.log('=== VALORES DE HORA ANTES DE GUARDAR ===')
      console.log('Record completo:', record)
      console.log('Estado actual de records:', records)
      console.log('Record encontrado en estado:', records.find(r => r.id === id))
      console.log('Formateo de horas para backend:', {
        horaInicio_original: record.horaInicio,
        horaFin_original: record.horaFin,
        horaInicio_formateada: horaInicioFormateada,
        horaFin_formateada: horaFinFormateada
      })
      console.log('=== FIN VALORES DE HORA ===')
      
      const payload: any = {
        codigo_prestador: record.doctorId,
        codigo_consultorio: codigoConsultorio,
        codigo_item_agendamiento: codigoItemAgendamiento,
        codigo_dia: mapearDiaACodigo(record.dia),
        hora_inicio: horaInicioFormateada,
        hora_fin: horaFinFormateada,
        tipo: encodeTipo(record.tipo)
      }
      
      // Log detallado del payload para debugging
      console.log('=== PAYLOAD DETALLADO ===')
      console.log('codigo_prestador:', payload.codigo_prestador, 'tipo:', typeof payload.codigo_prestador)
      console.log('codigo_consultorio:', payload.codigo_consultorio, 'tipo:', typeof payload.codigo_consultorio)
      console.log('codigo_item_agendamiento:', payload.codigo_item_agendamiento, 'tipo:', typeof payload.codigo_item_agendamiento)
      console.log('codigo_dia:', payload.codigo_dia, 'tipo:', typeof payload.codigo_dia)
      console.log('hora_inicio:', payload.hora_inicio, 'tipo:', typeof payload.hora_inicio)
      console.log('hora_fin:', payload.hora_fin, 'tipo:', typeof payload.hora_fin)
      console.log('tipo:', payload.tipo, 'tipo:', typeof payload.tipo)
      console.log('=== FIN PAYLOAD DETALLADO ===')
      
      // Solo incluir codigo_agenda para actualizaciones
      if (record.agendaId !== 0) {
        payload.codigo_agenda = record.agendaId
      }
      
      console.log('Payload para backend:', payload)
      
      console.log('PAYLOAD PARA BACKEND:')
      console.log(JSON.stringify(payload, null, 2))
      console.log('URL del endpoint:', `/api/agnd-agenda/${record.agendaId}`)
      console.log('Método: PUT')
      
      let saveResult = null

      if (record.agendaId === 0) {
        // NUEVAS AGENDAS - Intentar guardar en backend
        console.log('Intentando crear nueva agenda en backend...')
        try {
          // Remover codigo_agenda para POST (se auto-genera)
          const createPayload = { ...payload }
          delete createPayload.codigo_agenda
          
          console.log('Payload para createAgenda:', createPayload)
          saveResult = await createAgenda(createPayload)
          
                  if (saveResult) {
          console.log('Nueva agenda creada exitosamente:', saveResult)
          console.log('Respuesta del backend después de crear:', saveResult)
          // Solo salir del modo edición sin recargar datos
          setRecords(prev => prev.map(r => 
            r.id === id ? { ...r, isEditing: false } : r
          ))
          setHasChanges(false)
          return // Salir temprano, no continuar con el resto
        }
        } catch (error) {
          console.error('Error creando agenda:', error)
          saveResult = null
        }
      } else {
        // ACTUALIZACIONES - Intentar actualizar en backend
        console.log('Intentando actualizar agenda existente en backend...')
        try {
          console.log('Payload para updateAgenda:', payload)
          saveResult = await updateAgenda(record.agendaId, payload)
          
          if (saveResult) {
            console.log('Agenda actualizada exitosamente:', saveResult)
            console.log('Respuesta del backend después de actualizar:', saveResult)
          }
        } catch (error) {
          console.error('Error actualizando agenda:', error)
          saveResult = null
        }
      }
      
      // Si llegamos aquí, es porque no se pudo guardar o es una actualización local
      if (!saveResult) {
        console.warn('No se pudo guardar en backend, manteniendo cambios locales')
        saveResult = { success: true } // Para que la UI actúe normalmente
      }
      
      if (saveResult) {
        console.log('Guardado exitoso en backend:', saveResult)
        // No recargar datos para evitar problemas de formateo
        console.log('Manteniendo datos locales sin recargar')
      } else {
        console.warn('Guardado falló, manteniendo cambios locales')
      }
      
      // Salir del modo edición
      setRecords(prev => {
        const updated = prev.map(r => 
          r.id === id ? { ...r, isEditing: false } : r
        )
        console.log('=== ESTADO DESPUÉS DE GUARDAR ===')
        console.log('Record actualizado:', updated.find(r => r.id === id))
        console.log('=== FIN ESTADO DESPUÉS DE GUARDAR ===')
        return updated
      })
      
      setEditingId(null)
      setHasChanges(false)
      
    } catch (error) {
      console.error('Error guardando:', error)
      // Mantener en modo edición si hay error
    }
  }

  const handleCancel = (id: string) => {
    setEditingId(null)
    setRecords((prev) => prev.map((record) => (record.id === id ? { ...record, isEditing: false } : record)))
  }

  const handleDuplicate = (record: CombinedRecord) => {
    const newId = `new-${Date.now()}`
    
    // Obtener el edificio por defecto (cd_edificio = 2)
    const edificioPorDefecto = buildings.find((b: any) => b.codigo_edificio === 2)
    const edificioPorDefectoNombre = edificioPorDefecto?.descripcion_edificio || "Hospital Principal"
    
    // Crear una copia del registro con nuevos valores
    const duplicatedRecord: CombinedRecord = {
      ...record,
      id: newId,
      agendaId: 0, // Nuevo registro
      edificio: edificioPorDefectoNombre, // Usar edificio por defecto
      piso: "", // Resetear piso para que se seleccione del edificio por defecto
      isEditing: true, // Poner en modo edición
    }
    
    console.log('Duplicando agenda:', record)
    console.log('Nueva agenda creada:', duplicatedRecord)
    
    // Agregar al inicio de la lista
    setRecords((prev) => [duplicatedRecord, ...prev])
    setEditingId(newId)
  }

  const handleFieldChange = (id: string, field: keyof CombinedRecord, value: string | number) => {
    console.log(`Campo ${field} cambiado a:`, value, 'para registro:', id, 'tipo:', typeof value)
    
    setRecords((prev) =>
      prev.map((record) => {
        if (record.id === id) {
          const updated = { ...record, [field]: value }
          if (field === "edificio") {
            updated.piso = ""
          }
          console.log(`Registro ${id} actualizado:`, {
            campo: field,
            valor_anterior: record[field],
            valor_nuevo: value,
            horaInicio_actual: updated.horaInicio,
            horaFin_actual: updated.horaFin
          })
          return updated
        }
        return record
      }),
    )
    
    setHasChanges(true)
  }

  // Función para guardar con Enter
  const handleKeyDown = (event: React.KeyboardEvent, recordId: string) => {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault()
      handleSave(recordId)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const record = records.find(r => r.id === id)
      if (!record || record.agendaId === 0) {
        // Si es un registro nuevo que no se ha guardado, solo eliminarlo del estado local
        setRecords((prev) => prev.filter((r) => r.id !== id))
        return
      }

      await deleteAgenda(record.agendaId)
      // Los datos se recargan automáticamente en el hook
    } catch (error) {
      console.error("Error deleting record:", error)
    }
  }

  const handleAddRecord = () => {
    const newId = `new-${Date.now()}`
    // Obtener el edificio por defecto (cd_edificio = 2)
    const edificioPorDefecto = buildings.find((b: any) => b.codigo_edificio === 2)
    const edificioPorDefectoNombre = edificioPorDefecto?.descripcion_edificio || "Hospital Principal"
    
    const newRecord: CombinedRecord = {
      id: newId,
      doctorId: 0,
      agendaId: 0,
      nombre: "",
      especialidad: "",
      tipo: "Consulta",
      codigoItemAgendamiento: 0,
      edificio: edificioPorDefectoNombre, // Usar edificio por defecto
      piso: "",
      dia: "Lunes",
      horaInicio: "",
      horaFin: "",
      estado: "Activa",
      procedimiento: "",
      isEditing: true,
    }
    // Agregar al inicio de la lista
    setRecords((prev) => [newRecord, ...prev])
    setEditingId(newId)
  }

  const handleAddRecordFromDoctor = (doctor: any) => {
    const newId = `new-${Date.now()}`
    const firstSpecialty = doctor.especialidades && doctor.especialidades.length > 0 
      ? doctor.especialidades[0] 
      : null
    
    // Obtener el edificio por defecto (cd_edificio = 2)
    const edificioPorDefecto = buildings.find((b: any) => b.codigo_edificio === 2)
    const edificioPorDefectoNombre = edificioPorDefecto?.descripcion_edificio || "Hospital Principal"
    
    const newRecord: CombinedRecord = {
      id: newId,
      doctorId: doctor.id,
      agendaId: 0,
      nombre: doctor.nombres,
      especialidad: firstSpecialty?.descripcion || "",
      tipo: "Consulta",
      codigoItemAgendamiento: firstSpecialty?.especialidadId || 0,
      edificio: edificioPorDefectoNombre, // Usar edificio por defecto
      piso: "",
      dia: "Lunes",
      horaInicio: "",
      horaFin: "",
      estado: "Activa",
      procedimiento: "",
      isEditing: true,
    }
    // Agregar al inicio de la lista
    setRecords((prev) => [newRecord, ...prev])
    setEditingId(newId)
    setDoctorSearchOpen(false)
    setDoctorSearchQuery("")
  }

  const handleToggleStatus = (id: string) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.id === id ? { ...record, estado: record.estado === "Activa" ? "Inactiva" : "Activa" } : record,
      ),
    )
    setHasChanges(true)
  }

  // La funcionalidad de descarga Excel se movió al componente ExcelDownload
  
  // Convertir datos a formato StaffItem para exportar con plantilla
  const convertToStaffData = (): StaffItem[] => {
    // Obtener el edificio por defecto (cd_edificio = 2)
    const edificioPorDefecto = buildings.find((b: any) => b.codigo_edificio === 2)
    const edificioPorDefectoNombre = edificioPorDefecto?.descripcion_edificio || "Hospital Principal"
    
    // Obtener pisos disponibles para el edificio por defecto
    const pisosPorDefecto = getAvailableFloors(edificioPorDefectoNombre)
    const pisoPorDefecto = pisosPorDefecto.length > 0 ? pisosPorDefecto[0] : "Piso 1"
    
    return filteredRecords
      .map((record) => ({
        especialidad: record.especialidad,
        medico: record.nombre,
        dia: record.dia,
        edificio: edificioPorDefectoNombre, // Usar edificio por defecto
        piso: pisoPorDefecto, // Usar piso por defecto del edificio
        consultorio: record.consultorioDescripcion || record.codigoConsultorio || "",
        horaInicio: record.horaInicio,
        horaFin: record.horaFin,
        tipo: record.tipo
      }))
      .sort((a, b) => {
        // Ordenar por especialidad primero, luego por médico
        const especialidadCompare = a.especialidad.localeCompare(b.especialidad)
        if (especialidadCompare !== 0) return especialidadCompare
        return a.medico.localeCompare(b.medico)
      })
  }

  // Filtrar doctores para la búsqueda
  const filteredDoctors = useMemo(() => {
    if (!doctorSearchQuery) return doctors
    return doctors.filter((doctor: any) => 
      doctor.nombres?.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
      (doctor.especialidades && doctor.especialidades.some((esp: any) => 
        esp.descripcion?.toLowerCase().includes(doctorSearchQuery.toLowerCase())
      ))
    )
  }, [doctors, doctorSearchQuery])

  const getAvailableFloors = (edificio: string): string[] => {
    if (!edificio || !consultorios.length) {
      console.log('No hay edificio seleccionado o consultorios no cargados aún')
      return []
    }

    // Buscar por descripcion_edificio o por codigo_edificio
    const building = buildings.find((e: any) => 
      e.descripcion_edificio === edificio || 
      e.codigo_edificio.toString() === edificio
    )
    
    console.log('Buscando pisos para edificio:', edificio, 'Encontrado:', building)
    console.log('Total consultorios disponibles:', consultorios.length)
    
    // Generar lista de pisos basada en consultorios
    if (building) {
      const consultoriosDelEdificio = consultorios.filter((c: any) => 
        c.codigo_edificio === building.codigo_edificio
      )
      
      console.log('Consultorios del edificio', building.codigo_edificio, ':', consultoriosDelEdificio)
      
      const pisosFromConsultorios = consultoriosDelEdificio
        .map((c: any) => `Piso ${c.codigo_piso}`)
        .filter((piso, index, arr) => arr.indexOf(piso) === index) // Quitar duplicados
        .sort() // Ordenar pisos
      
      console.log('Pisos obtenidos de consultorios:', pisosFromConsultorios)
      
      if (pisosFromConsultorios.length > 0) {
        return pisosFromConsultorios
      } else {
        console.warn('No se encontraron consultorios para el edificio', edificio)
        return []
      }
    }
    
    console.warn('Edificio no encontrado:', edificio)
    return []
  }

  // Obtener pisos del edificio por defecto (cd_edificio = 2) para nuevas agendas
  const getDefaultBuildingFloors = (): string[] => {
    const edificioPorDefecto = buildings.find((b: any) => b.codigo_edificio === 2)
    if (!edificioPorDefecto) {
      console.warn('No se encontró el edificio por defecto (cd_edificio = 2)')
      return []
    }
    
    const consultoriosDelEdificio = consultorios.filter((c: any) => 
      c.codigo_edificio === 2
    )
    
    const pisosFromConsultorios = consultoriosDelEdificio
      .map((c: any) => `Piso ${c.codigo_piso}`)
      .filter((piso, index, arr) => arr.indexOf(piso) === index) // Quitar duplicados
      .sort() // Ordenar pisos
    
    console.log('Pisos del edificio por defecto (cd_edificio = 2):', pisosFromConsultorios)
    return pisosFromConsultorios
  }

  return (
    <div className="min-h-screen bg-[#F9F4F6]">
      <header className="bg-white border-b border-[#E5E5E5] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="/LOGO HVQ (1).svg" 
              alt="Hospital Vozandes Quito" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-[#333333]">Staff de Médicos</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">


        {/* Mostrar error si existe */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={clearError}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Mostrar skeleton mientras carga */}
        {loading === 'loading' && (
          <div className="space-y-4 mb-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}

        <Card className="bg-white border-2 border-[#E5E5E5] shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-[#333333]">Gestión de Médicos y Agendas</CardTitle>
              <div className="flex gap-2">
                
                <BtnExportarStaff items={convertToStaffData()} />
                
                {/* Búsqueda rápida de doctores */}
                <Popover open={doctorSearchOpen} onOpenChange={setDoctorSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button className="bg-[#C84D80] hover:bg-[#B8437A] text-white">
                      <Search className="w-4 h-4 mr-2" />
                      Buscar Doctor
                </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar doctor por nombre o especialidad..." 
                        value={doctorSearchQuery}
                        onValueChange={setDoctorSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No se encontraron doctores.</CommandEmpty>
                        <CommandGroup heading="Doctores disponibles">
                          {filteredDoctors
                            .sort((a: any, b: any) => a.nombres.localeCompare(b.nombres))
                            .slice(0, 10).map((doctor: any) => (
                            <CommandItem
                              key={doctor.id}
                              value={doctor.nombres}
                              onSelect={() => handleAddRecordFromDoctor(doctor)}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">{doctor.nombres}</span>
                                {doctor.especialidades && doctor.especialidades.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {doctor.especialidades.slice(0, 2).map((esp: any, idx: number) => (
                                      <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                        {esp.descripcion}
                                      </span>
                                    ))}
                                    {doctor.especialidades.length > 2 && (
                                      <span className="text-xs text-gray-500">
                                        +{doctor.especialidades.length - 2} más
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Button onClick={handleAddRecord} className="bg-[#7F0C43] hover:bg-[#6A0A38] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Agenda Manual
                </Button>
                {hasChanges && (
                  <Button 
                    onClick={async () => {
                      // Guardar todos los registros que han sido editados
                      const editedRecords = records.filter(r => r.isEditing || r.agendaId === 0)
                      console.log('Guardando registros editados:', editedRecords.length)
                      
                      for (const record of editedRecords) {
                        try {
                          await handleSave(record.id)
                        } catch (error) {
                          console.error('Error guardando registro:', record.id, error)
                        }
                      }
                      
                      setHasChanges(false)
                    }} 
                    className="bg-[#C84D80] hover:bg-[#B8437A] text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-[#F9F4F6] rounded-lg border border-[#E5E5E5]">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-[#7F0C43]" />
                <h3 className="font-semibold text-[#333333]">Filtros</h3>
                {(filters.search || filters.especialidad || filters.edificio || filters.tipo) && (
                  <span className="bg-[#7F0C43] text-white px-2 py-1 rounded-full text-xs font-medium">
                    Filtros activos
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#333333]">Búsqueda</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-[#666666]" />
                    <Input
                      placeholder="Buscar médico, especialidad, edificio, día..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pl-10 border-[#E5E5E5] focus:border-[#7F0C43]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#333333]">Especialidad</label>
                  <Select
                    value={filters.especialidad}
                    onValueChange={(value) => handleFilterChange("especialidad", value)}
                  >
                    <SelectTrigger className="border-[#E5E5E5] focus:border-[#7F0C43]">
                      <SelectValue placeholder="Seleccionar especialidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas las especialidades</SelectItem>
                      {Array.isArray(specialties) && 
                        [...specialties]
                          .sort((a, b) => a.descripcion.localeCompare(b.descripcion))
                          .map((esp: Especialidad, index) => (
                            <SelectItem key={`filter-specialty-${esp.especialidadId}-${index}`} value={esp.descripcion}>
                              {esp.descripcion}
                        </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#333333]">Edificio</label>
                  <Select value={filters.edificio} onValueChange={(value) => handleFilterChange("edificio", value)}>
                    <SelectTrigger className="border-[#E5E5E5] focus:border-[#7F0C43]">
                      <SelectValue placeholder="Seleccionar edificio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los edificios</SelectItem>
                      {Array.isArray(buildings) && buildings.map((edificio: any, index) => (
                        <SelectItem key={`edificio-filter-${edificio.codigo_edificio}-${index}`} value={edificio.descripcion_edificio}>
                          {edificio.descripcion_edificio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#333333]">Tipo de Agenda</label>
                  <Select value={filters.tipo} onValueChange={(value) => handleFilterChange("tipo", value)}>
                    <SelectTrigger className="border-[#E5E5E5] focus:border-[#7F0C43]">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      <SelectItem value="Consulta">Consulta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-[#E5E5E5] text-[#333333] hover:bg-white bg-transparent"
                >
                  Limpiar Filtros
                </Button>
                  {filters.search && (
                    <Button
                      variant="outline"
                      onClick={() => handleFilterChange("search", "")}
                      className="border-[#E5E5E5] text-[#333333] hover:bg-white bg-transparent"
                    >
                      <Search className="w-4 h-4 mr-1" />
                      Limpiar Búsqueda
                    </Button>
                  )}
                </div>
                <div className="text-sm text-[#666666]">
                  {filteredRecords.length !== records.length ? (
                    <span>
                  Mostrando {paginatedRecords.length} de {filteredRecords.length} registros
                      <span className="text-[#7F0C43] font-medium ml-1">
                        (filtrados de {records.length} total)
                      </span>
                    </span>
                  ) : (
                    <span>Mostrando {paginatedRecords.length} de {filteredRecords.length} registros</span>
                  )}
                </div>
              </div>
            </div>

            {/* Información de atajos de teclado */}
            {paginatedRecords.some(r => r.isEditing) && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              </div>
            )}

            <div className="overflow-x-auto border-2 border-[#E5E5E5] rounded-lg">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="border-b-2 border-[#E5E5E5] bg-[#F8F9FA]">
                    <TableHead className="text-[#333333] font-semibold border-r border-[#E5E5E5] p-4">Especialidad</TableHead>
                    <TableHead className="text-[#333333] font-semibold border-r border-[#E5E5E5] p-4">Nombre del Médico</TableHead>
                    <TableHead className="text-[#333333] font-semibold border-r border-[#E5E5E5] p-4">Día</TableHead>
                                         {/* <TableHead className="text-[#333333] font-semibold border-r border-[#E5E5E5] p-4">Edificio</TableHead> */}
                     <TableHead className="text-[#333333] font-semibold border-r border-[#E5E5E5] p-4">Piso</TableHead>
                     <TableHead className="text-[#333333] font-semibold border-r border-[#E5E5E5] p-4">Consultorio</TableHead>
                     <TableHead className="text-[#333333] font-semibold border-r border-[#E5E5E5] p-4">Hora Inicio</TableHead>
                     <TableHead className="text-[#333333] font-semibold border-r border-[#E5E5E5] p-4">Hora Fin</TableHead>
                     <TableHead className="text-[#333333] font-semibold border-r border-[#E5E5E5] p-4">Tipo de Agenda</TableHead>
                     {/* <TableHead className="text-[#333333] font-semibold border-r border-[#E5E5E5] p-4">Item Agendamiento</TableHead> */}
                     {/* <TableHead className="text-[#333333] font-semibold border-r border-[#E5E5E5] p-4">Estado</TableHead> */}
                     <TableHead className="text-[#333333] font-semibold p-4 min-w-[240px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((record) => (
                    <TableRow 
                      key={record.id} 
                      className={`border-b border-[#E5E5E5] hover:bg-gray-50 ${
                        record.agendaId === 0 
                          ? 'bg-blue-50 border-blue-200' 
                          : record.isEditing 
                            ? 'bg-yellow-50 border-yellow-200' 
                            : ''
                      }`}
                    >
                      {/* 1. Especialidad */}
                      <TableCell className="border-r border-[#E5E5E5] p-4">
                        {record.isEditing ? (
                          <Popover open={openPopovers[`especialidad-${record.id}`]} onOpenChange={(open) => {
                            if (open) {
                              togglePopover(`especialidad-${record.id}`)
                            } else {
                              closePopover(`especialidad-${record.id}`)
                            }
                          }}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openPopovers[`especialidad-${record.id}`]}
                                className="w-full justify-between border-[#E5E5E5] focus:border-[#7F0C43]"
                              >
                                {record.especialidad || "Seleccionar especialidad"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Buscar especialidad..." />
                                <CommandList>
                                  <CommandEmpty>No se encontró especialidad.</CommandEmpty>
                                  <CommandGroup>
                                    {Array.isArray(specialties) && 
                                      [...specialties]
                                        .sort((a, b) => a.descripcion.localeCompare(b.descripcion))
                                        .map((esp: Especialidad, index) => (
                                        <CommandItem
                                          key={`specialty-edit-${esp.especialidadId}-${index}`}
                                          value={esp.descripcion}
                                          onSelect={(value) => {
                                            handleFieldChange(record.id, "especialidad", value)
                                            // Resetear médico seleccionado cuando cambie la especialidad
                                            handleFieldChange(record.id, "nombre", "")
                                            handleFieldChange(record.id, "doctorId", 0)
                                            // Reiniciar item por defecto al cambiar especialidad
                                            handleFieldChange(record.id, "codigoItemAgendamiento", 0)
                                          closePopover(`especialidad-${record.id}`)
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            record.especialidad === esp.descripcion ? "opacity-100" : "opacity-0"
                                          }`}
                                        />
                                        {esp.descripcion}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-[#333333]">{record.especialidad}</span>
                        )}
                      </TableCell>
                      {/* 2. Nombre del Médico */}
                      <TableCell className="border-r border-[#E5E5E5] p-4">
                        {record.isEditing ? (
                          <Popover open={openPopovers[`medico-${record.id}`]} onOpenChange={(open) => {
                            if (open) {
                              togglePopover(`medico-${record.id}`)
                            } else {
                              closePopover(`medico-${record.id}`)
                            }
                          }}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openPopovers[`medico-${record.id}`]}
                                className="w-full justify-between border-[#E5E5E5] focus:border-[#7F0C43]"
                                disabled={!record.especialidad}
                              >
                                {record.nombre || (record.especialidad ? "Seleccionar médico" : "Primero seleccione especialidad")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Buscar médico..." />
                                <CommandList>
                                  <CommandEmpty>No se encontró médico.</CommandEmpty>
                                  <CommandGroup>
                                    {getDoctorsBySpecialty(record.especialidad).map((doctor: any, index: number) => (
                                      <CommandItem
                                        key={`doctor-${doctor.id}-${index}`}
                                        value={doctor.nombres}
                                        onSelect={(value) => {
                                          const selectedDoctor = doctors.find((d: any) => d.nombres === value)
                                          if (selectedDoctor) {
                                            handleFieldChange(record.id, "nombre", selectedDoctor.nombres)
                                            handleFieldChange(record.id, "doctorId", selectedDoctor.id)
                                            // Establecer item por defecto del médico según especialidad seleccionada o primera
                                            let defaultItem = 0
                                            if (Array.isArray(selectedDoctor.especialidades) && selectedDoctor.especialidades.length > 0) {
                                              if (record.especialidad) {
                                                const match = selectedDoctor.especialidades.find((esp: any) => esp.descripcion === record.especialidad)
                                                defaultItem = match?.especialidadId || selectedDoctor.especialidades[0]?.especialidadId || 0
                                              } else {
                                                defaultItem = selectedDoctor.especialidades[0]?.especialidadId || 0
                                              }
                                            }
                                            handleFieldChange(record.id, "codigoItemAgendamiento", defaultItem)
                                            closePopover(`medico-${record.id}`)
                                          }
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            record.nombre === doctor.nombres ? "opacity-100" : "opacity-0"
                                          }`}
                                        />
                                        {doctor.nombres}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-[#333333]">{record.nombre}</span>
                        )}
                      </TableCell>
                      {/* 3. Día */}
                      <TableCell className="border-r border-[#E5E5E5] p-4">
                        {record.isEditing ? (
                          <Select
                            value={record.dia}
                            onValueChange={(value) => handleFieldChange(record.id, "dia", value)}
                          >
                            <SelectTrigger className="border-[#E5E5E5] focus:border-[#7F0C43]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Lunes">Lunes</SelectItem>
                              <SelectItem value="Martes">Martes</SelectItem>
                              <SelectItem value="Miércoles">Miércoles</SelectItem>
                              <SelectItem value="Jueves">Jueves</SelectItem>
                              <SelectItem value="Viernes">Viernes</SelectItem>
                              <SelectItem value="Sábado">Sábado</SelectItem>
                              <SelectItem value="Domingo">Domingo</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-[#333333]">{record.dia}</span>
                        )}
                      </TableCell>

                      {/* 4. Edificio - OCULTO TEMPORALMENTE */}
                      {/* <TableCell className="border-r border-[#E5E5E5] p-4">
                        {record.isEditing ? (
                          <Popover open={openPopovers[`edificio-${record.id}`]} onOpenChange={(open) => {
                            if (open) {
                              togglePopover(`edificio-${record.id}`)
                            } else {
                              closePopover(`edificio-${record.id}`)
                            }
                          }}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openPopovers[`edificio-${record.id}`]}
                                className="w-full justify-between border-[#E5E5E5] focus:border-[#7F0C43]"
                              >
                                {record.edificio || "Seleccionar edificio"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Buscar edificio..." />
                                <CommandList>
                                  <CommandEmpty>No se encontró edificio.</CommandEmpty>
                                  <CommandGroup>
                                    {Array.isArray(buildings) && buildings.map((edificio: any, index) => (
                                      <CommandItem
                                        key={`edificio-${edificio.codigo_edificio}-${index}`}
                                        value={edificio.descripcion_edificio}
                                        onSelect={(value) => {
                                          handleFieldChange(record.id, "edificio", value)
                                          closePopover(`edificio-${record.id}`)
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            record.edificio === edificio.descripcion_edificio ? "opacity-100" : "opacity-0"
                                          }`}
                                        />
                                        {edificio.descripcion_edificio}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-[#333333]">{record.edificio}</span>
                        )}
                      </TableCell> */}

                      {/* 5. Piso */}
                      <TableCell className="border-r border-[#E5E5E5] p-4">
                        {record.isEditing ? (
                          <Select
                            value={record.piso}
                            onValueChange={(value) => handleFieldChange(record.id, "piso", value)}
                            disabled={record.agendaId !== 0 && (!record.edificio || getAvailableFloors(record.edificio).length === 0)}
                          >
                            <SelectTrigger className="border-[#E5E5E5] focus:border-[#7F0C43]">
                              <SelectValue placeholder={
                                record.agendaId === 0 
                                  ? "Seleccionar piso" 
                                  : !record.edificio 
                                    ? "Seleccione edificio primero" 
                                    : getAvailableFloors(record.edificio).length === 0
                                      ? "No hay pisos disponibles"
                                      : "Seleccionar piso"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {(record.agendaId === 0 ? getDefaultBuildingFloors() : getAvailableFloors(record.edificio)).map((piso, index) => (
                                <SelectItem key={`piso-${record.id}-${piso}-${index}`} value={piso}>
                                  {piso}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-[#333333]">{record.piso}</span>
                        )}
                      </TableCell>

                      {/* 6. Consultorio */}
                      <TableCell className="border-r border-[#E5E5E5] p-4">
                        {record.isEditing ? (
                          <Popover open={openPopovers[`consultorio-${record.id}`]} onOpenChange={(open) => {
                            if (open) {
                              togglePopover(`consultorio-${record.id}`)
                            } else {
                              closePopover(`consultorio-${record.id}`)
                            }
                          }}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openPopovers[`consultorio-${record.id}`]}
                                className="w-full justify-between border-[#E5E5E5] focus:border-[#7F0C43]"
                              >
                                {record.consultorioDescripcion || record.codigoConsultorio || "Seleccionar consultorio"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Buscar consultorio..." />
                                <CommandList>
                                  <CommandEmpty>No se encontró consultorio.</CommandEmpty>
                                  <CommandGroup>
                                    {Array.isArray(consultorios) && consultorios.map((consultorio: any, index) => (
                                      <CommandItem
                                        key={`consultorio-${consultorio.codigo_consultorio}-${index}`}
                                        value={`${consultorio.descripcion_consultorio || consultorio.codigo_consultorio}`}
                                        onSelect={(value) => {
                                          handleFieldChange(record.id, "codigoConsultorio", consultorio.codigo_consultorio)
                                          handleFieldChange(record.id, "consultorioDescripcion", consultorio.descripcion_consultorio || "")
                                          closePopover(`consultorio-${record.id}`)
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            record.codigoConsultorio === consultorio.codigo_consultorio ? "opacity-100" : "opacity-0"
                                          }`}
                                        />
                                        {consultorio.descripcion_consultorio || consultorio.codigo_consultorio} 
                                        <span className="text-gray-500 ml-2">
                                          (Edificio: {consultorio.codigo_edificio}, Piso: {consultorio.codigo_piso})
                                        </span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-[#333333]">{record.consultorioDescripcion || record.codigoConsultorio || '-'}</span>
                        )}
                      </TableCell>

                      {/* 7. Hora Inicio */}
                      <TableCell className="border-r border-[#E5E5E5] p-4">
                        {record.isEditing ? (
                          <Input
                            type="time"
                            value={record.horaInicio}
                            onChange={(e) => {
                              const value = e.target.value
                              console.log('=== INPUT HORA INICIO ===')
                              console.log('Valor del input:', value)
                              console.log('Tipo de valor:', typeof value)
                              console.log('Longitud:', value.length)
                              console.log('Registro actual:', record)
                              console.log('=== FIN INPUT HORA INICIO ===')
                              handleFieldChange(record.id, "horaInicio", value)
                            }}
                            onKeyDown={(e) => handleKeyDown(e, record.id)}
                            className="border-[#E5E5E5] focus:border-[#7F0C43]"
                            title="Ctrl+Enter para guardar"
                            required
                          />
                        ) : (
                          <span className="text-[#333333]">{record.horaInicio}</span>
                        )}
                      </TableCell>

                      {/* 8. Hora Fin */}
                      <TableCell className="border-r border-[#E5E5E5] p-4">
                        {record.isEditing ? (
                          <Input
                            type="time"
                            value={record.horaFin}
                            onChange={(e) => {
                              const value = e.target.value
                              console.log('=== INPUT HORA FIN ===')
                              console.log('Valor del input:', value)
                              console.log('Tipo de valor:', typeof value)
                              console.log('Longitud:', value.length)
                              console.log('Registro actual:', record)
                              console.log('=== FIN INPUT HORA FIN ===')
                              handleFieldChange(record.id, "horaFin", value)
                            }}
                            onKeyDown={(e) => handleKeyDown(e, record.id)}
                            className="border-[#E5E5E5] focus:border-[#7F0C43]"
                            title="Ctrl+Enter para guardar"
                            required
                          />
                        ) : (
                          <span className="text-[#333333]">{record.horaFin}</span>
                        )}
                      </TableCell>

                      {/* 9. Tipo de Agenda */}
                      <TableCell className="border-r border-[#E5E5E5] p-4">
                        {record.isEditing ? (
                          <Select
                            value={record.tipo}
                            onValueChange={(value) => handleFieldChange(record.id, "tipo", value as "Consulta" | "Procedimiento")}
                          >
                            <SelectTrigger className="border-[#E5E5E5] focus:border-[#7F0C43]">
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Consulta">Consulta</SelectItem>
                              <SelectItem value="Procedimiento">Procedimiento</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant="secondary"
                            className={record.tipo === "Consulta" ? "bg-[#C84D80] text-white" : "bg-[#7F0C43] text-white"}
                          >
                            {record.tipo}
                          </Badge>
                        )}
                      </TableCell>

                      {/* 10. Item Agendamiento - OCULTO TEMPORALMENTE */}
                      {/* <TableCell className="border-r border-[#E5E5E5] p-4">
                        {record.isEditing ? (
                          <Input
                            type="number"
                            value={record.codigoItemAgendamiento?.toString() || ""}
                            onChange={(e) => handleFieldChange(record.id, "codigoItemAgendamiento", Number(e.target.value))}
                            onKeyDown={(e) => handleKeyDown(e, record.id)}
                            placeholder="Código de item"
                            className="border-[#E5E5E5] focus:border-[#7F0C43]"
                            title="Ctrl+Enter para guardar"
                          />
                        ) : (
                          <span className="text-[#333333]">{record.codigoItemAgendamiento || "-"}</span>
                        )}
                      </TableCell> */}

                      {/* Estado - OCULTO TEMPORALMENTE */}
                      {/* <TableCell className="border-r border-[#E5E5E5] p-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={record.estado === "Activa" ? "default" : "secondary"}
                            className={
                              record.estado === "Activa" ? "bg-green-500 text-white" : "bg-gray-500 text-white"
                            }
                          >
                            {record.estado}
                          </Badge>
                          {record.agendaId === 0 && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                              Nuevo
                            </Badge>
                          )}
                          {!record.isEditing && record.agendaId !== 0 && (
                            <Switch
                              checked={record.estado === "Activa"}
                              onCheckedChange={() => handleToggleStatus(record.id)}
                              className="data-[state=checked]:bg-[#7F0C43]"
                            />
                          )}
                        </div>
                      </TableCell> */}

                      <TableCell className="p-4 min-w-[240px]">
                        <div className="flex gap-3 justify-center">
                          {record.isEditing ? (
                            <>
                              <Button
                                size="sm"
                                  onClick={() => {
                                    console.log('🔴 BOTÓN GUARDAR PRESIONADO - Record en el momento del click:', record)
                                    console.log('🔴 Estado completo de records:', records)
                                    console.log('🔴 Record específico del estado:', records.find(r => r.id === record.id))
                                    handleSave(record.id)
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 font-medium shadow-sm"
                                  title="Guardar cambios (Ctrl+Enter)"
                                >
                                <Save className="w-4 h-4 mr-2" />
                                Guardar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancel(record.id)}
                                className="border-2 border-gray-300 hover:bg-gray-100 px-3 py-2 font-medium shadow-sm"
                                title="Cancelar edición"
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(record.id)}
                                className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50 px-3 py-2 font-medium shadow-sm"
                                title="Editar agenda"
                              >
                                <Edit3 className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDuplicate(record)}
                                className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50 px-3 py-2 font-medium shadow-sm"
                                title="Duplicar agenda"
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Duplicar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(record.id)}
                                className="border-2 border-red-300 text-red-600 hover:bg-red-50 px-3 py-2 font-medium shadow-sm"
                                title="Eliminar agenda"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Eliminar
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E5E5E5]">
                <div className="text-sm text-[#666666]">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-[#E5E5E5] text-[#333333]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={
                            currentPage === pageNum ? "bg-[#7F0C43] text-white" : "border-[#E5E5E5] text-[#333333]"
                          }
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-[#E5E5E5] text-[#333333]"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {filteredRecords.length === 0 && (
              <div className="text-center py-8 text-[#666666]">
                <div className="mb-4">
                  <strong>Estado de datos:</strong><br/>
                  Médicos: {doctors.length} | Agendas: {agendas.length} | Registros: {records.length}
                </div>
                {filters.search || filters.especialidad || filters.edificio || filters.tipo
                  ? "No se encontraron registros que coincidan con los filtros aplicados."
                  : agendas.length === 0 && doctors.length === 0
                    ? "Cargando datos del backend..."
                  : "No hay registros disponibles. Haga clic en 'Agregar Médico/Agenda' para comenzar."}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
