export function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // Ajuste por meses con menos días
  if (d.getDate() < day) {
    d.setDate(0);
  }
  return d;
}

export function isMembershipActive(membershipEndDate) {
  if (!membershipEndDate) return false;
  const now = new Date();
  return now <= new Date(membershipEndDate);
}
