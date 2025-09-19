export type CsvRow = Record<string, string | number | boolean | null | undefined>;

function escapeCsvField(value: string): string {
  // Escape double quotes by doubling them, and wrap in quotes if needed
  const needsQuoting = /[",\n\r]/.test(value) || value.startsWith(' ') || value.endsWith(' ');
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

export function toCsv(rows: CsvRow[], headers?: string[]): string {
  if (!rows || rows.length === 0) return '';
  const headerKeys = headers && headers.length > 0 ? headers : Object.keys(rows[0]);
  const headerLine = headerKeys.map(k => escapeCsvField(String(k))).join(',');
  const lines = rows.map(row => headerKeys.map(key => {
    const v = row[key];
    if (v === null || v === undefined) return '';
    return escapeCsvField(String(v));
  }).join(','));
  return [headerLine, ...lines].join('\r\n');
}

export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  // Simple CSV parser that supports quoted fields and commas/newlines within quotes
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        current.push(field);
        field = '';
      } else if (ch === '\n') {
        // Handle optional preceding \r
        current.push(field);
        rows.push(current);
        current = [];
        field = '';
      } else if (ch === '\r') {
        // ignore, will be handled when \n arrives
      } else {
        field += ch;
      }
    }
  }
  // Flush last field/row
  current.push(field);
  if (current.length > 1 || current[0] !== '') {
    rows.push(current);
  }

  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = rows[0];
  const dataRows = rows.slice(1).filter(r => r.some(cell => cell.trim() !== ''));
  const outRows: CsvRow[] = dataRows.map(r => {
    const obj: CsvRow = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = r[i] ?? '';
    }
    return obj;
  });
  return { headers, rows: outRows };
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}



