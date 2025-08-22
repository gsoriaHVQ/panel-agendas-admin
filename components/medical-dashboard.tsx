
"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  AlertCircle,
  RefreshCw,
  Check,
  ChevronsUpDown,
} from "lucide-react"

import { useAgendaData } from "@/hooks/use-agenda-data"
import { Header } from "@/components/layout/Header"
import { FilterSection } from "@/components/filters/FilterSection"
import { Pagination } from "@/components/pagination/Pagination"
import { ActionButtons } from "@/components/actions/ActionButtons"
import BtnExportarStaff from "@/components/BtnExportarStaff"
import { COLORS } from "@/lib/constants"
import type { MedicalDashboardProps } from "@/lib/types"

export default function MedicalDashboard({ onLogout }: MedicalDashboardProps) {
  const {
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
  } = useAgendaData()



  // Convertir datos a formato StaffItem para exportar (optimizado)
  const convertToStaffData = useMemo(() => {
    const edificioPorDefecto = buildings.find((b) => b.codigo_edificio === 2)
    const edificioPorDefectoNombre = edificioPorDefecto?.descripcion_edificio || "Hospital Principal"
    const pisosPorDefecto = getAvailableFloors(edificioPorDefectoNombre)
    const pisoPorDefecto = pisosPorDefecto.length > 0 ? pisosPorDefecto[0] : "Piso 1"
    
    return filteredRecords
      .map((record) => ({
        especialidad: record.especialidad,
        medico: record.nombre,
        dia: record.dia,
        edificio: edificioPorDefectoNombre,
        piso: pisoPorDefecto,
        consultorio: record.consultorioDescripcion || record.codigoConsultorio || "",
        horaInicio: record.horaInicio,
        horaFin: record.horaFin,
        tipo: record.tipo
      }))
      .sort((a, b) => {
        const especialidadCompare = a.especialidad.localeCompare(b.especialidad)
        if (especialidadCompare !== 0) return especialidadCompare
        return a.medico.localeCompare(b.medico)
      })
  }, [buildings, getAvailableFloors, filteredRecords])

  // Renderizar celda de tabla (optimizada)
  const renderTableCell = useCallback((record: any, field: string, isEditing: boolean) => {
    if (!isEditing) {
      return <span className="hvq-text-dark">{record[field]}</span>
    }

    switch (field) {
      case 'especialidad':
  return (
          <Popover 
            open={openPopovers[`especialidad-${record.id}`]} 
            onOpenChange={(open) => open ? togglePopover(`especialidad-${record.id}`) : closePopover(`especialidad-${record.id}`)}
          >
                  <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between hvq-border">
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
                    {specialties
                                        .sort((a, b) => a.descripcion.localeCompare(b.descripcion))
                      .map((esp, index) => (
                                        <CommandItem
                                          key={`specialty-edit-${esp.especialidadId}-${index}`}
                                          value={esp.descripcion}
                                          onSelect={(value) => {
                                            handleFieldChange(record.id, "especialidad", value)
                                            handleFieldChange(record.id, "nombre", "")
                                            handleFieldChange(record.id, "doctorId", 0)
                                            handleFieldChange(record.id, "codigoItemAgendamiento", 0)
                                          closePopover(`especialidad-${record.id}`)
                                        }}
                                      >
                          <Check className={`mr-2 h-4 w-4 ${record.especialidad === esp.descripcion ? "opacity-100" : "opacity-0"}`} />
                                        {esp.descripcion}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
        )

      case 'nombre':
        return (
          <Popover 
            open={openPopovers[`medico-${record.id}`]} 
            onOpenChange={(open) => open ? togglePopover(`medico-${record.id}`) : closePopover(`medico-${record.id}`)}
          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                className="w-full justify-between hvq-border"
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
                    {getDoctorsBySpecialty(record.especialidad).map((doctor, index) => (
                                      <CommandItem
                                        key={`doctor-${doctor.id}-${index}`}
                                        value={doctor.nombres}
                                        onSelect={(value) => {
                          const selectedDoctor = doctors.find((d) => d.nombres === value)
                                          if (selectedDoctor) {
                                            handleFieldChange(record.id, "nombre", selectedDoctor.nombres)
                                            handleFieldChange(record.id, "doctorId", selectedDoctor.id)
                                            let defaultItem = 0
                            if (selectedDoctor.especialidades && selectedDoctor.especialidades.length > 0) {
                                              if (record.especialidad) {
                                const match = selectedDoctor.especialidades.find((esp) => esp.descripcion === record.especialidad)
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
                        <Check className={`mr-2 h-4 w-4 ${record.nombre === doctor.nombres ? "opacity-100" : "opacity-0"}`} />
                                        {doctor.nombres}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
        )

      case 'dia':
        return (
          <Select value={record.dia} onValueChange={(value) => handleFieldChange(record.id, "dia", value)}>
            <SelectTrigger className="hvq-border">
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
        )

      case 'piso':
        return (
                          <Select
                            value={record.piso}
                            onValueChange={(value) => handleFieldChange(record.id, "piso", value)}
                            disabled={record.agendaId !== 0 && (!record.edificio || getAvailableFloors(record.edificio).length === 0)}
                          >
            <SelectTrigger className="hvq-border">
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
        )

      case 'consultorioDescripcion':
        return (
          <Popover 
            open={openPopovers[`consultorio-${record.id}`]} 
            onOpenChange={(open) => open ? togglePopover(`consultorio-${record.id}`) : closePopover(`consultorio-${record.id}`)}
          >
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between hvq-border">
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
                    {(() => {
                      // Filtrar consultorios por piso seleccionado
                      const pisoNumero = record.piso ? parseInt(record.piso.replace('Piso ', '')) : null
                      const edificioCodigo = buildings.find(b => b.descripcion_edificio === record.edificio)?.codigo_edificio
                      
                      const consultoriosFiltrados = consultorios.filter(consultorio => {
                        if (pisoNumero && edificioCodigo) {
                          return consultorio.codigo_piso === pisoNumero && consultorio.codigo_edificio === edificioCodigo
                        }
                        return true // Si no hay piso seleccionado, mostrar todos
                      })
                      
                      return consultoriosFiltrados.map((consultorio, index) => (
                        <CommandItem
                          key={`consultorio-${consultorio.codigo_consultorio}-${index}`}
                          value={`${consultorio.descripcion_consultorio || consultorio.codigo_consultorio}`}
                          onSelect={(value) => {
                            handleFieldChange(record.id, "codigoConsultorio", consultorio.codigo_consultorio)
                            handleFieldChange(record.id, "consultorioDescripcion", consultorio.descripcion_consultorio || "")
                            closePopover(`consultorio-${record.id}`)
                          }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${record.codigoConsultorio === consultorio.codigo_consultorio ? "opacity-100" : "opacity-0"}`} />
                          {consultorio.descripcion_consultorio || consultorio.codigo_consultorio} 
                          <span className="text-gray-500 ml-2">
                            (Edificio: {consultorio.codigo_edificio}, Piso: {consultorio.codigo_piso})
                          </span>
                        </CommandItem>
                      ))
                    })()}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
        )

      case 'horaInicio':
      case 'horaFin':
        return (
                          <Input
                            type="time"
            value={record[field]}
            onChange={(e) => handleFieldChange(record.id, field, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, record.id)}
            className="hvq-border"
                            title="Ctrl+Enter para guardar"
                            required
                          />
        )

      case 'tipo':
        return (
                          <Select
                            value={record.tipo}
                            onValueChange={(value) => handleFieldChange(record.id, "tipo", value as "Consulta" | "Procedimiento")}
                          >
            <SelectTrigger className="hvq-border">
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Consulta">Consulta</SelectItem>
                              <SelectItem value="Procedimiento">Procedimiento</SelectItem>
                            </SelectContent>
                          </Select>
        )

      default:
        return <span className="hvq-text-dark">{record[field]}</span>
    }
  }, [specialties, getDoctorsBySpecialty, doctors, consultorios, buildings, getAvailableFloors, getDefaultBuildingFloors, handleFieldChange, closePopover, handleKeyDown])

  return (
    <div className="min-h-screen hvq-bg-light">
      <Header />

      <main className="p-6">
        {/* Mostrar error si existe */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="outline" size="sm" className="ml-2" onClick={clearError}>
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

        <Card className="hvq-bg-white hvq-border shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl hvq-text-dark">Gestión de Médicos y Agendas</CardTitle>
              <div className="flex gap-2">
                <BtnExportarStaff items={convertToStaffData} />

                                <Button onClick={handleAddRecord} className="hvq-btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Agenda Manual
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <FilterSection
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              specialties={specialties}
              buildings={buildings}
              filteredRecords={filteredRecords}
              records={records}
              paginatedRecords={paginatedRecords}
            />

            <div className="overflow-x-auto border-2 hvq-border rounded-lg">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="border-b-2 hvq-border hvq-bg-light">
                    <TableHead className="hvq-text-dark font-semibold border-r hvq-border p-4">Especialidad</TableHead>
                    <TableHead className="hvq-text-dark font-semibold border-r hvq-border p-4">Nombre del Médico</TableHead>
                    <TableHead className="hvq-text-dark font-semibold border-r hvq-border p-4">Día</TableHead>
                    <TableHead className="hvq-text-dark font-semibold border-r hvq-border p-4">Piso</TableHead>
                    <TableHead className="hvq-text-dark font-semibold border-r hvq-border p-4">Consultorio</TableHead>
                    <TableHead className="hvq-text-dark font-semibold border-r hvq-border p-4">Hora Inicio</TableHead>
                    <TableHead className="hvq-text-dark font-semibold border-r hvq-border p-4">Hora Fin</TableHead>
                    <TableHead className="hvq-text-dark font-semibold border-r hvq-border p-4">Tipo de Agenda</TableHead>
                    <TableHead className="hvq-text-dark font-semibold p-4 min-w-[140px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((record) => (
                    <TableRow 
                      key={record.id} 
                      className={`border-b hvq-border hover:bg-gray-50 ${
                        record.agendaId === 0 
                          ? 'bg-blue-50 border-blue-200' 
                          : record.isEditing 
                            ? 'bg-yellow-50 border-yellow-200' 
                            : ''
                      }`}
                    >
                      <TableCell className="border-r hvq-border p-4">
                        {renderTableCell(record, 'especialidad', record.isEditing)}
                      </TableCell>
                      <TableCell className="border-r hvq-border p-4">
                        {renderTableCell(record, 'nombre', record.isEditing)}
                      </TableCell>
                      <TableCell className="border-r hvq-border p-4">
                        {renderTableCell(record, 'dia', record.isEditing)}
                      </TableCell>
                      <TableCell className="border-r hvq-border p-4">
                        {renderTableCell(record, 'piso', record.isEditing)}
                      </TableCell>
                      <TableCell className="border-r hvq-border p-4">
                        {renderTableCell(record, 'consultorioDescripcion', record.isEditing)}
                      </TableCell>
                      <TableCell className="border-r hvq-border p-4">
                        {renderTableCell(record, 'horaInicio', record.isEditing)}
                      </TableCell>
                      <TableCell className="border-r hvq-border p-4">
                        {renderTableCell(record, 'horaFin', record.isEditing)}
                      </TableCell>
                      <TableCell className="border-r hvq-border p-4">
                        {record.isEditing ? (
                          renderTableCell(record, 'tipo', record.isEditing)
                        ) : (
                          <Badge
                            variant="secondary"
                            className={record.tipo === "Consulta" ? "hvq-bg-secondary hvq-text-light" : "hvq-bg-primary hvq-text-light"}
                          >
                            {record.tipo}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="p-4 min-w-[140px]">
                        <ActionButtons
                          record={record}
                          onEdit={() => handleEdit(record.id)}
                          onSave={() => handleSave(record.id)}
                          onCancel={() => handleCancel(record.id)}
                          onDelete={() => handleDelete(record.id)}
                          onDuplicate={() => handleDuplicate(record)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />

            {filteredRecords.length === 0 && (
              <div className="text-center py-8 hvq-text-muted flex-shrink-0">
                <div className="mb-4">
                  <strong>Estado de datos:</strong><br/>
                  Médicos: {doctors.length} | Registros: {records.length}
                </div>
                {filters.search || filters.especialidad || filters.edificio || filters.tipo
                  ? "No se encontraron registros que coincidan con los filtros aplicados."
                  : loading === 'loading'
                    ? "Cargando datos del backend..."
                    : connectionStatus === 'disconnected'
                      ? "No se pudo conectar con el backend. Verifique la conexión."
                      : records.length === 0
                        ? "No hay registros disponibles. Haga clic en 'Agregar Médico/Agenda' para comenzar."
                  : "No hay registros disponibles. Haga clic en 'Agregar Médico/Agenda' para comenzar."}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
