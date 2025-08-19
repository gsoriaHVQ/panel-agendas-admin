# 🚀 Despliegue Simplificado - Medical Dashboard

Este documento contiene las instrucciones para desplegar la aplicación usando tu flujo de trabajo actual.

## 📋 Tu Flujo de Despliegue

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd hvq-agendas-directorio
```

### 2. Desplegar con Docker Compose
```bash
# Construir y levantar contenedor en segundo plano
docker-compose up -d --build
```

### 3. Verificar estado
```bash
# Verificar estado de contenedores
docker-compose ps

# Verificar que el contenedor está healthy
docker inspect --format '{{.State.Status}} {{.State.Health.Status}}' front-agendas-api
```

### 4. Revisar logs
```bash
# Ver logs en tiempo real
docker-compose logs -f
```

## 🔧 Configuración Actualizada

### Docker Compose Simplificado
- ✅ **Nombre del contenedor**: `front-agendas-api`
- ✅ **Puerto**: 3000
- ✅ **Health check**: Automático
- ✅ **Restart**: `unless-stopped`
- ✅ **Variables de entorno**: Configuradas automáticamente

### Servicios Disponibles
- **Frontend**: http://localhost:3000
- **Nginx** (opcional): http://localhost:80

## 🚀 Opciones de Despliegue

### Opción 1: Tu método actual
```bash
git clone <repositorio>
cd hvq-agendas-directorio
docker-compose up -d --build
docker-compose ps
docker inspect --format '{{.State.Status}} {{.State.Health.Status}}' front-agendas-api
docker-compose logs -f
```

### Opción 2: Script simplificado
```bash
# Dar permisos
chmod +x deploy-simple.sh

# Despliegue completo
./deploy-simple.sh deploy

# Solo construir y desplegar
./deploy-simple.sh build

# Ver logs
./deploy-simple.sh logs
```

### Opción 3: Comandos individuales
```bash
# Construir y desplegar
docker-compose up -d --build

# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f

# Detener
docker-compose down

# Reiniciar
docker-compose restart
```

## 📊 Monitoreo

### Verificar estado del contenedor
```bash
# Estado general
docker-compose ps

# Estado específico del contenedor
docker inspect --format '{{.State.Status}} {{.State.Health.Status}}' front-agendas-api

# Ver recursos utilizados
docker stats front-agendas-api
```

### Logs
```bash
# Logs en tiempo real
docker-compose logs -f

# Logs del frontend específicamente
docker-compose logs -f frontend

# Últimas 100 líneas
docker-compose logs --tail=100 frontend
```

## 🔧 Comandos Útiles

### Gestión de Contenedores
```bash
# Iniciar
docker-compose up -d

# Detener
docker-compose down

# Reiniciar
docker-compose restart

# Reconstruir
docker-compose up -d --build

# Ver estado
docker-compose ps
```

### Gestión de Imágenes
```bash
# Ver imágenes
docker images

# Limpiar imágenes no utilizadas
docker system prune -f

# Ver uso de recursos
docker stats
```

### Acceso al Contenedor
```bash
# Entrar al contenedor
docker-compose exec frontend sh

# Ejecutar comando específico
docker-compose exec frontend ls -la
```

## 🐛 Troubleshooting

### Problemas Comunes

#### 1. Puerto ya en uso
```bash
# Ver qué está usando el puerto 3000
netstat -tulpn | grep :3000

# Cambiar puerto en docker-compose.yml
ports:
  - "3001:3000"
```

#### 2. Error de construcción
```bash
# Limpiar caché y reconstruir
docker-compose build --no-cache
docker-compose up -d
```

#### 3. Contenedor no inicia
```bash
# Ver logs de error
docker-compose logs frontend

# Verificar configuración
docker-compose config
```

#### 4. Error de memoria
```bash
# Ver uso de memoria
docker stats

# Aumentar memoria en docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G
```

## 🔄 Actualizaciones

### Actualizar la aplicación
```bash
# 1. Obtener cambios
git pull

# 2. Reconstruir y reiniciar
docker-compose up -d --build

# 3. Verificar estado
docker-compose ps
```

### Rollback
```bash
# Volver a versión anterior
git checkout <tag-o-commit>
docker-compose up -d --build
```

## 📁 Estructura de Archivos

```
hvq-agendas-directorio/
├── Dockerfile              # Configuración de Docker
├── docker-compose.yml      # Orquestación de servicios
├── nginx.conf             # Configuración de Nginx (opcional)
├── deploy-simple.sh       # Script de despliegue simplificado
├── .dockerignore          # Archivos a excluir
├── next.config.mjs        # Configuración de Next.js
└── README-DEPLOY-SIMPLE.md # Este archivo
```

## 🌐 URLs de Acceso

- **Aplicación**: http://localhost:3000
- **Con Nginx**: http://localhost:80 (si se habilita)

## 🔐 Variables de Entorno

Las variables se configuran automáticamente, pero puedes personalizarlas:

```env
NEXT_PUBLIC_API_BASE_URL=http://10.129.180.151:3001
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## 📞 Soporte

Para problemas:
1. Verificar logs: `docker-compose logs -f`
2. Verificar estado: `docker-compose ps`
3. Verificar configuración: `docker-compose config`

---

**¡Tu aplicación está lista para desplegar! 🎉**
