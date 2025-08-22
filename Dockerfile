# ====================================================================================
#  Etapa 1: Dependencias (Instalación de dependencias de producción)
# ====================================================================================
FROM node:18-alpine AS deps
WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar package.json y pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Instalar solo las dependencias de producción
RUN pnpm install --frozen-lockfile --prod

# ====================================================================================
#  Etapa 2: Builder (Compilación del proyecto)
# ====================================================================================
FROM node:18-alpine AS builder
WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar dependencias de la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Instalar todas las dependencias (incluyendo devDependencies)
ENV NODE_ENV=development
RUN pnpm install --frozen-lockfile

# Construir el proyecto de Next.js
ENV NODE_ENV=production
RUN pnpm run build

# ====================================================================================
#  Etapa 3: Runner (Imagen final de producción)
# ====================================================================================
FROM node:18-alpine AS runner
WORKDIR /app

# Establecer el entorno de producción
ENV NODE_ENV=production
# Deshabilitar la telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Crear un usuario no root para mayor seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar los artefactos de compilación necesarios
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Cambiar al usuario no root
USER nextjs

# Exponer el puerto en el que la aplicación se ejecutará
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]