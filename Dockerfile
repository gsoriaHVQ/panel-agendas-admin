# ===========================================
# DOCKERFILE OPTIMIZADO PARA PRODUCCIÓN
# ===========================================

# Etapa 1: Dependencias de desarrollo
FROM node:18-alpine AS deps
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache libc6-compat

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
COPY next.config.mjs ./

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm ci --only=production && npm cache clean --force

# Etapa 2: Builder - Compilar la aplicación
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Configurar variables de entorno para build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Construir la aplicación
RUN npm run build

# Etapa 3: Runner - Imagen final optimizada
FROM node:18-alpine AS runner
WORKDIR /app

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Instalar dependencias del sistema
RUN apk add --no-cache curl

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copiar archivos de Next.js optimizados
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Crear directorio para logs
RUN mkdir -p /app/logs && chown -R nextjs:nodejs /app/logs

# Cambiar al usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de inicio
CMD ["node", "server.js"]