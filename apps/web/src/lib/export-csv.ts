interface CsvColumn {
  key: string;
  label: string;
  format?: 'number' | 'currency' | 'percent' | 'date';
}

function formatCsvValue(value: unknown, format?: string): string {
  if (value == null) return '';
  switch (format) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('tr-TR') : String(value);
    case 'currency':
      return typeof value === 'number' ? value.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : String(value);
    case 'percent':
      return typeof value === 'number' ? `${value.toFixed(1)}%` : String(value);
    case 'date':
      if (typeof value === 'string') {
        try {
          return new Date(value).toLocaleDateString('tr-TR');
        } catch {
          return value;
        }
      }
      return String(value);
    default:
      return String(value);
  }
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function exportToCsv(
  rows: Record<string, unknown>[],
  columns: CsvColumn[],
  filename = 'rapor',
): void {
  const BOM = '\uFEFF';
  const header = columns.map((c) => escapeCsvField(c.label)).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((col) => escapeCsvField(formatCsvValue(row[col.key], col.format)))
        .join(','),
    )
    .join('\n');

  const csv = `${BOM}${header}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
