# Whisky Sales Manager

Aplicación web fullstack para gestionar un negocio de venta de licores premium.

## Stack

- **Backend:** NestJS + Prisma + PostgreSQL
- **Frontend:** Angular + Angular Material

---

## Requisitos

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

---

## Instalación local

### 1. Variables de entorno

```bash
cp .env.example backend/.env
```

Editar `backend/.env` con tus credenciales de PostgreSQL.

### 2. Backend

```bash
cd backend
npm install
npx prisma migrate deploy   # crea las tablas desde prisma/migrations
npm run db:seed
npm run start:dev
```

El backend queda disponible en `http://localhost:3000`.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

El frontend queda disponible en `http://localhost:4200`.

---

## Credenciales iniciales

| Usuario | PIN  | Rol   |
|---------|------|-------|
| Dueño   | 1234 | OWNER |

> **Importante:** Cambia el PIN en Configuración tras el primer inicio de sesión.

---

## Estructura del proyecto

```
whisky-app/
├── backend/    # NestJS API
├── frontend/   # Angular SPA
└── README.md
```

---

## Despliegue en Railway

### Backend

1. Crear proyecto en [Railway](https://railway.app)
2. Agregar servicio PostgreSQL
3. Agregar servicio desde el directorio `backend/`
4. Configurar las variables de entorno listadas en `.env.example` (`JWT_SECRET` es obligatoria: sin ella el backend no arranca)
5. Build command: `npm run build`
6. Start command: `node dist/src/main` (ya definido en `railway.toml`)
7. Antes de desplegar un cambio de schema, aplicar las migraciones (ver abajo)

### Frontend

1. Agregar servicio desde el directorio `frontend/`
2. Configurar `environment.prod.ts` con la URL del backend desplegado
3. Build command: `npm run build`
4. Publicar carpeta `dist/whisky-frontend/browser`

---

## Base de datos y migraciones

El schema se versiona con migraciones de Prisma en `backend/prisma/migrations/`. No usar `prisma db push`:
cambia la base sin dejar registro y la historia de migraciones deja de coincidir con la base real.

```bash
# 1. Cambiar prisma/schema.prisma y crear la migración (contra una base local o de desarrollo)
cd backend && npm run db:migrate -- --name descripcion_del_cambio

# 2. Revisar el SQL generado en prisma/migrations/<fecha>_descripcion_del_cambio/ y hacer commit

# 3. Antes de desplegar, aplicarla en producción (con DATABASE_URL apuntando a producción)
cd backend && npm run db:migrate:deploy
```

`0_baseline` representa el schema completo a octubre de 2026. Una base creada antes con `db push` se
marca como al día una sola vez con `npx prisma migrate resolve --applied 0_baseline` (no ejecuta SQL).

## Comandos útiles

```bash
# Ver el estado de las migraciones
cd backend && npx prisma migrate status

# Abrir Prisma Studio
cd backend && npx prisma studio

# Ejecutar seed
cd backend && npm run db:seed

# Build producción backend
cd backend && npm run build

# Build producción frontend
cd frontend && npm run build
```
