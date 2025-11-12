# AGENTS — JEY POWER GYM F.P.

Documento vivo para mantener el contexto funcional y técnico del proyecto.

## Visión
“Sistema Digital de Entradas y Seguimiento de Clientes” para el gimnasio JEY POWER GYM F.P. El sistema gestiona clientes, pagos, membresías y control de asistencia, con métricas operativas en un dashboard.

## Roles
- admin: control total (usuarios, configuración, todo el CRUD)
- editor: operación diaria (clientes, pagos, asistencias) — sin gestión de usuarios

## Modelos (Mongoose)
- Customer
  - name (String, req)
  - cedula (String, req, unique)
  - email (String, opt)
  - phone (String, opt)
  - dateOfBirth (Date)
  - startDate (Date, default now)
  - membershipType (enum: 'Gym' | 'Xtrembike' | 'Diario' | 'Mensual' | 'Otro')
  - paymentStatus (enum: 'Activo' | 'Inactivo', default 'Inactivo')
  - membershipEndDate (Date)
  - createdBy (ObjectId → User, opt)
- User
  - username (String, req, unique)
  - password (String, req) — almacenar como hash (bcrypt/bcryptjs)
  - role (enum: 'admin' | 'editor', default 'editor')
- Payment
  - customer (ObjectId → Customer, req)
  - amount (Number, req)
  - paymentDate (Date, default now)
  - paymentMethod (enum: 'Efectivo' | 'Pago Movil' | 'Otro')
  - referenceNumber (String, opt)
  - membershipMonths (Number, default 1)
  - membershipEndAfter (Date) — nuevo vencimiento tras aplicar el pago
  - createdBy (ObjectId → User, opt)
- Attendance
  - customer (ObjectId → Customer, req)
  - checkInTime (Date, default now)
  - createdBy (ObjectId → User, opt)

## Reglas y Flujos clave
- Pago actualiza automáticamente el Customer:
  - membershipEndDate += membershipMonths (meses) desde la fecha vigente (si ya vencida, desde hoy)
  - paymentStatus = 'Activo' cuando la membresía está vigente; 'Inactivo' al vencer
- Asistencia (check-in) válida solo si paymentStatus === 'Activo' y hoy <= membershipEndDate
- Tipos de membresía según mapa mental: 'Gym', 'Xtrembike', 'Diario', 'Mensual', 'Otro'
- Métodos de pago: 'Efectivo', 'Pago Movil', 'Otro' (usar referenceNumber en Pago Movil)
- Usuarios del sistema: admin/editor; credenciales seguras (hash bcrypt) y mínimo 8 caracteres

## Rutas API (plan)
- Auth
  - POST /api/auth/register — admin crea usuarios del sistema (hash usando bcryptjs)
  - POST /api/auth/login — devuelve sesión/JWT; luego migraremos a next-auth
  - POST /api/auth/change-password — usuario autenticado actualiza su contraseña
- Customers
  - GET /api/customers — lista + búsqueda por nombre/cedula
  - POST /api/customers — crea
  - GET /api/customers/:id — detalle
  - PUT /api/customers/:id — actualiza
  - DELETE /api/customers/:id — elimina (blando opcional)
- Payments
  - POST /api/payments — crea y aplica efectos colaterales en Customer
  - GET /api/payments?q=&customer=ID&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=50&populate=1 — lista pagos con filtros (opcional populate de cliente). Respuesta: { success, data, page, total, hasMore }
  - GET /api/payments/export?format=csv&from=YYYY-MM-DD&to=YYYY-MM-DD — exporta CSV (opcional filtro por fechas y cliente)
- Attendance
  - POST /api/attendance — registra check-in validando vigencia (acepta { customer } o { cedula })
  - GET /api/attendance?q=&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=20 — últimas asistencias con filtros (poblado de cliente). Respuesta: { success, data, page, total, hasMore }
 - Attendance Export
  - GET /api/attendance/export?format=csv&from=YYYY-MM-DD&to=YYYY-MM-DD&q= — exporta CSV de asistencias con filtros
 - Dashboard
  - GET /api/dashboard/metrics — métricas (total pagos, inscritos del mes, total clientes, clientes activos, asistencias de hoy)
   - Users (admin)
    - GET /api/users — listado de usuarios (admin-only)
    - PATCH /api/users/:id — actualizar rol (admin/editor), impide dejar el sistema sin admin
    - DELETE /api/users/:id — eliminar usuario (no permite eliminarse a sí mismo ni dejar sin admin)
 - Customers
  - GET /api/customers/export?format=csv&q= — exporta CSV de clientes con filtro por nombre/cédula

## UI (plan)
- /login — formulario de acceso
- /dashboard — métricas:
  - Total $ recibido (suma de Payments)
  - Inscritos del mes (Customers creados este mes)
  - Total de clientes (conteo global)
  - Clientes activos y asistencias de hoy
- /dashboard/clientes — tabla, buscador, modal de alta, CRUD
- Detalle de cliente — historial de pagos, formulario para nuevo pago
- /dashboard/pagos — listado de pagos con buscador (nombre/cédula)
- /dashboard/asistencias — check-in por cédula y últimas asistencias
 - /dashboard/perfil — cambio de contraseña del usuario
  - /dashboard/usuarios — (admin) listado, alta, cambio de rol y eliminación de usuarios

## Decisiones técnicas
- Next.js 14 (App Router). Directorio `app/`.
- Mongoose con helper `lib/dbConnect.js` usando caché global para dev/serverless.
- Tailwind para estilado rápido. `styles/globals.css` incluido en `app/layout.js`.
- Import ESM; `package.json` con `"type": "module"`.
- bcryptjs en lugar de bcrypt por compatibilidad de despliegue en serverless; API permanecerá igual (`compare`, `hash`).
- Validación con Zod en endpoints críticos: login, customers (POST/PUT), payments (POST), attendance (POST). Helpers en `lib/validation.js` con `parseSafe`.
 - Añadido ChangePasswordSchema para cambio de contraseña.

## Variables de entorno
- MONGODB_URI — cadena MongoDB Atlas

## Roadmap (próximos pasos)
1) Auth: /api/auth/register y /api/auth/login (bcryptjs) y preparar next-auth
2) CRUD Customers: API + UI (/dashboard/clientes)
3) Payments: endpoint que actualiza `membershipEndDate` y `paymentStatus`
4) Dashboard KPIs: total pagos, inscritos del mes, total clientes
5) Guardas de ruta en `middleware` (rol-based) incluyendo rutas API críticas
6) Mejoras UX: paginación y filtros server-side en pagos (UI adaptada), toasts de éxito/error
7) Export de asistencias a CSV en UI y API

## Convenciones
- Validar entradas en API (Zod/Yup opcional)
- Respuestas JSON { success, data?, error? }
- Manejo de fechas en UTC y mostrar en tz local del cliente
- Índices: `cedula` unique en Customer; índices por `customer` en Payment/Attendance
  - Extras: Customer índice compuesto (`paymentStatus`, `membershipEndDate`); Payment índices por `paymentDate` y compuesto (`customer`,`paymentDate`); Attendance índices por `checkInTime` y compuesto (`customer`,`checkInTime`).
  - Pago Movil: índice único parcial en Payment.referenceNumber cuando `paymentMethod = 'Pago Movil'` para evitar referencias duplicadas.
 - GET paginado devuelve { data, page, total, hasMore } con `limit` y `page` en query.

## Enlaces rápidos
- Modelos: `models/*`
- Conexión: `lib/dbConnect.js`
- Rutas API: `app/api/*`
- Estilos: `styles/globals.css`
