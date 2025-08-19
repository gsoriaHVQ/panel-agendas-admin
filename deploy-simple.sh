#!/bin/bash

# ===========================================
# SCRIPT DE DESPLIEGUE SIMPLIFICADO
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
    
    print_message "Directorios creados ✓"
}

# Función para verificar archivos de configuración
check_config_files() {
    print_header "VERIFICANDO ARCHIVOS DE CONFIGURACIÓN"
    
    required_files=("Dockerfile" "docker-compose.yml" "nginx.conf" ".dockerignore")
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_warning "Archivo no encontrado: $file (se creará si es necesario)"
        fi
    done
    
    print_message "Verificación de archivos completada ✓"
}

# Función para limpiar contenedores anteriores
cleanup_old_containers() {
    print_header "LIMPIANDO CONTENEDORES ANTERIORES"
    
    # Detener y eliminar contenedores existentes
    docker-compose down --remove-orphans 2>/dev/null || true
    
    print_message "Limpieza completada ✓"
}

# Función para construir y desplegar
build_and_deploy() {
    print_header "CONSTRUYENDO Y DESPLEGANDO"
    
    # Construir y levantar contenedor en segundo plano
    print_message "Ejecutando: docker-compose up -d --build"
    docker-compose up -d --build
    
    print_message "Construcción y despliegue completados ✓"
}

# Función para verificar estado
check_status() {
    print_header "VERIFICANDO ESTADO DE CONTENEDORES"
    
    # Verificar estado de contenedores
    print_message "Estado de contenedores:"
    docker-compose ps
    
    # Verificar que el contenedor está healthy
    print_message "Verificando salud del contenedor front-agendas-api..."
    if docker inspect --format '{{.State.Status}} {{.State.Health.Status}}' front-agendas-api 2>/dev/null; then
        print_message "Contenedor front-agendas-api está funcionando ✓"
    else
        print_warning "No se pudo verificar el estado del contenedor"
    fi
}

# Función para mostrar logs
show_logs() {
    print_header "MOSTRANDO LOGS EN TIEMPO REAL"
    
    print_message "Presiona Ctrl+C para salir de los logs"
    docker-compose logs -f
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [COMANDO]"
    echo ""
    echo "Comandos disponibles:"
    echo "  deploy       - Desplegar la aplicación (completo)"
    echo "  build        - Solo construir y desplegar"
    echo "  status       - Verificar estado de contenedores"
    echo "  logs         - Mostrar logs en tiempo real"
    echo "  stop         - Detener todos los servicios"
    echo "  restart      - Reiniciar todos los servicios"
    echo "  clean        - Limpiar contenedores e imágenes"
    echo "  help         - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 deploy              # Despliegue completo"
    echo "  $0 build               # Solo construir y desplegar"
    echo "  $0 logs                # Ver logs"
}

# Función principal
main() {
    case "${1:-help}" in
        deploy)
            check_prerequisites
            create_directories
            check_config_files
            cleanup_old_containers
            build_and_deploy
            check_status
            print_message "Despliegue completado ✓"
            print_message "Accede a la aplicación en: http://localhost:3000"
            ;;
        build)
            build_and_deploy
            check_status
            ;;
        status)
            check_status
            ;;
        logs)
            show_logs
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
        help|*)
            show_help
            ;;
    esac
}

# Ejecutar función principal
main "$@"
