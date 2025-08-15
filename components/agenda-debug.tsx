"use client"

import { useBackendAPI } from "@/hooks/use-backend-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function AgendaDebug() {
  const { agendas } = useBackendAPI()

  if (!Array.isArray(agendas) || agendas.length === 0) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Debug Agendas - No hay datos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600">No se han cargado agendas del backend</p>
        </CardContent>
      </Card>
    )
  }

  const firstAgenda = agendas[0]

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Debug Agendas - Estructura del Backend</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span>Total de agendas:</span>
          <Badge variant="outline">{agendas.length}</Badge>
        </div>

        <div className="mt-4">
          <strong>Primera agenda:</strong>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(firstAgenda, null, 2)}
          </pre>
        </div>

        <div className="mt-4">
          <strong>Campos disponibles:</strong>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {Object.keys(firstAgenda).map((key) => (
              <div key={key} className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">
                  {key}
                </Badge>
                <span className="text-gray-600">
                  {typeof firstAgenda[key as keyof typeof firstAgenda]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <strong>Valores de ejemplo:</strong>
          <div className="mt-2 space-y-1">
            {Object.entries(firstAgenda).map(([key, value]) => (
              <div key={key} className="text-xs">
                <span className="font-medium">{key}:</span>{" "}
                <span className="text-gray-600">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
