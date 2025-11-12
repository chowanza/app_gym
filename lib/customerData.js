import dbConnect from '@/lib/dbConnect';
import Customer from '@/models/Customer';
import Payment from '@/models/Payment';

export async function getCustomerById(id) {
  await dbConnect();
  const customer = await Customer.findById(id).lean();
  return customer || null;
}

export async function getPaymentsByCustomer(id) {
  await dbConnect();
  const payments = await Payment.find({ customer: id })
    .sort({ paymentDate: -1, createdAt: -1 })
    .lean();
  return payments || [];
}
