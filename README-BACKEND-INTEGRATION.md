# Integración con Backend - Panel de Gestión de Agendas

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con la siguiente configuración:

```bash
# Configuración del Backend
NEXT_PUBLIC_API_URL=http://10.129.180.151:3001

# Configuración de desarrollo
NODE_ENV=development

# Configuración de producción (cambiar cuando despliegues)
# NEXT_PUBLIC_API_URL=https://tu-dominio-backend.com
```

### 2. Asegúrate de que el Backend esté ejecutándose

El backend debe estar corriendo en el servidor `http://10.129.180.151:3001`. Si tu backend está en una IP o puerto diferente, actualiza la variable `NEXT_PUBLIC_API_URL` en el archivo `.env.local`.

## Estructura de la Integración

### Archivos Modificados/Creados:

1. **`lib/api-service.ts`** - Servicio principal de API que se conecta con el backend
2. **`hooks/use-backend-api.ts`** - Hook personalizado para manejar estados y operaciones del backend
3. **`components/connection-status.tsx`** - Componente que muestra el estado de conexión
4. **`components/medical-dashboard.tsx`** - Dashboard actualizado para usar datos del backend

### Características Implementadas:

#### ✅ Conexión Automática
- Verificación automática de conexión con el backend
- Indicador visual del estado de conexión
- Reintento automático en caso de desconexión

#### ✅ Manejo de Estados
- Estados de carga (idle, loading, success, error)
- Manejo de errores con mensajes descriptivos
- Skeleton loading mientras se cargan los datos

#### ✅ Operaciones CRUD
- **Crear**: Nuevas agendas médicas
- **Leer**: Listar médicos, agendas, especialidades, edificios
- **Actualizar**: Modificar agendas existentes
- **Eliminar**: Eliminar agendas

#### ✅ Filtros y Búsqueda
- Filtros por especialidad, edificio, tipo de agenda
- Búsqueda por nombre de médico
- Paginación de resultados

#### ✅ Validaciones
- Timeout de 30 segundos para requests
- Manejo de errores de red
- Validación de respuestas del backend

## Uso

### 1. Iniciar el Proyecto

```bash
# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp env.example .env.local

# Editar .env.local con la URL correcta del backend
# NEXT_PUBLIC_API_URL=http://10.129.180.151:3001

# Iniciar el servidor de desarrollo
npm run dev
```

### 2. Verificar Conexión

Al abrir la aplicación, verás un indicador de estado de conexión en la parte superior:

- 🟢 **Conectado**: El backend está funcionando correctamente
- 🔴 **Desconectado**: No se puede conectar con el backend
- 🟡 **Verificando**: Comprobando la conexión

### 3. Operaciones Disponibles

#### Gestión de Médicos
- Ver lista de médicos
- Filtrar por especialidad
- Buscar por nombre
- Ver estadísticas

#### Gestión de Agendas
- Crear nuevas agendas
- Editar agendas existentes
- Eliminar agendas
- Cancelar agendas
- Filtrar por fecha, estado, prestador

#### Catálogos
- Ver edificios disponibles
- Ver pisos por edificio
- Ver consultorios
- Ver días de la semana

## Endpoints del Backend Utilizados

### Información
- `GET /` - Información de la API
- `GET /health` - Health check

### Médicos
- `GET /medicos` - Listar todos los médicos
- `GET /especialidades` - Listar especialidades
- `GET /medicos/especialidad/{especialidad}` - Médicos por especialidad
- `GET /medicos/item/{codigo}` - Médico por código
- `GET /medicos/nombre/{nombre}` - Médicos por nombre
- `GET /api/medicos/estadisticas` - Estadísticas de médicos

