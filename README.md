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
npx prisma migrate dev --name init
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
4. Configurar variables de entorno:
   - `DATABASE_URL` (Railway la provee automáticamente al vincular PostgreSQL)
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN=7d`
   - `NODE_ENV=production`
5. Build command: `npm run build`
6. Start command: `node dist/main`

### Frontend

1. Agregar servicio desde el directorio `frontend/`
2. Configurar `environment.prod.ts` con la URL del backend desplegado
3. Build command: `npm run build`
4. Publicar carpeta `dist/whisky-frontend/browser`

---

## Comandos útiles

```bash
# Ejecutar migraciones
cd backend && npx prisma migrate dev

# Abrir Prisma Studio
cd backend && npx prisma studio

# Ejecutar seed
cd backend && npm run db:seed

# Build producción backend
cd backend && npm run build

# Build producción frontend
cd frontend && npm run build
```
