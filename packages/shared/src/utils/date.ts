const TURKISH_MONTHS = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
] as const;

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = TURKISH_MONTHS[d.getMonth()]!;
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = TURKISH_MONTHS[d.getMonth()]!;
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

/** ISO string → dd.mm.yyyy (form input display). Returns '' for invalid. */
export function formatDateInput(iso: string): string {
  if (!iso?.trim()) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/** dd.mm.yyyy → ISO string (form submit). Returns null if invalid. */
export function parseDateInput(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const day = parseInt(d!, 10);
  const month = parseInt(m!, 10) - 1;
  const year = parseInt(y!, 10);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date.toISOString();
}
