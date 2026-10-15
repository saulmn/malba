# Etapa base para instalar dependencias y pnpm
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Etapa de dependencias
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

# Etapa de construcción
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generamos cliente de base de datos y construimos el proyecto
RUN pnpm db:generate || true
RUN pnpm build

# Etapa de producción
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml* ./
COPY --from=builder /app/vite.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/tsr.config.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/src ./src

ENV PORT=4173
EXPOSE 4173

# Utilizamos vite preview para correr la app compilada soportando la variable PORT de Render
CMD ["sh", "-c", "pnpm preview --host 0.0.0.0 --port ${PORT:-4173}"]
