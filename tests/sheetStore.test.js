import { describe, expect, it } from 'vitest';
import { SheetStore } from '../src/infrastructure/sheetStore.js';
import { TABLES } from '../src/infrastructure/schema.js';

function createSpreadsheet(table, values = []) {
  const writes = []; let reads = 0; let lastRow = values.length + 1;
  const sheet = {
    getLastRow: () => lastRow,
    getRange: (_row, _column, _rows, _columns) => ({
      getValues: () => { reads += 1; return values; },
      setValues: rows => { writes.push(rows); lastRow += rows.length; }
    }),
    appendRow: row => { writes.push([row]); lastRow += 1; }
  };
  return { spreadsheet: { getSheetByName: name => name === table ? sheet : null }, writes, reads: () => reads };
}

describe('SheetStore request snapshot and batching', () => {
  it('reads a table only once inside one request', () => {
    const row = TABLES.DOI_TUONG.map(header => header === 'Ma_DT' ? 'KH-001' : '');
    const mock = createSpreadsheet('DOI_TUONG', [row]); const store = new SheetStore(mock.spreadsheet);
    expect(store.all('DOI_TUONG')[0].Ma_DT).toBe('KH-001');
    expect(store.all('DOI_TUONG')[0].Ma_DT).toBe('KH-001');
    expect(mock.reads()).toBe(1);
  });

  it('flushes many inserts with one setValues call per table', () => {
    const mock = createSpreadsheet('DOI_TUONG'); const store = new SheetStore(mock.spreadsheet);
    store.batch(() => {
      store.insert('DOI_TUONG', { Ma_DT: 'KH-001', Ten_DT: 'A' });
      store.insert('DOI_TUONG', { Ma_DT: 'KH-002', Ten_DT: 'B' });
    });
    expect(mock.writes).toHaveLength(1);
    expect(mock.writes[0]).toHaveLength(2);
    expect(store.all('DOI_TUONG')).toHaveLength(2);
  });
});
