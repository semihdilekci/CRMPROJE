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
