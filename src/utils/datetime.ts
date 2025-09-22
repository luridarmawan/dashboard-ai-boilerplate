
export function getFormattedDateTime(locale: string = import.meta.env.VITE_LOCALE, timeZone: string = import.meta.env.VITE_TIMEZONE): string {
  return new Date().toLocaleString(locale, {
    weekday: 'long',   // Hari penuh (Senin, Selasa, ...)
    year: 'numeric',
    month: 'long',     // Nama bulan penuh
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: timeZone,
    timeZoneName: 'short' // WIB, GMT+7, dll.
  });
}

// contoh penggunaan:
//systemPrompt = systemPrompt.replaceAll('{{currentDateTime}}', getFormattedDateTime());


// Helper function to format date as dd/mm/yy hh:nn
export const formatDateTime = (date: any): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
