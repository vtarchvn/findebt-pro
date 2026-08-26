import { SCHEMA_VERSION, TABLES, migrateSpreadsheet } from './schema.js';

const CIVIL_DATE_FIELDS = new Set(['Ngay_Chung_Tu', 'Han_Thanh_Toan', 'Ngay_Thanh_Toan', 'Ngay_Du_Kien', 'Ngay_Hen']);

export class SheetStore {
  constructor(spreadsheet) { this.spreadsheet = spreadsheet; this.cache = new Map(); this.pending = null; }

  needsMigration() {
    const config = this.spreadsheet.getSheetByName('CONFIG');
    if (config && config.getLastRow() > 1) {
      const rows = config.getRange(2, 1, config.getLastRow() - 1, 2).getValues();
      if (Number(rows.find(row => row[0] === 'SCHEMA_VERSION')?.[1]) >= SCHEMA_VERSION) return false;
    }
    return true;
  }

  migrate() {
    if (!this.needsMigration()) return false;
    migrateSpreadsheet(this.spreadsheet); this.cache.clear(); return true;
  }

  all(table) {
    if (this.cache.has(table)) return this.cache.get(table);
    const sheet = this.sheet(table); const lastRow = sheet.getLastRow();
    if (lastRow < 2) { this.cache.set(table, []); return this.cache.get(table); }
    const headers = TABLES[table];
    const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues().map(row => Object.fromEntries(headers.map((h, i) => [h, serializeCell(row[i], h)])));
    this.cache.set(table, rows); return rows;
  }

  insert(table, record) {
    if (this.pending) { this.pending.set(table, [...(this.pending.get(table) || []), record]); this.cache.set(table, [...this.all(table), record]); return record; }
    const headers = TABLES[table]; const current = this.all(table);
    this.sheet(table).appendRow(headers.map(header => record[header] ?? ''));
    this.cache.set(table, [...current, record]);
    return record;
  }

  insertMany(table, records) {
    if (!records.length) return;
    if (this.pending) { this.pending.set(table, [...(this.pending.get(table) || []), ...records]); this.cache.set(table, [...this.all(table), ...records]); return; }
    const headers = TABLES[table]; const sheet = this.sheet(table); const current = this.all(table);
    sheet.getRange(sheet.getLastRow() + 1, 1, records.length, headers.length).setValues(records.map(record => headers.map(header => record[header] ?? '')));
    this.cache.set(table, [...current, ...records]);
  }

  batch(operation) {
    if (this.pending) return operation();
    this.pending = new Map();
    try { const result = operation(); this.flush(); return result; }
    catch (error) { this.pending = null; this.cache.clear(); throw error; }
  }

  flush() {
    const pending = this.pending; this.pending = null;
    pending.forEach((records, table) => {
      if (!records.length) return;
      const headers = TABLES[table]; const sheet = this.sheet(table);
      sheet.getRange(sheet.getLastRow() + 1, 1, records.length, headers.length).setValues(records.map(record => headers.map(header => record[header] ?? '')));
    });
  }

  update(table, idField, id, changes) {
    const headers = TABLES[table]; const rows = this.all(table); const index = rows.findIndex(row => String(row[idField]) === String(id));
    if (index < 0) throw new Error(`Không tìm thấy ${id}`);
    const before = rows[index]; const after = { ...before, ...changes };
    this.sheet(table).getRange(index + 2, 1, 1, headers.length).setValues([headers.map(header => after[header] ?? '')]);
    rows[index] = after; this.cache.set(table, rows);
    return { before, after };
  }

  config() { return Object.fromEntries(this.all('CONFIG').map(row => [row.Khoa, row.Gia_Tri])); }
  setConfig(values) {
    const existing = new Map(this.all('CONFIG').map((row, index) => [row.Khoa, index + 2])); const sheet = this.sheet('CONFIG'); const now = new Date();
    Object.entries(values).forEach(([key, value]) => existing.has(key) ? sheet.getRange(existing.get(key), 2, 1, 2).setValues([[value, now]]) : sheet.appendRow([key, value, now])); this.cache.delete('CONFIG');
  }
  sheet(table) { const sheet = this.spreadsheet.getSheetByName(table); if (!sheet) throw new Error(`Thiếu sheet ${table}`); return sheet; }
}

function serializeCell(value, field) {
  if (!(value instanceof Date)) return value;
  if (CIVIL_DATE_FIELDS.has(field)) return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  return value.toISOString();
}
