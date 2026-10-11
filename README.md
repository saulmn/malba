# Punto de Venta (POS) - Clean House

Sistema de Punto de Venta web diseñado para la gestión de sucursales, control de inventarios, cortes de caja y registro de ventas. Creado con tecnologías modernas y reactivas para ser utilizado fluidamente por cajeros y administradores.

## 🚀 Tecnologías (Tech Stack)

Este proyecto está construido con un stack moderno de TypeScript enfocado en rendimiento y tipado estricto:

- **Frontend / Framework:** [TanStack Start](https://tanstack.com/start) (React + Vite + SSR / API Routes integradas).
- **Estilos y Componentes:** [Tailwind CSS v4](https://tailwindcss.com/) y [Shadcn UI](https://ui.shadcn.com/) (junto con Base UI).
- **Validación de Datos:** [Zod](https://zod.dev/) y React Hook Form.
- **Base de Datos:** [PostgreSQL](https://www.postgresql.org/).
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) para un acceso rápido y tipado a la base de datos.
- **Gestor de Paquetes:** [pnpm](https://pnpm.io/).
- **Almacenamiento (Imágenes):** AWS SDK (S3 / Cloudflare R2).

## 📁 Estructura del Proyecto

El proyecto está organizado utilizando un patrón por capas/features para facilitar su crecimiento:

```text
clean-house/
├── src/
│   ├── components/      # Componentes UI reutilizables (Shadcn, botones, layouts)
│   ├── db/              # Configuración de base de datos y esquemas de Drizzle (schema.ts)
│   ├── features/        # Componentes agrupados por dominio de negocio (POS, inventario, ventas)
│   ├── routes/          # Rutas de la aplicación (TanStack Router genera el árbol desde aquí)
│   ├── server/          # Server Functions de TanStack (Endpoints API, lógica de base de datos)
│   ├── utils/           # Utilidades (formateo de moneda, esquemas de validación Zod)
│   └── styles.css       # Hoja de estilos global de Tailwind CSS
├── drizzle/             # Archivos de migración generados por Drizzle Kit
├── Dockerfile           # Instrucciones para contenerizar la app
├── docker-compose.yml   # Orquestación de servicios (App + PostgreSQL)
└── package.json
```

## 🛠️ Desarrollo Local (Cómo iniciar)

Para trabajar de manera local en el proyecto, sigue estos pasos:

1. **Instala las dependencias** (Asegúrate de usar `pnpm`):
   ```bash
   pnpm install
   ```

2. **Configura la Base de Datos Local**:
   Asegúrate de tener PostgreSQL corriendo en tu máquina (puedes usar Docker o instalarlo directamente). La aplicación buscará por defecto la conexión: `postgres://postgres:postgres@localhost:5432/pos_app`.
   Si tu conexión es distinta, crea un archivo `.env` y define:
   ```env
   DATABASE_URL=postgres://usuario:contraseña@localhost:5432/tu_db
   ```

3. **Aplica las Migraciones (Estructura de la BD)**:
   Empuja el esquema directamente a tu base de datos:
   ```bash
   pnpm exec drizzle-kit push
   ```
   *(También puedes poblar datos iniciales corriendo `pnpm tsx src/seed.ts`)*.

4. **Inicia el Servidor de Desarrollo**:
   ```bash
   pnpm dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🐳 Despliegue con Docker Compose (Producción)

Si quieres desplegar rápidamente el proyecto completo (Aplicación + Base de Datos) en un VPS o servidor local, sigue estos pasos:

1. **Clona el repositorio** en tu servidor.
2. **Levanta los contenedores** en segundo plano:
   ```bash
   docker-compose up -d
   ```
   Esto hará lo siguiente:
   - Levantará un contenedor `clean_house_db` con PostgreSQL 15, creando la BD `pos_app` y un volumen persistente (`pgdata`) para no perder datos.
   - Construirá el contenedor `clean_house_app` ejecutando `pnpm build`.
   - Cuando la base de datos esté sana (healthcheck), la aplicación automáticamente aplicará las tablas (`drizzle-kit push`) y correrá `pnpm preview`.

3. **Accede al sistema**:
   Abre [http://localhost:3000](http://localhost:3000) en el navegador del servidor, o en tu IP local si lo estás corriendo en una red (Ej: `http://192.168.1.100:3000`).

## 🗄️ Esquema de la Base de Datos

El sistema maneja un esquema relacional optimizado para tiendas y puntos de venta con las siguientes tablas principales:

- **`users`**: Administradores y Cajeros (`master`, `admin`, `manager`, `staff`). Maneja la autenticación y permisos.
- **`auth_sessions`**: Registro de tokens para sesiones activas.
- **`workspaces`** & **`workspace_users`**: Permite organizar sucursales. La cuenta maestra puede asignar usuarios específicos a cada sucursal.
- **`products`**: El catálogo. Contiene nombre, categoría, `price` (precio público), `cost` (costo interno), `margin` (porcentaje de ganancia calculado), `minStock` (límite para la alerta visual), e indicador `isQuickAction` para productos rápidos.
- **`inventory`**: Tabla cruzada que lleva la cuenta exacta de `quantity` (existencias) por cada producto en una sucursal.
- **`inventory_movements`**: Registro inmutable de cada entrada o salida de inventario (ventas, reabastecimiento, mermas).
- **`register_sessions`**: Turnos o Cortes de Caja. Cada vendedor abre uno al llegar. Registra saldos iniciales, esperados, y diferencias (descuadres) al finalizar el turno.
- **`transactions`** & **`transaction_items`**: Cada ticket o venta generada. Se relacionan con la sesión de caja activa para asegurar que cada venta se atribuye al cajero y turno correctos.
