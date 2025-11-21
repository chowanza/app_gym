import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import Customer from '../models/Customer.js';
import Payment from '../models/Payment.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

// --- 1. Cargar variables de entorno (.env.local) ---
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    }
  }
} catch (err) {
  console.warn('No se pudo cargar .env.local:', err.message);
}

// --- 2. Generadores de Datos Aleatorios ---

const FIRST_NAMES = [
  'Jose', 'Maria', 'Luis', 'Ana', 'Carlos', 'Laura', 'Pedro', 'Sofia', 'Miguel', 'Elena',
  'Juan', 'Carmen', 'Jesus', 'Isabel', 'David', 'Patricia', 'Daniel', 'Lucia', 'Francisco', 'Marta',
  'Alejandro', 'Paula', 'Manuel', 'Andrea', 'Javier', 'Sara', 'Antonio', 'Claudia', 'Ricardo', 'Valentina'
];

const LAST_NAMES = [
  'Garcia', 'Rodriguez', 'Gonzalez', 'Fernandez', 'Lopez', 'Martinez', 'Sanchez', 'Perez', 'Gomez', 'Martin',
  'Jimenez', 'Ruiz', 'Hernandez', 'Diaz', 'Moreno', 'Muñoz', 'Alvarez', 'Romero', 'Alonso', 'Gutierrez',
  'Navarro', 'Torres', 'Dominguez', 'Vazquez', 'Ramos', 'Gil', 'Ramirez', 'Serrano', 'Blanco', 'Molina'
];

const MEMBERSHIP_TYPES = ['Gym', 'Xtrembike', 'Diario', 'Mensual', 'Otro'];
const PAYMENT_METHODS = ['Efectivo', 'Pago Movil', 'Otro'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateCedula() {
  // Generar cedula venezolana realista (V-12345678)
  const num = getRandomInt(10000000, 35000000);
  return `V-${num}`;
}

function generatePhone() {
  const prefixes = ['0414', '0424', '0412', '0416', '0426'];
  const prefix = getRandomElement(prefixes);
  const number = getRandomInt(1000000, 9999999);
  return `${prefix}-${number}`;
}

// --- 3. Lógica Principal ---

async function seed() {
  console.log('🌱 Iniciando Seed Masivo...');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI no está definida.');
    process.exit(1);
  }

  try {
    await dbConnect();
    console.log('✅ Conectado a MongoDB');

    // Opcional: Limpiar base de datos (comentar si se quiere acumular)
    // console.log('🧹 Limpiando colecciones...');
    // await Customer.deleteMany({});
    // await Payment.deleteMany({});
    // await Attendance.deleteMany({});

    // Buscar un usuario admin para asignar como creador (opcional)
    const adminUser = await User.findOne({ role: 'admin' });
    const createdBy = adminUser ? adminUser._id : null;

    // --- Generar Clientes ---
    const NUM_CUSTOMERS = 50;
    const customers = [];
    console.log(`👥 Generando ${NUM_CUSTOMERS} clientes...`);

    for (let i = 0; i < NUM_CUSTOMERS; i++) {
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const startDate = getRandomDate(new Date('2023-01-01'), new Date());
      
      const customer = new Customer({
        name: `${firstName} ${lastName}`,
        cedula: generateCedula(),
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomInt(1,99)}@example.com`,
        phone: generatePhone(),
        dateOfBirth: getRandomDate(new Date('1980-01-01'), new Date('2005-01-01')),
        startDate: startDate,
        membershipType: getRandomElement(MEMBERSHIP_TYPES),
        paymentStatus: 'Inactivo', // Se actualizará al crear pagos
        membershipEndDate: startDate, // Inicialmente igual a inicio
        createdBy
      });

      // Intentar guardar (manejar error de cédula duplicada si ocurre por azar)
      try {
        const savedCustomer = await customer.save();
        customers.push(savedCustomer);
      } catch (e) {
        if (e.code === 11000) {
          // Ignorar duplicados generados por azar
          continue;
        } else {
          console.error('Error guardando cliente:', e);
        }
      }
    }

    console.log(`✅ ${customers.length} clientes creados exitosamente.`);

    // --- Generar Pagos y Asistencias ---
    console.log('💸 Generando historial de pagos y asistencias...');

    for (const customer of customers) {
      // Simular entre 1 y 6 pagos por cliente
      const numPayments = getRandomInt(1, 6);
      let lastEndDate = new Date(customer.startDate);

      for (let p = 0; p < numPayments; p++) {
        const paymentDate = new Date(lastEndDate);
        // A veces pagan unos días antes o después del vencimiento
        paymentDate.setDate(paymentDate.getDate() + getRandomInt(-3, 5));
        
        // No crear pagos en el futuro lejano para mantener realismo
        if (paymentDate > new Date()) break;

        const amount = getRandomElement([20, 30, 40, 5]); // Precios variados
        const method = getRandomElement(PAYMENT_METHODS);
        
        const payment = new Payment({
          customer: customer._id,
          amount: amount,
          paymentDate: paymentDate,
          paymentMethod: method,
          referenceNumber: method === 'Pago Movil' ? getRandomInt(100000, 999999).toString() : undefined,
          membershipMonths: 1,
          createdBy
        });

        await payment.save();

        // Actualizar fecha de fin del cliente (lógica simplificada del seed)
        // En la app real esto lo hace el endpoint, aquí simulamos el efecto
        const newEndDate = new Date(lastEndDate);
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        lastEndDate = newEndDate;

        // --- Generar Asistencias dentro del periodo pagado ---
        // Simular 2-4 asistencias por semana (aprox 8-16 por mes)
        const numAttendances = getRandomInt(8, 15);
        for (let a = 0; a < numAttendances; a++) {
            const attendanceDate = getRandomDate(paymentDate, newEndDate);
            
            // Solo si la fecha ya pasó
            if (attendanceDate <= new Date()) {
                // Ajustar hora a horario laboral (7am - 8pm)
                attendanceDate.setHours(getRandomInt(7, 20), getRandomInt(0, 59));
                
                await Attendance.create({
                    customer: customer._id,
                    checkInTime: attendanceDate,
                    createdBy
                });
            }
        }
      }

      // Actualizar estado final del cliente
      customer.membershipEndDate = lastEndDate;
      customer.paymentStatus = lastEndDate > new Date() ? 'Activo' : 'Inactivo';
      await customer.save();
    }

    console.log('✅ Pagos y asistencias generados.');
    console.log('🚀 Seed completado con éxito.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fatal en seed:', error);
    process.exit(1);
  }
}

seed();
