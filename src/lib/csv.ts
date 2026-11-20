function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  // Neutralize CSV formula injection (Excel/Sheets)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function buildCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  return [headerLine, ...dataLines].join('\r\n');
}
