export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

export function monthOffsetMonthsAgo(m) {
  const d = new Date();
  d.setDate(15);
  d.setHours(12, 0, 0, 0);
  d.setMonth(d.getMonth() - m);
  return d;
}