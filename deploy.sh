#!/bin/bash

# ===========================================
# SCRIPT DE DESPLIEGUE AUTOMÁTICO
# ===========================================

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Función para verificar prerrequisitos
check_prerequisites() {
    print_header "VERIFICANDO PRERREQUISITOS"
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado. Por favor instala Docker primero."
        exit 1
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
        exit 1
    fi
    
    # Verificar que Docker esté ejecutándose
    if ! docker info &> /dev/null; then
        print_error "Docker no está ejecutándose. Por favor inicia Docker."
        exit 1
    fi
    
    print_message "Todos los prerrequisitos están satisfechos ✓"
}

# Función para crear directorios necesarios
create_directories() {
    print_header "CREANDO DIRECTORIOS NECESARIOS"
    
    mkdir -p logs
    mkdir -p logs/nginx
    mkdir -p ssl
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    
    print_message "Directorios creados ✓"
}

# Función para verificar archivos de configuración
check_config_files() {
    print_header "VERIFICANDO ARCHIVOS DE CONFIGURACIÓN"
    
    required_files=("Dockerfile" "docker-compose.yml" "nginx.conf" ".dockerignore")
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Archivo requerido no encontrado: $file"
            exit 1
        fi
    done
    
    print_message "Todos los archivos de configuración están presentes ✓"
}

# Función para limpiar contenedores y volúmenes antiguos
cleanup_old_containers() {
    print_header "LIMPIANDO CONTENEDORES ANTERIORES"
    
    # Detener y eliminar contenedores existentes
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Eliminar imágenes no utilizadas
    docker image prune -f
    
    print_message "Limpieza completada ✓"
}

# Función para construir la imagen
build_image() {
    print_header "CONSTRUYENDO IMAGEN DOCKER"
    
    # Construir la imagen con cache
    docker-compose build --no-cache frontend
    
    print_message "Imagen construida exitosamente ✓"
}

# Función para desplegar en modo desarrollo
deploy_development() {
    print_header "DESPLEGANDO EN MODO DESARROLLO"
    
    # Desplegar solo el frontend
    docker-compose --profile development up -d frontend
    
    # Esperar a que el servicio esté saludable
    print_message "Esperando a que el servicio esté listo..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose ps frontend | grep -q "healthy"; then
            print_message "Servicio frontend está saludable ✓"
            break
        fi
        sleep 5
        timeout=$((timeout - 5))
    done
    
    if [ $timeout -le 0 ]; then
        print_warning "Timeout esperando que el servicio esté saludable"
    fi
    
    print_message "Despliegue en desarrollo completado ✓"
    print_message "Accede a la aplicación en: http://localhost:3000"
}

# Función para desplegar en modo producción
deploy_production() {
    print_header "DESPLEGANDO EN MODO PRODUCCIÓN"
    
    # Desplegar todos los servicios de producción
    docker-compose --profile production up -d
    
    # Esperar a que los servicios estén saludables
    print_message "Esperando a que los servicios estén listos..."
    timeout=120
    while [ $timeout -gt 0 ]; do
        if docker-compose ps frontend | grep -q "healthy" && \
           docker-compose ps nginx | grep -q "healthy"; then
            print_message "Todos los servicios están saludables ✓"
            break
        fi
        sleep 5
        timeout=$((timeout - 5))
    done
    
    if [ $timeout -le 0 ]; then
        print_warning "Timeout esperando que los servicios estén saludables"
    fi
    
    print_message "Despliegue en producción completado ✓"
    print_message "Accede a la aplicación en: http://localhost"
}

# Función para mostrar logs
show_logs() {
    print_header "MOSTRANDO LOGS"
    
    docker-compose logs -f --tail=50
}

# Función para mostrar estado
show_status() {
    print_header "ESTADO DE LOS SERVICIOS"
    
    docker-compose ps
}

# Función para mostrar información del sistema
show_system_info() {
    print_header "INFORMACIÓN DEL SISTEMA"
    
    echo "Docker version:"
    docker --version
    
    echo -e "\nDocker Compose version:"
    docker-compose --version
    
    echo -e "\nUso de recursos:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
}

# Función para backup
create_backup() {
    print_header "CREANDO BACKUP"
    
    backup_dir="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup de logs
    if [ -d "logs" ]; then
        cp -r logs "$backup_dir/"
    fi
    
    # Backup de configuración
    cp docker-compose.yml "$backup_dir/"
    cp Dockerfile "$backup_dir/"
    cp nginx.conf "$backup_dir/"
    
    # Backup de volúmenes (si existen)
    docker run --rm -v medical-dashboard_frontend_logs:/data -v "$(pwd)/$backup_dir:/backup" alpine tar czf /backup/logs.tar.gz -C /data .
    
    print_message "Backup creado en: $backup_dir"
}

# Función para restaurar
restore_backup() {
    if [ -z "$1" ]; then
        print_error "Debes especificar el directorio de backup"
        exit 1
    fi
    
    backup_dir="$1"
    
    if [ ! -d "$backup_dir" ]; then
        print_error "Directorio de backup no encontrado: $backup_dir"
        exit 1
    fi
    
    print_header "RESTAURANDO BACKUP"
    
    # Restaurar configuración
    cp "$backup_dir/docker-compose.yml" . 2>/dev/null || true
    cp "$backup_dir/Dockerfile" . 2>/dev/null || true
    cp "$backup_dir/nginx.conf" . 2>/dev/null || true
    
    # Restaurar logs
    if [ -f "$backup_dir/logs.tar.gz" ]; then
        docker run --rm -v medical-dashboard_frontend_logs:/data -v "$(pwd)/$backup_dir:/backup" alpine tar xzf /backup/logs.tar.gz -C /data
    fi
    
    print_message "Backup restaurado desde: $backup_dir"
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [COMANDO]"
    echo ""
    echo "Comandos disponibles:"
    echo "  dev          - Desplegar en modo desarrollo"
    echo "  prod         - Desplegar en modo producción"
    echo "  logs         - Mostrar logs en tiempo real"
    echo "  status       - Mostrar estado de los servicios"
    echo "  stop         - Detener todos los servicios"
    echo "  restart      - Reiniciar todos los servicios"
    echo "  clean        - Limpiar contenedores e imágenes"
    echo "  backup       - Crear backup de la aplicación"
    echo "  restore DIR  - Restaurar backup desde directorio"
    echo "  info         - Mostrar información del sistema"
    echo "  help         - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 dev                    # Desplegar en desarrollo"
    echo "  $0 prod                   # Desplegar en producción"
    echo "  $0 backup                 # Crear backup"
    echo "  $0 restore backup-20240101 # Restaurar backup"
}

# Función principal
main() {
    case "${1:-help}" in
        dev)
            check_prerequisites
            create_directories
            check_config_files
            cleanup_old_containers
            build_image
            deploy_development
            ;;
        prod)
            check_prerequisites
            create_directories
            check_config_files
            cleanup_old_containers
            build_image
            deploy_production
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        stop)
            print_header "DETENIENDO SERVICIOS"
            docker-compose down
            print_message "Servicios detenidos ✓"
            ;;
        restart)
            print_header "REINICIANDO SERVICIOS"
            docker-compose restart
            print_message "Servicios reiniciados ✓"
            ;;
        clean)
            print_header "LIMPIANDO SISTEMA"
            docker-compose down --volumes --remove-orphans
            docker system prune -af
            print_message "Limpieza completada ✓"
            ;;
        backup)
            create_backup
            ;;
        restore)
            restore_backup "$2"
            ;;
        info)
            show_system_info
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Ejecutar función principal
main "$@"
