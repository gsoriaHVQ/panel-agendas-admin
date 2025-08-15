"use client"

import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Wifi, WifiOff } from "lucide-react"
import { useBackendAPI } from "@/hooks/use-backend-api"

export function ConnectionStatus() {
  const { connectionStatus, error, checkConnection } = useBackendAPI()

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          variant: 'default' as const,
          text: 'Conectado',
          color: 'text-green-600'
        }
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          variant: 'destructive' as const,
          text: 'Desconectado del Backend',
          color: 'text-red-600'
        }
      case 'checking':
        return {
          icon: <Wifi className="h-4 w-4 animate-pulse" />,
          variant: 'secondary' as const,
          text: 'Verificando conexión...',
          color: 'text-yellow-600'
        }
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          variant: 'outline' as const,
          text: 'Estado desconocido',
          color: 'text-gray-600'
        }
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={statusConfig.variant} className="flex items-center gap-1">
          {statusConfig.icon}
          <span className={statusConfig.color}>{statusConfig.text}</span>
        </Badge>
        
        {connectionStatus === 'disconnected' && (
          <button
            onClick={checkConnection}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Reintentar
          </button>
        )}
      </div>

      {error && connectionStatus === 'disconnected' && (
        <Alert variant="destructive" className="text-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <br />
            <span className="text-xs">
              Asegúrate de que el backend esté ejecutándose en http://10.129.180.151:3001
            </span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