### Agendas
- `GET /api/agendas` - Listar agendas (con filtros opcionales)
- `GET /api/agendas/{id}` - Obtener agenda por ID
- `POST /api/agendas` - Crear nueva agenda
- `PUT /api/agendas/{id}` - Actualizar agenda
- `DELETE /api/agendas/{id}` - Eliminar agenda
- `PUT /api/agendas/{id}/cancelar` - Cancelar agenda
- `GET /api/agendas/prestador/{codigo}` - Agendas por prestador
- `GET /api/agendas/estadisticas` - Estadísticas de agendas

### Catálogos
- `GET /api/catalogos/consultorios` - Listar consultorios
- `GET /api/catalogos/dias` - Listar días
- `GET /api/catalogos/edificios` - Listar edificios
- `GET /api/catalogos/edificios/{codigo}/pisos` - Pisos por edificio

### Agenda Personalizada
- `GET /api/agnd-agenda` - Listar agendas personalizadas
- `GET /api/agnd-agenda/{id}` - Obtener agenda personalizada
- `POST /api/agnd-agenda` - Crear agenda personalizada
- `PUT /api/agnd-agenda/{id}` - Actualizar agenda personalizada
- `DELETE /api/agnd-agenda/{id}` - Eliminar agenda personalizada

## Manejo de Errores

### Errores de Conexión
- Timeout de requests (30 segundos)
- Errores de red (CORS, DNS, etc.)
- Backend no disponible

### Errores de Validación
- Datos requeridos faltantes
- Formatos incorrectos
- IDs no válidos

### Errores de Negocio
- Agendas duplicadas
- Conflictos de horarios
- Permisos insuficientes

## Troubleshooting

### Problema: No se conecta al backend
**Solución:**
1. Verifica que el backend esté corriendo en el servidor 10.129.180.151:3001
2. Revisa la URL en `.env.local`
3. Verifica que no haya problemas de CORS
4. Revisa los logs del backend
5. Verifica conectividad de red al servidor

### Problema: Los datos no se cargan
**Solución:**
1. Verifica el estado de conexión
2. Revisa la consola del navegador para errores
3. Verifica que los endpoints del backend estén funcionando
4. Revisa el formato de respuesta del backend

### Problema: Errores de CORS
**Solución:**
1. Configura CORS en el backend para permitir `http://localhost:3000` y tu dominio de producción
2. Verifica que el backend esté configurado correctamente
3. Asegúrate de que el servidor 10.129.180.151 permita conexiones desde tu frontend

## Desarrollo

### Agregar Nuevos Endpoints

Para agregar nuevos endpoints, edita `lib/api-service.ts`:

```typescript
// Agregar nuevo método
async getNuevoEndpoint(): Promise<ApiResponse<any>> {
  return this.request<any>('/api/nuevo-endpoint')
}
```

### Agregar Nuevos Estados

Para agregar nuevos estados, edita `hooks/use-backend-api.ts`:

```typescript
const [nuevoEstado, setNuevoEstado] = useState<any[]>([])

const loadNuevoEstado = useCallback(async () => {
  setLoading('loading')
  try {
    const result = await apiService.getNuevoEndpoint()
    if (result.success) {
      setNuevoEstado(result.data)
      setError(null)
      setLoading('success')
    } else {
      setError(result.message || 'Error al cargar datos')
      setLoading('error')
    }
  } catch (err) {
    setError('Error al cargar datos')
    setLoading('error')
  }
}, [])
```

## Producción

### Configuración para Producción

1. Actualiza `NEXT_PUBLIC_API_URL` en `.env.local` con la URL de producción
2. Configura CORS en el backend para el dominio de producción
3. Verifica que todos los endpoints estén disponibles en producción
4. Configura timeouts apropiados para el entorno de producción

### Monitoreo

- Revisa los logs del frontend y backend
- Monitorea el estado de conexión
- Verifica el rendimiento de las consultas
- Implementa métricas de uso

## Soporte

Si tienes problemas con la integración:

1. Revisa este README
2. Verifica la configuración del backend
3. Revisa los logs de errores
4. Contacta al equipo de desarrollo
