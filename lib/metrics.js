import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import Customer from '@/models/Customer';

export async function getDashboardMetrics({ from, to } = {}) {
  await dbConnect();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const isDefault = !from && !to;
  const isExplicitToday = from === todayStr && to === todayStr;
  const isToday = isDefault || isExplicitToday;
  
  // Default ranges if not provided
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  // Parse filter dates if provided
  const filterFrom = from ? new Date(from) : null;
  const filterTo = to ? new Date(to) : null;
  // Adjust filterTo to include the end of the day if it's just a date string
  if (filterTo) {
    filterTo.setHours(23, 59, 59, 999);
  }

  // Build queries
  const paymentQuery = {};
  const customerQuery = {};
  const attendanceQuery = {};

  if (filterFrom && filterTo) {
    paymentQuery.paymentDate = { $gte: filterFrom, $lte: filterTo };
    customerQuery.createdAt = { $gte: filterFrom, $lte: filterTo };
    attendanceQuery.checkInTime = { $gte: filterFrom, $lte: filterTo };
  } else {
    // Default behavior: Today for everything
    paymentQuery.paymentDate = { $gte: startOfToday, $lt: endOfToday };
    customerQuery.createdAt = { $gte: startOfToday, $lt: endOfToday };
    attendanceQuery.checkInTime = { $gte: startOfToday, $lt: endOfToday };
  }

  const [totalCustomers, newCustomersCount, paymentsByMethod, activeCustomers] = await Promise.all([
    Customer.countDocuments(), // Total ever
    Customer.countDocuments(customerQuery),
    Payment.aggregate([
      { $match: paymentQuery },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' } } },
    ]),
    Customer.countDocuments({ paymentStatus: 'Activo', membershipEndDate: { $gte: startOfToday } }), // Active is always "now"
  ]);

  const totalPayments = paymentsByMethod.reduce((acc, curr) => acc + curr.total, 0);

  const { default: Attendance } = await import('@/models/Attendance');
  const attendancesCount = await Attendance.countDocuments(attendanceQuery);

  return {
    totalPayments,
    paymentsByMethod,
    newCustomersCount,
    totalCustomers,
    activeCustomers,
    attendancesCount,
    isFiltered: !!(filterFrom && filterTo),
    isToday,
  };
}
