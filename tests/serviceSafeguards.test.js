import { describe, expect, it } from 'vitest';
import { FinDebtService } from '../src/application/findebtService.js';

class MemoryStore {
  constructor(seed = {}) { this.tables = { DOI_TUONG: [], CHUNG_TU_CONG_NO: [], THANH_TOAN: [], PHAN_BO_THANH_TOAN: [], HEN_THANH_TOAN: [], TAI_KHOAN_NGAN_HANG: [], AUDIT_LOG: [], CONFIG: [], ...seed }; }
  all(table) { return this.tables[table] ||= []; }
  insert(table, record) { this.all(table).push(record); return record; }
  insertMany(table, records) { this.all(table).push(...records); }
  update(table, idField, id, changes) { const row = this.all(table).find(item => String(item[idField]) === String(id)); if (!row) throw new Error(`Không tìm thấy ${id}`); const before = { ...row }; Object.assign(row, changes); return { before, after: row }; }
  config() { return {}; }
  setConfig() { /* Not needed by these tests. */ }
}

function service(seed = {}) {
  let sequence = 0;
  return new FinDebtService(new MemoryStore(seed), { id: prefix => `${prefix}-${++sequence}`, userEmail: () => 'owner@example.com', sendEmail: () => {} });
}

const partner = { Ma_DT: 'KH-1', Ten_DT: 'Khách A', Phan_Loai: 'KHACH_HANG', Trang_Thai: 'HOAT_DONG' };
const document = { Ma_CT: 'CT-1', Ma_DT: 'KH-1', Loai_Cong_No: 'PHAI_THU', So_Chung_Tu: 'INV-1', Ngay_Chung_Tu: '2026-08-01', Han_Thanh_Toan: '2099-08-31', So_Tien_Goc: 100, Trang_Thai_Ban_Ghi: 'HOAT_DONG' };

describe('service-side accounting safeguards', () => {
  it('blocks duplicate partners created from the direct form', () => {
    const app = service({ DOI_TUONG: [partner] });
    expect(() => app.savePartner({ Ten_DT: '  KHÁCH A ', Phan_Loai: 'KHACH_HANG' })).toThrow('đã tồn tại');
  });

  it('blocks voiding a document that still has an active payment', () => {
    const app = service({ CHUNG_TU_CONG_NO: [document], THANH_TOAN: [{ Ma_TT: 'TT-1', Trang_Thai_Ban_Ghi: 'HOAT_DONG' }], PHAN_BO_THANH_TOAN: [{ Ma_PB: 'PB-1', Ma_TT: 'TT-1', Ma_CT: 'CT-1', So_Tien_Phan_Bo: 25, Trang_Thai_Ban_Ghi: 'HOAT_DONG' }] });
    expect(() => app.voidRecord('CHUNG_TU_CONG_NO', 'CT-1')).toThrow('đã có thanh toán');
  });

  it('validates promise ownership and remaining balance', () => {
    const app = service({ DOI_TUONG: [partner, { ...partner, Ma_DT: 'KH-2', Ten_DT: 'Khách B' }], CHUNG_TU_CONG_NO: [document] });
    expect(() => app.savePromise({ Ma_DT: 'KH-2', Ma_CT: 'CT-1', Ngay_Hen: '2099-09-01', So_Tien_Hen: 50 })).toThrow('không thuộc');
    expect(() => app.savePromise({ Ma_DT: 'KH-1', Ma_CT: 'CT-1', Ngay_Hen: '2099-09-01', So_Tien_Hen: 101 })).toThrow('vượt');
  });

  it('keeps exactly one normalized default bank account', () => {
    const first = { Ma_TK: 'NH-OLD', Ma_Ngan_Hang: 'VCB', So_Tai_Khoan: '123456', Ten_Chu_Tai_Khoan: 'A', Mac_Dinh: true, Trang_Thai: 'HOAT_DONG' };
    const app = service({ TAI_KHOAN_NGAN_HANG: [first] });
    const saved = app.saveBankAccount({ Ma_Ngan_Hang: 'TCB', So_Tai_Khoan: ' 1234.5678 ', Ten_Chu_Tai_Khoan: 'B', Mac_Dinh: true });
    expect(saved.So_Tai_Khoan).toBe('12345678');
    expect(first.Mac_Dinh).toBe(false);
    expect(saved.Mac_Dinh).toBe(true);
  });
});
