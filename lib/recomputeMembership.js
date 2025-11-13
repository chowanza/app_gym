import Payment from '@/models/Payment';
import Customer from '@/models/Customer';
import { addMonths } from '@/lib/membership';

export async function recomputeMembershipForCustomer(customerId) {
  const payments = await Payment.find({ customer: customerId }).sort({ paymentDate: 1, createdAt: 1 }).lean();
  let prevEnd = null;
  const updates = [];
  for (const p of payments) {
    const baseDate = new Date(p.paymentDate || p.createdAt);
    const base = prevEnd && prevEnd > baseDate ? prevEnd : baseDate;
    const months = p.membershipMonths || 1;
    const newEnd = addMonths(base, months);
    prevEnd = newEnd;
    updates.push({ _id: p._id, membershipEndAfter: newEnd });
  }
  if (updates.length) {
    const bulk = Payment.collection.initializeUnorderedBulkOp();
    for (const u of updates) {
      bulk.find({ _id: u._id }).updateOne({ $set: { membershipEndAfter: u.membershipEndAfter } });
    }
    await bulk.execute();
  }
  const now = new Date();
  const membershipEndDate = prevEnd || null;
  const paymentStatus = membershipEndDate && now <= new Date(membershipEndDate) ? 'Activo' : 'Inactivo';
  await Customer.updateOne({ _id: customerId }, { $set: { membershipEndDate, paymentStatus } });
  return { membershipEndDate, paymentStatus };
}
