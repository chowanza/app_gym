import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import Customer from '@/models/Customer';

export async function getDashboardMetrics() {
  await dbConnect();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const [totalCustomers, customersThisMonthAgg, paymentsAgg, activeCustomers] = await Promise.all([
    Customer.countDocuments(),
    Customer.countDocuments({ createdAt: { $gte: startOfMonth, $lt: startOfNextMonth } }),
    Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Customer.countDocuments({ paymentStatus: 'Activo', membershipEndDate: { $gte: startOfToday } }),
  ]);

  const totalPayments = paymentsAgg?.[0]?.total || 0;

  const { default: Attendance } = await import('@/models/Attendance');
  const attendancesToday = await Attendance.countDocuments({ checkInTime: { $gte: startOfToday, $lt: endOfToday } });

  return {
    totalPayments,
    customersThisMonth: customersThisMonthAgg || 0,
    totalCustomers,
    activeCustomers,
    attendancesToday,
  };
}
