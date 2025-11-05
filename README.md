# JEY POWER GYM F.P. — Sistema Digital de Entradas y Seguimiento de Clientes

Aplicación Next.js 14 (App Router) con MongoDB (Mongoose) y Tailwind CSS.

## Requisitos
- Node.js >= 18.17
- Cuenta en MongoDB Atlas (cadena en `MONGODB_URI`)

## Configuración
1. Instala dependencias:
```powershell
npm install
```
2. Crea `.env.local` a partir de `.env.local.example` y define:
```env
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>/<dbName>?retryWrites=true&w=majority&appName=<appName>
JWT_SECRET=una-cadena-aleatoria-segura
```
3. Ejecuta en desarrollo:
```powershell
npm run dev
```

## Scripts
- `npm run dev` — servidor de desarrollo
- `npm run build` — compilar
- `npm run start` — iniciar en producción

## Tech Stack
- Next.js 14 (App Router)
- MongoDB + Mongoose
- Tailwind CSS
- Vercel (deploy) / MongoDB Atlas

## Estructura
```
app_gym/
├─ app/
│  ├─ (auth)/login/page.js
│  ├─ (dashboard)/dashboard/page.js
│  ├─ api/
│  │  ├─ auth/login/route.js
│  │  ├─ auth/register/route.js
│  │  ├─ customers/route.js
│  │  ├─ customers/[id]/route.js
│  │  ├─ payments/route.js
│  │  └─ attendance/route.js
│  ├─ layout.js
│  └─ page.js
├─ components/
├─ lib/dbConnect.js
├─ models/
├─ public/
├─ styles/globals.css
├─ .env.local.example
├─ .gitignore
├─ next.config.js
├─ postcss.config.js
├─ tailwind.config.js
└─ package.json
```

## Notas
- Modelos definidos en `models/`: `Customer`, `User`, `Payment`, `Attendance`.
- Conexión a DB en `lib/dbConnect.js` con caché global para Next.js.
- Auth: `/api/auth/register` y `/api/auth/login` implementadas con bcryptjs y JWT (cookie httpOnly `auth_token`).
- Customers API completa (GET/POST y GET/PUT/DELETE por id).
- Payments API:
	- POST crea pago y extiende membresía (valida `paymentMethod` y `referenceNumber` cuando es "Pago Movil").
	- GET con filtros: `q` (nombre/cédula), `customer`, `from`, `to`, `page`, `limit`, `populate=1`. Respuesta: `{ success, data, page, total, hasMore }`.
- Attendance API (POST por id o cédula; GET últimas asistencias pobladas).
 - Attendance API:
	 - POST por id o cédula; valida membresía.
	 - GET con filtros: `q` (nombre/cédula), `from`, `to`, `page`, `limit`. Respuesta: `{ success, data, page, total, hasMore }`.
- Dashboard KPIs en `/api/dashboard/metrics` + UI en `/dashboard` (5 métricas).
- Páginas: `/dashboard/clientes`, `/dashboard/clientes/[id]`, `/dashboard/pagos`, `/dashboard/asistencias`.
 - Exportaciones CSV:
	 - Clientes: `GET /api/customers/export?format=csv&q=` y botón "Exportar CSV" en `/dashboard/clientes`.
	 - Pagos: `GET /api/payments/export?format=csv&from=YYYY-MM-DD&to=YYYY-MM-DD` y botón "Exportar CSV" en `/dashboard/pagos`.

### Validación
- Zod se usa para validar payloads en: auth/login, customers (POST/PUT), payments (POST), attendance (POST). Ver `lib/validation.js`.

### Seguridad
- Las rutas de dashboard requieren JWT válido en cookie httpOnly `auth_token`. Ver helper `lib/serverAuth.js`.

### Variables opcionales
- `NEXT_PUBLIC_BASE_URL` (opcional): para fetch absoluto en SSR si es necesario (por defecto usa rutas relativas).

## Deploy
- Configura `MONGODB_URI` en Vercel (Project → Settings → Environment Variables).
- `npm run build` y luego `vercel --prod` (opcional si usas CLI), o conecta el repo a Vercel.
