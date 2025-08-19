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
} from "lucide-react"
import { useBackendAPI } from "@/hooks/use-backend-api"
import { ConnectionStatus } from "@/components/connection-status"
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
    if (!especialidadDescripcion || especialidadDescripcion === "todas") return doctors
    const especialidadId = getEspecialidadIdByDescripcion(especialidadDescripcion)
    if (!especialidadId) return []
    
    return doctors.filter((doctor: any) => 
      doctor.especialidades && 
      doctor.especialidades.some((esp: any) => esp.especialidadId === especialidadId)
    )
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

        // Formatear horas desde ISO string
        const formatearHora = (isoString: string) => {
          if (!isoString) return ''
          try {
            const fecha = new Date(isoString)
            const horas = fecha.getHours().toString().padStart(2, '0')
            const minutos = fecha.getMinutes().toString().padStart(2, '0')
            return `${horas}:${minutos}`
          } catch (e) {
            console.warn('Error formateando hora:', isoString, e)
            return ''
          }
        }

        const horaInicio = formatearHora(agenda.hora_inicio)
        const horaFin = formatearHora(agenda.hora_fin)

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
    return records.filter((record) => {
      const matchesEspecialidad = !filters.especialidad || record.especialidad === filters.especialidad
      const matchesEdificio = !filters.edificio || record.edificio === filters.edificio
      const matchesTipo = !filters.tipo || record.tipo === filters.tipo
      const matchesSearch =
        !filters.search ||
        record.nombre.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.especialidad.toLowerCase().includes(filters.search.toLowerCase())

      return matchesEspecialidad && matchesEdificio && matchesTipo && matchesSearch
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
    return `${y}-${m}-${d}`
  }

  // Formato requerido por backend: "YYYY-MM-DD HH:MM"
  const formatearHoraBackend = (horaString: string): string => {
    if (!horaString) {
      const hoy = getTodayDateString()
      return `${hoy} 00:00`
    }
    const [horas, minutos] = horaString.split(':')
    const hoy = getTodayDateString()
    return `${hoy} ${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
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
        return
      }
      const payload: any = {
        codigo_prestador: record.doctorId,
        codigo_consultorio: codigoConsultorio,
        codigo_item_agendamiento: codigoItemAgendamiento,
        codigo_dia: mapearDiaACodigo(record.dia),
        hora_inicio: formatearHoraBackend(record.horaInicio),
        hora_fin: formatearHoraBackend(record.horaFin),
        tipo: encodeTipo(record.tipo)
      }
      
      // Solo incluir codigo_agenda para actualizaciones
      if (record.agendaId !== 0) {
        payload.codigo_agenda = record.agendaId
      }
      
      console.log('Payload para backend:', payload)
      
      console.log('PAYLOAD PARA BACKEND:')
      console.log(JSON.stringify(payload, null, 2))
      
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
            // Remover el registro temporal y recargar datos
            setRecords(prev => prev.filter(r => r.id !== id))
            await loadAgendas()
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
        // Recargar datos para reflejar cambios
        await loadAgendas()
      } else {
        console.warn('Guardado falló, manteniendo cambios locales')
      }
      
      // Salir del modo edición
      setRecords(prev => 
        prev.map(r => 
          r.id === id ? { ...r, isEditing: false } : r
        )
      )
      
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

  const handleFieldChange = (id: string, field: keyof CombinedRecord, value: string | number) => {
    console.log(`Campo ${field} cambiado a:`, value, 'para registro:', id)
    
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
    const newRecord: CombinedRecord = {
      id: newId,
      doctorId: 0,
      agendaId: 0,
      nombre: "",
      especialidad: "",
      tipo: "Consulta",
      codigoItemAgendamiento: 0,
      edificio: "Hospital Principal",
      piso: "",
      dia: "Lunes",
      horaInicio: "08:00",
      horaFin: "12:00",
      estado: "Activa",
      procedimiento: "",
      isEditing: true,
    }
    // Agregar al inicio de la lista
    setRecords((prev) => [newRecord, ...prev])
    setEditingId(newId)
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
    return filteredRecords.map((record) => ({
      especialidad: record.especialidad,
      medico: record.nombre,
      dia: record.dia,
      edificio: record.edificio,
      piso: record.piso,
      consultorio: record.consultorioDescripcion || record.codigoConsultorio || "",
      horaInicio: record.horaInicio,
      horaFin: record.horaFin,
      tipo: record.tipo
    }))
  }

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

  return (
    <div className="min-h-screen bg-[#F9F4F6]">
      <header className="bg-white border-b border-[#E5E5E5] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-[#7F0C43] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#333333]">Agendas Médicas</h1>
              <p className="text-sm text-[#666666]">Hospital Vozandes Quito</p>
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="border-[#E5E5E5] text-[#333333] hover:bg-[#F9F4F6] bg-transparent"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="p-6">
        {/* Estado de conexión con el backend */}
        <div className="mb-4">
          <ConnectionStatus />
        </div>


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

        <Card className="bg-white border-[#E5E5E5]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-[#333333]">Gestión de Médicos y Agendas</CardTitle>
              <div className="flex gap-2">
                
                <BtnExportarStaff items={convertToStaffData()} />
                <Button onClick={handleAddRecord} className="bg-[#7F0C43] hover:bg-[#6A0A38] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Agenda
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#333333]">Búsqueda</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-[#666666]" />
                    <Input
                      placeholder="Buscar médico..."
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
                      {Array.isArray(specialties) && specialties.map((esp: Especialidad, index) => (
                        <SelectItem key={`filter-specialty-${esp.especialidadId}-${index}`} value={esp.descripcion}>
                          {esp.descripcion}
                        </SelectItem>
                      ))}
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
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-[#E5E5E5] text-[#333333] hover:bg-white bg-transparent"
                >
                  Limpiar Filtros
                </Button>
                <div className="text-sm text-[#666666]">
                  Mostrando {paginatedRecords.length} de {filteredRecords.length} registros
                </div>
              </div>
            </div>

            {/* Información de atajos de teclado */}
            {paginatedRecords.some(r => r.isEditing) && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Atajos de teclado:</span>
                  <span className="text-sm">Ctrl+Enter para guardar cambios rápidamente</span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E5E5E5]">
                    <TableHead className="text-[#333333] font-semibold">Especialidad</TableHead>
                    <TableHead className="text-[#333333] font-semibold">Nombre del Médico</TableHead>
                    <TableHead className="text-[#333333] font-semibold">Día</TableHead>
                    <TableHead className="text-[#333333] font-semibold">Edificio</TableHead>
                    <TableHead className="text-[#333333] font-semibold">Piso</TableHead>
                    <TableHead className="text-[#333333] font-semibold">Consultorio</TableHead>
                    <TableHead className="text-[#333333] font-semibold">Hora Inicio</TableHead>
                    <TableHead className="text-[#333333] font-semibold">Hora Fin</TableHead>
                    <TableHead className="text-[#333333] font-semibold">Tipo de Agenda</TableHead>
                    <TableHead className="text-[#333333] font-semibold">Item Agendamiento</TableHead>
                    <TableHead className="text-[#333333] font-semibold">Estado</TableHead>
                    <TableHead className="text-[#333333] font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((record) => (
                    <TableRow 
                      key={record.id} 
                      className={`border-[#E5E5E5] ${
                        record.agendaId === 0 
                          ? 'bg-blue-50 border-blue-200' 
                          : record.isEditing 
                            ? 'bg-yellow-50 border-yellow-200' 
                            : ''
                      }`}
                    >
                      {/* 1. Especialidad */}
                      <TableCell>
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
                                    {Array.isArray(specialties) && specialties.map((esp: Especialidad, index) => (
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
                      <TableCell>
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
                      <TableCell>
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

                      {/* 4. Edificio */}
                      <TableCell>
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
                      </TableCell>

                      {/* 5. Piso */}
                      <TableCell>
                        {record.isEditing ? (
                          <Select
                            value={record.piso}
                            onValueChange={(value) => handleFieldChange(record.id, "piso", value)}
                            disabled={!record.edificio || getAvailableFloors(record.edificio).length === 0}
                          >
                            <SelectTrigger className="border-[#E5E5E5] focus:border-[#7F0C43]">
                              <SelectValue placeholder={
                                !record.edificio 
                                  ? "Seleccione edificio primero" 
                                  : getAvailableFloors(record.edificio).length === 0
                                    ? "No hay pisos disponibles"
                                    : "Seleccionar piso"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableFloors(record.edificio).map((piso, index) => (
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
                      <TableCell>
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
                      <TableCell>
                        {record.isEditing ? (
                          <Input
                            type="time"
                            value={record.horaInicio}
                            onChange={(e) => handleFieldChange(record.id, "horaInicio", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, record.id)}
                            className="border-[#E5E5E5] focus:border-[#7F0C43]"
                            title="Ctrl+Enter para guardar"
                          />
                        ) : (
                          <span className="text-[#333333]">{record.horaInicio}</span>
                        )}
                      </TableCell>

                      {/* 8. Hora Fin */}
                      <TableCell>
                        {record.isEditing ? (
                          <Input
                            type="time"
                            value={record.horaFin}
                            onChange={(e) => handleFieldChange(record.id, "horaFin", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, record.id)}
                            className="border-[#E5E5E5] focus:border-[#7F0C43]"
                            title="Ctrl+Enter para guardar"
                          />
                        ) : (
                          <span className="text-[#333333]">{record.horaFin}</span>
                        )}
                      </TableCell>

                      {/* 9. Tipo de Agenda */}
                      <TableCell>
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

                      {/* 10. Item Agendamiento */}
                      <TableCell>
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
                      </TableCell>

                      <TableCell>
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
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-2">
                          {record.isEditing ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleSave(record.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                title="Guardar cambios (Ctrl+Enter)"
                              >
                                <Save className="w-3 h-3 mr-1" />
                                Guardar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancel(record.id)}
                                className="border-[#E5E5E5]"
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
                                className="border-[#E5E5E5] text-[#333333]"
                                title="Editar agenda"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(record.id)}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                title="Eliminar agenda"
                              >
                                <Trash2 className="w-3 h-3" />
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
