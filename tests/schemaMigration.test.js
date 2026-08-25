import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SCHEMA_VERSION, USER_SHEETS, migrateSpreadsheet } from '../src/infrastructure/schema.js';

class FakeProtection {
  constructor(range = null) { this.range = range; }
  getRange() { return this.range; }
  setDescription() { return this; }
  setWarningOnly() { return this; }
}

class FakeRange {
  constructor(sheet, a1, row = 1, column = 1, rowCount = 1, columnCount = 1) { Object.assign(this, { sheet, a1, row, column, rowCount, columnCount }); }
  getA1Notation() { return this.a1; }
  getValues() { return Array.from({ length: this.rowCount }, (_, rowOffset) => { const values = this.sheet.values[this.row - 1 + rowOffset]; return Array.from({ length: this.columnCount }, (_unused, index) => values?.[this.column - 1 + index] ?? ''); }); }
  setValues(rows) { rows.forEach((values, rowOffset) => values.forEach((value, columnOffset) => this.sheet.setCell(this.row + rowOffset, this.column + columnOffset, value))); return this; }
  setValue(value) { return this.setValues([[value]]); }
  protect() { const protection = new FakeProtection(this); this.sheet.rangeProtections.push(protection); return protection; }
  createFilter() { this.sheet.filter = { remove: () => { this.sheet.filter = null; } }; return this.sheet.filter; }
  isPartOfMerge() { return false; }
  merge() { return this; }
}

['clearContent', 'clearFormat', 'setBackground', 'setDataValidation', 'setFontColor', 'setFontFamily', 'setFontSize', 'setFontWeight', 'setFormulaR1C1', 'setHorizontalAlignment', 'setNotes', 'setNumberFormat', 'setVerticalAlignment', 'setWrap'].forEach(method => { FakeRange.prototype[method] = function chainRange() { return this; }; });

class FakeSheet {
  constructor(parent, name) { this.parent = parent; this.name = name; this.values = []; this.hidden = false; this.filter = null; this.sheetProtections = []; this.rangeProtections = []; }
  setCell(row, column, value) { this.values[row - 1] ||= []; this.values[row - 1][column - 1] = value; }
  getName() { return this.name; }
  setName(name) { this.parent.sheets.delete(this.name); this.name = name; this.parent.sheets.set(name, this); return this; }
  getParent() { return this.parent; }
  getLastRow() { return this.values.reduce((last, row, index) => row?.some(value => value !== '') ? index + 1 : last, 0); }
  getLastColumn() { return this.values.reduce((last, row) => Math.max(last, row?.length || 0), 0); }
  getMaxRows() { return 1004; }
  getDataRange() { return new FakeRange(this, 'A1', 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  getRange(a1OrRow, column, rowCount, columnCount) { if (typeof a1OrRow === 'number') return new FakeRange(this, `R${a1OrRow}C${column}:${rowCount || 1}x${columnCount || 1}`, a1OrRow, column, rowCount, columnCount); return new FakeRange(this, a1OrRow); }
  getFilter() { return this.filter; }
  getProtections(type) { return type === 'RANGE' ? this.rangeProtections : this.sheetProtections; }
  protect() { const protection = new FakeProtection(); this.sheetProtections.push(protection); return protection; }
  insertRowsBefore(index, count) { this.values.splice(index - 1, 0, ...Array.from({ length: count }, () => [])); return this; }
  showSheet() { this.hidden = false; return this; }
  hideSheet() { this.hidden = true; return this; }
  isSheetHidden() { return this.hidden; }
  setFrozenRows() { /* Apps Script returns void. */ }
  appendRow(values) { this.values.push(values); return this; }
}

['setColumnWidth', 'setColumnWidths', 'setHiddenGridlines', 'setRowHeight', 'setRowHeights', 'setTabColor'].forEach(method => { FakeSheet.prototype[method] = function chainSheet() { return this; }; });
FakeSheet.prototype.setConditionalFormatRules = function setConditionalFormatRules() { /* Apps Script returns void. */ };

class FakeSpreadsheet {
  constructor() { this.sheets = new Map(); }
  getSheetByName(name) { return this.sheets.get(name) || null; }
  insertSheet(name) { const sheet = new FakeSheet(this, name); this.sheets.set(name, sheet); return sheet; }
  setActiveSheet(sheet) { this.activeSheet = sheet; return sheet; }
  moveActiveSheet() { /* Apps Script returns void. */ }
}

function chainBuilder() { return new Proxy({}, { get: (_target, property) => property === 'build' ? () => ({}) : () => chainBuilder() }); }

describe('schema migration against the Apps Script surface', () => {
  beforeEach(() => { globalThis.SpreadsheetApp = { ProtectionType: { RANGE: 'RANGE', SHEET: 'SHEET' }, newDataValidation: chainBuilder, newConditionalFormatRule: chainBuilder }; });
  afterEach(() => { delete globalThis.SpreadsheetApp; });

  it('creates every user sheet without calling methods on void or the wrong object', () => {
    const spreadsheet = new FakeSpreadsheet();
    migrateSpreadsheet(spreadsheet);
    Object.values(USER_SHEETS).forEach(name => expect(spreadsheet.getSheetByName(name)).not.toBeNull());
    expect(spreadsheet.getSheetByName(USER_SHEETS.LOOKUPS).isSheetHidden()).toBe(true);
    expect(spreadsheet.getSheetByName('CONFIG').values.some(row => row?.[0] === 'SCHEMA_VERSION' && row?.[1] === SCHEMA_VERSION)).toBe(true);
  });

  it('keeps legacy staging rows and remains safe when migration is retried', () => {
    const spreadsheet = new FakeSpreadsheet();
    const legacy = spreadsheet.insertSheet('NHAP_DOI_TUONG');
    legacy.getRange(1, 1, 2, 2).setValues([['Ten_DT', 'Phan_Loai'], ['Công ty mẫu', 'KHACH_HANG']]);
    migrateSpreadsheet(spreadsheet);
    migrateSpreadsheet(spreadsheet);
    const input = spreadsheet.getSheetByName(USER_SHEETS.PARTNER_INPUT);
    expect(input.values[5]?.[0]).toBe('Công ty mẫu');
    expect(input.rangeProtections).toHaveLength(2);
  });
});
