import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  role: z.enum(['admin', 'editor']).optional(),
});

export const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

export const CustomerCreateSchema = z.object({
  name: z.string().min(1),
  cedula: z.string().min(1),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  phone: z.string().optional(),
  dateOfBirth: z.preprocess((v)=> v ? new Date(v) : undefined, z.date().optional()),
  startDate: z.preprocess((v)=> v ? new Date(v) : undefined, z.date().optional()),
  membershipType: z.enum(['Gym','Xtrembike','Diario','Mensual','Otro']).optional(),
  paymentStatus: z.enum(['Activo','Inactivo']).optional(),
  membershipEndDate: z.preprocess((v)=> v ? new Date(v) : undefined, z.date().optional()),
});

export const CustomerUpdateSchema = CustomerCreateSchema.partial();

export const PaymentCreateSchema = z.object({
  customer: z.string().min(1),
  amount: z.number().positive(),
  paymentDate: z.preprocess((v)=> v ? new Date(v) : undefined, z.date().optional()),
  paymentMethod: z.enum(['Efectivo','Pago Movil','Otro']),
  referenceNumber: z.string().optional(),
  membershipMonths: z.number().int().positive().default(1),
});

export const AttendanceCreateSchema = z.object({
  customer: z.string().min(1).optional(),
  cedula: z.string().min(1).optional(),
}).refine((v)=> v.customer || v.cedula, { message: 'Proporcione customer o cedula' });

export function parseSafe(schema, data) {
  const res = schema.safeParse(data);
  if (!res.success) {
    const msg = res.error.issues?.[0]?.message || 'Datos inválidos';
    const path = res.error.issues?.[0]?.path?.join('.') || undefined;
    const error = path ? `${path}: ${msg}` : msg;
    return { ok: false, error };
  }
  return { ok: true, data: res.data };
}
