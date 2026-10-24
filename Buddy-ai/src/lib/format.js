export const cn = (...values) => values.filter(Boolean).join(' ');

export function formatDate(value, options = { day: 'numeric', month: 'short' }) {
  if (!value) return 'ยังไม่กำหนด';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'ยังไม่กำหนด';
  return new Intl.DateTimeFormat('th-TH', options).format(date);
}

export function formatDateTime(value) {
  if (!value) return 'ไม่ระบุเวลา';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'ไม่ระบุเวลา';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

export function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'อรุณสวัสดิ์';
  if (hour < 17) return 'สวัสดีตอนบ่าย';
  return 'สวัสดีตอนเย็น';
}

export function localDateTimeInput(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export function initials(name = 'Student') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || 'S';
}

export function sortByDueDate(items = []) {
  return [...items].sort((a, b) => {
    const aDate = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
    const bDate = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
    return aDate - bDate;
  });
}
