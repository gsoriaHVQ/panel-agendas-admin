"use client"

import { useState, useEffect } from "react"
import { apiService } from "@/lib/api-service"
import type { Doctor, Agenda, Edificio } from "@/lib/types"

interface CombinedRecord {
  id: string
  doctorId: number
  agendaId: number
  nombre: string
  especialidad: string
  tipo: "Consulta" | "Procedimiento"
  edificio: string
  piso: string
  fecha: string
  estado: string
  isEditing: boolean
}

export function useMedicalData() {
  const [records, setRecords] = useState<CombinedRecord[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [buildings, setBuildings] = useState<Edificio[]>([])
  const [specialties, setSpecialties] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [doctorsRes, agendasRes, buildingsRes, specialtiesRes] = await Promise.all([
        apiService.getDoctors(),
        apiService.getAgendas(),
        apiService.getBuildings(),
        apiService.getSpecialties(),
      ])

      if (!doctorsRes.success || !agendasRes.success || !buildingsRes.success || !specialtiesRes.success) {
        throw new Error("Failed to load data")
      }

      setDoctors(doctorsRes.data || [])
      setAgendas(agendasRes.data || [])
      setBuildings(buildingsRes.data || [])
      setSpecialties(specialtiesRes.data || [])
      
      // Combine data for table display
      const combinedRecords: CombinedRecord[] = (agendasRes.data || []).map((agenda) => {
        const doctor = (doctorsRes.data || []).find((d) => d.codigo_item?.toString() === agenda.codigo_prestador?.toString())
        return {
          id: `${agenda.codigo_agenda || 0}-${doctor?.id || 0}`, 
          doctorId: doctor?.id || 0,
          agendaId: agenda.codigo_agenda || 0,
          nombre: doctor?.nombres || "Doctor no encontrado",
          especialidad: doctor?.especialidades?.[0]?.descripcion || "Sin especialidad",
          tipo: agenda.tipo === "C" ? "Consulta" : "Procedimiento",
          edificio: agenda.edificio || "Sin edificio",
          piso: agenda.piso || "Sin piso",
          fecha: agenda.hora_inicio || "", // Usar hora_inicio como fecha
          estado: agenda.estado || "Activa",
          isEditing: false,
        }
      })

      setRecords(combinedRecords)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const saveRecord = async (record: CombinedRecord) => {
    try {
      if (record.agendaId === 0) {
        // Create new agenda
        const newAgenda = {
          codigo_prestador: record.doctorId,
          tipo: record.tipo === "Consulta" ? "C" : "P",
          edificio: record.edificio,
          piso: record.piso,
          hora_inicio: record.fecha, // Usar fecha como hora_inicio
          estado: record.estado,
        }

        const result = await apiService.createAgenda(newAgenda)
        if (!result.success) {
          throw new Error(result.message || "Failed to create agenda")
        }
      } else {
        // Update existing agenda
        const updatedAgenda = {
          tipo: record.tipo === "Consulta" ? "C" : "P",
          edificio: record.edificio,
          piso: record.piso,
          hora_inicio: record.fecha, // Usar fecha como hora_inicio
          estado: record.estado,
        }

        const result = await apiService.updateAgenda(record.agendaId, updatedAgenda)
        if (!result.success) {
          throw new Error(result.message || "Failed to update agenda")
        }
      }

      // Reload data to reflect changes
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save record")
      throw err
    }
  }

  const deleteRecord = async (record: CombinedRecord) => {
    try {
      const result = await apiService.deleteAgenda(record.agendaId)
      if (!result.success) {
        throw new Error(result.message || "Failed to delete agenda")
      }

      // Remove from local state
      setRecords((prev) => prev.filter((r) => r.id !== record.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete record")
      throw err
    }
  }

  return {
    records,
    setRecords,
    doctors,
    agendas,
    buildings,
    specialties,
    loading,
    error,
    loadData,
    saveRecord,
    deleteRecord,
  }
}
