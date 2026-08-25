import { TABLES, migrateSpreadsheet } from './schema.js';

export class SheetStore {
  constructor(spreadsheet) { this.spreadsheet = spreadsheet; }
  migrate() { migrateSpreadsheet(this.spreadsheet); }

  all(table) {
    const sheet = this.sheet(table); const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    const headers = TABLES[table];
    return sheet.getRange(2, 1, lastRow - 1, headers.length).getValues().map(row => Object.fromEntries(headers.map((h, i) => [h, serializeCell(row[i])])));
  }

  insert(table, record) {
    const headers = TABLES[table];
    this.sheet(table).appendRow(headers.map(header => record[header] ?? ''));
    return record;
  }

  insertMany(table, records) {
    if (!records.length) return;
    const headers = TABLES[table]; const sheet = this.sheet(table);
    sheet.getRange(sheet.getLastRow() + 1, 1, records.length, headers.length).setValues(records.map(record => headers.map(header => record[header] ?? '')));
  }

  update(table, idField, id, changes) {
    const headers = TABLES[table]; const rows = this.all(table); const index = rows.findIndex(row => String(row[idField]) === String(id));
    if (index < 0) throw new Error(`Không tìm thấy ${id}`);
    const before = rows[index]; const after = { ...before, ...changes };
    this.sheet(table).getRange(index + 2, 1, 1, headers.length).setValues([headers.map(header => after[header] ?? '')]);
    return { before, after };
  }

  config() { return Object.fromEntries(this.all('CONFIG').map(row => [row.Khoa, row.Gia_Tri])); }
  setConfig(values) {
    const existing = new Map(this.all('CONFIG').map((row, index) => [row.Khoa, index + 2])); const sheet = this.sheet('CONFIG'); const now = new Date();
    Object.entries(values).forEach(([key, value]) => existing.has(key) ? sheet.getRange(existing.get(key), 2, 1, 2).setValues([[value, now]]) : sheet.appendRow([key, value, now]));
  }
  sheet(table) { const sheet = this.spreadsheet.getSheetByName(table); if (!sheet) throw new Error(`Thiếu sheet ${table}`); return sheet; }
}

function serializeCell(value) { return value instanceof Date ? value.toISOString() : value; }
