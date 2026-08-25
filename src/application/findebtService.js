import { DOC_TYPES, creditLimitCheck, documentState, shouldSendReminder, summarize, validateAllocation, vietQrUrl } from '../domain/accounting.js';

const ID_FIELDS = { DOI_TUONG: 'Ma_DT', CHUNG_TU_CONG_NO: 'Ma_CT', THANH_TOAN: 'Ma_TT', PHAN_BO_THANH_TOAN: 'Ma_PB', NHAC_NO: 'Ma_Nhac', HEN_THANH_TOAN: 'Ma_Hen', TAI_KHOAN_NGAN_HANG: 'Ma_TK' };

export class FinDebtService {
  constructor(store, deps) { this.store = store; this.deps = deps; }

  initialize(company = {}) {
    this.store.migrate();
    const defaults = { TEN_DOANH_NGHIEP: company.name || 'Doanh nghiệp của tôi', EMAIL_KE_TOAN: company.email || this.deps.userEmail(), THEME: 'dark', NHAC_NO_LICH: '-3,0,3,7,14,30', NHAC_NO_SAU_30: '7', EMAIL_TEMPLATE: defaultEmailTemplate() };
    const current = this.store.config(); const missing = Object.fromEntries(Object.entries(defaults).filter(([key]) => current[key] === undefined));
    this.store.setConfig(missing); this.audit('KHOI_TAO', 'CONFIG', 'SYSTEM', null, missing);
    return { ok: true, company: { ...defaults, ...current, ...missing } };
  }

  bootstrap(today = new Date()) {
    const config = this.store.config(); const partners = this.store.all('DOI_TUONG').filter(row => row.Trang_Thai !== 'DA_HUY');
    const model = this.accountingModel(today); const promises = this.store.all('HEN_THANH_TOAN').filter(row => row.Trang_Thai === 'DANG_HEN');
    return { initialized: Boolean(config.SCHEMA_VERSION), config: publicConfig(config), partners, dashboard: dashboard(model.summary, promises, today), documents: model.summary.rows.slice().sort((a, b) => String(b.Ngay_Chung_Tu).localeCompare(String(a.Ngay_Chung_Tu))).slice(0, 100), bankAccounts: this.store.all('TAI_KHOAN_NGAN_HANG').filter(row => row.Trang_Thai !== 'DA_HUY'), promises };
  }

  savePartner(input) {
    requireText(input.Ten_DT, 'Tên đối tượng');
    if (!['KHACH_HANG', 'NHA_CUNG_CAP'].includes(input.Phan_Loai)) throw new Error('Phân loại không hợp lệ');
    const now = new Date(); const record = { ...input, Ma_DT: input.Ma_DT || this.deps.id(input.Phan_Loai === 'KHACH_HANG' ? 'KH' : 'NCC'), Han_Muc_Tin_Dung: money(input.Han_Muc_Tin_Dung), Du_No_Dau_Ky: money(input.Du_No_Dau_Ky), Thoi_Han_No_Chuan: integer(input.Thoi_Han_No_Chuan || 30), Cho_Phep_Nhac_No: input.Cho_Phep_Nhac_No !== false, Kenh_Nhac_No: input.Kenh_Nhac_No || 'EMAIL', Nhac_Truoc_Han: integer(input.Nhac_Truoc_Han ?? 3), Chu_Ky_Nhac_Qua_Han: integer(input.Chu_Ky_Nhac_Qua_Han ?? 7), Trang_Thai: 'HOAT_DONG', Created_At: now, Updated_At: now };
    this.store.insert('DOI_TUONG', record);
    if (record.Du_No_Dau_Ky > 0) {
      const due = new Date(now); due.setDate(due.getDate() + record.Thoi_Han_No_Chuan);
      this.store.insert('CHUNG_TU_CONG_NO', { Ma_CT: this.deps.id('CTDK'), Ma_DT: record.Ma_DT, Loai_Cong_No: record.Phan_Loai === 'KHACH_HANG' ? DOC_TYPES.RECEIVABLE : DOC_TYPES.PAYABLE, So_Chung_Tu: `DAU-KY-${record.Ma_DT}`, Ngay_Chung_Tu: now, Han_Thanh_Toan: due, So_Tien_Goc: record.Du_No_Dau_Ky, Dien_Giai: 'Số dư đầu kỳ', Trang_Thai_Ban_Ghi: 'HOAT_DONG', Created_At: now, Updated_At: now });
    }
    this.audit('TAO_DOI_TUONG', 'DOI_TUONG', record.Ma_DT, null, record); return record;
  }

  createDocument(input) {
    requireText(input.Ma_DT, 'Đối tượng'); requireText(input.So_Chung_Tu, 'Số chứng từ');
    if (!Object.values(DOC_TYPES).includes(input.Loai_Cong_No)) throw new Error('Loại công nợ không hợp lệ');
    const partners = this.store.all('DOI_TUONG'); const partner = partners.find(p => p.Ma_DT === input.Ma_DT && p.Trang_Thai !== 'DA_HUY');
    if (!partner) throw new Error('Đối tượng không tồn tại');
    const duplicate = this.store.all('CHUNG_TU_CONG_NO').find(row => row.Ma_DT === input.Ma_DT && row.Loai_Cong_No === input.Loai_Cong_No && String(row.So_Chung_Tu).trim().toLocaleLowerCase('vi-VN') === String(input.So_Chung_Tu).trim().toLocaleLowerCase('vi-VN') && row.Trang_Thai_Ban_Ghi !== 'DA_HUY');
    if (duplicate) throw new Error('Số chứng từ đã tồn tại với đối tượng và loại công nợ này');
    const amount = moneyPositive(input.So_Tien_Goc); const model = this.accountingModel(new Date());
    const partnerDebt = model.summary.rows.filter(d => d.Ma_DT === input.Ma_DT && d.Loai_Cong_No === DOC_TYPES.RECEIVABLE).reduce((sum, d) => sum + d.outstanding, 0);
    const credit = input.Loai_Cong_No === DOC_TYPES.RECEIVABLE ? creditLimitCheck(partnerDebt, amount, money(partner.Han_Muc_Tin_Dung)) : null;
    const now = new Date(); const record = { Ma_CT: this.deps.id('CT'), Ma_DT: input.Ma_DT, Loai_Cong_No: input.Loai_Cong_No, So_Chung_Tu: String(input.So_Chung_Tu).trim(), Ngay_Chung_Tu: validDate(input.Ngay_Chung_Tu), Han_Thanh_Toan: validDate(input.Han_Thanh_Toan), So_Tien_Goc: amount, Dien_Giai: clean(input.Dien_Giai), Trang_Thai_Ban_Ghi: 'HOAT_DONG', Created_At: now, Updated_At: now };
    this.store.insert('CHUNG_TU_CONG_NO', record); this.audit('TAO_CHUNG_TU', 'CHUNG_TU_CONG_NO', record.Ma_CT, null, record); return { document: record, credit };
  }

  recordPayment(input) {
    requireText(input.Ma_DT, 'Đối tượng');
    const amount = moneyPositive(input.So_Tien); const allocationInputs = Array.isArray(input.Phan_Bo) ? input.Phan_Bo : [];
    const docs = this.store.all('CHUNG_TU_CONG_NO'); const docMap = new Map(docs.map(row => [row.Ma_CT, mapDocument(row)]));
    const payment = { id: this.deps.id('TT'), partnerId: input.Ma_DT, type: input.Loai_Cong_No, amount };
    const allocations = allocationInputs.map(row => ({ documentId: row.Ma_CT, amount: moneyPositive(row.So_Tien_Phan_Bo) }));
    validateAllocation(payment, allocations, docMap);
    const existingModel = this.accountingModel(new Date());
    allocations.forEach(allocation => { const doc = docMap.get(allocation.documentId); const state = documentState(doc, existingModel.allocations, existingModel.payments); if (allocation.amount > state.outstanding) throw new Error(`Phân bổ vượt dư còn lại của ${allocation.documentId}`); });
    const now = new Date(); const record = { Ma_TT: payment.id, Ma_DT: input.Ma_DT, Loai_Cong_No: input.Loai_Cong_No, Ngay_Thanh_Toan: validDate(input.Ngay_Thanh_Toan), So_Tien: amount, Phuong_Thuc: clean(input.Phuong_Thuc) || 'CHUYEN_KHOAN', Tham_Chieu: clean(input.Tham_Chieu), Ghi_Chu: clean(input.Ghi_Chu), Trang_Thai_Ban_Ghi: 'HOAT_DONG', Created_At: now, Updated_At: now };
    this.store.insert('THANH_TOAN', record);
    const allocationRows = allocations.map(allocation => ({ Ma_PB: this.deps.id('PB'), Ma_TT: record.Ma_TT, Ma_CT: allocation.documentId, So_Tien_Phan_Bo: allocation.amount, Trang_Thai_Ban_Ghi: 'HOAT_DONG', Created_At: now }));
    this.store.insertMany('PHAN_BO_THANH_TOAN', allocationRows); this.audit('GHI_NHAN_THANH_TOAN', 'THANH_TOAN', record.Ma_TT, null, { ...record, allocations: allocationRows }); return record;
  }

  voidRecord(table, id) {
    if (!['CHUNG_TU_CONG_NO', 'THANH_TOAN'].includes(table)) throw new Error('Không thể hủy loại dữ liệu này');
    const result = this.store.update(table, ID_FIELDS[table], id, { Trang_Thai_Ban_Ghi: 'DA_HUY', Updated_At: new Date() });
    this.audit('HUY_GIAO_DICH', table, id, result.before, result.after); return result.after;
  }

  savePromise(input) {
    const record = { Ma_Hen: this.deps.id('HEN'), Ma_DT: requireText(input.Ma_DT, 'Đối tượng'), Ma_CT: clean(input.Ma_CT), Ngay_Hen: validDate(input.Ngay_Hen), So_Tien_Hen: moneyPositive(input.So_Tien_Hen), Ghi_Chu: clean(input.Ghi_Chu), Trang_Thai: 'DANG_HEN', Created_At: new Date(), Updated_At: new Date() };
    this.store.insert('HEN_THANH_TOAN', record); this.audit('TAO_LICH_HEN', 'HEN_THANH_TOAN', record.Ma_Hen, null, record); return record;
  }

  saveBankAccount(input) {
    ['Ma_Ngan_Hang', 'So_Tai_Khoan', 'Ten_Chu_Tai_Khoan'].forEach(field => requireText(input[field], field));
    const record = { Ma_TK: this.deps.id('NH'), Ma_Ngan_Hang: clean(input.Ma_Ngan_Hang).toUpperCase(), So_Tai_Khoan: clean(input.So_Tai_Khoan), Ten_Chu_Tai_Khoan: clean(input.Ten_Chu_Tai_Khoan), Ten_Hien_Thi: clean(input.Ten_Hien_Thi), Mac_Dinh: Boolean(input.Mac_Dinh), Trang_Thai: 'HOAT_DONG', Created_At: new Date(), Updated_At: new Date() };
    this.store.insert('TAI_KHOAN_NGAN_HANG', record); this.audit('TAO_TAI_KHOAN', 'TAI_KHOAN_NGAN_HANG', record.Ma_TK, null, { ...record, So_Tai_Khoan: maskAccount(record.So_Tai_Khoan) }); return record;
  }

  getVietQr(documentId, accountId) {
    const model = this.accountingModel(new Date()); const document = model.summary.rows.find(row => row.Ma_CT === documentId); if (!document) throw new Error('Không tìm thấy chứng từ');
    const accounts = this.store.all('TAI_KHOAN_NGAN_HANG').filter(a => a.Trang_Thai !== 'DA_HUY'); const account = accounts.find(a => a.Ma_TK === accountId) || accounts.find(a => truthy(a.Mac_Dinh)) || accounts[0];
    return { url: vietQrUrl(mapBank(account), mapDocument(document), document), amount: document.outstanding };
  }

  accountingModel(today) {
    const rawDocuments = this.store.all('CHUNG_TU_CONG_NO'); const rawPayments = this.store.all('THANH_TOAN'); const rawAllocations = this.store.all('PHAN_BO_THANH_TOAN');
    const documents = rawDocuments.map(mapDocument); const payments = rawPayments.map(row => ({ id: row.Ma_TT, partnerId: row.Ma_DT, type: row.Loai_Cong_No, amount: money(row.So_Tien), voided: row.Trang_Thai_Ban_Ghi === 'DA_HUY' }));
    const allocations = rawAllocations.map(row => ({ paymentId: row.Ma_TT, documentId: row.Ma_CT, amount: money(row.So_Tien_Phan_Bo), voided: row.Trang_Thai_Ban_Ghi === 'DA_HUY' }));
    const summary = summarize(documents, allocations, payments, today); return { rawDocuments, documents, payments, allocations, summary };
  }

  processReminders(today = new Date()) {
    const model = this.accountingModel(today); const config = this.store.config(); const partners = new Map(this.store.all('DOI_TUONG').map(p => [p.Ma_DT, p])); const promises = this.store.all('HEN_THANH_TOAN').filter(p => p.Trang_Thai === 'DANG_HEN');
    const sentKeys = new Set(this.store.all('NHAC_NO').filter(r => r.Trang_Thai === 'DA_GUI').map(r => r.Reminder_Key)); const schedule = String(config.NHAC_NO_LICH || '-3,0,3,7,14,30').split(',').map(Number); const results = [];
    model.summary.rows.forEach(document => {
      const partner = partners.get(document.Ma_DT); if (!partner || !truthy(partner.Cho_Phep_Nhac_No) || !partner.Email) return;
      const relative = Math.floor((day(today) - day(document.Han_Thanh_Toan)) / 86400000); const cadence = Number(config.NHAC_NO_SAU_30 || 7); if (!schedule.includes(relative) && !(relative > 30 && relative % cadence === 0)) return;
      const reminderKey = `${document.Ma_CT}:${dateKey(today)}`; const promise = promises.find(p => (!p.Ma_CT || p.Ma_CT === document.Ma_CT) && p.Ma_DT === document.Ma_DT);
      if (!shouldSendReminder({ state: document, reminderKey, sentKeys, promiseUntil: promise?.Ngay_Hen, today })) return;
      const content = renderEmail(config.EMAIL_TEMPLATE || defaultEmailTemplate(), partner, document, config); const reminder = { Ma_Nhac: this.deps.id('NN'), Ma_CT: document.Ma_CT, Ma_DT: document.Ma_DT, Loai_Nhac: relative < 0 ? 'SAP_DEN_HAN' : relative === 0 ? 'DEN_HAN' : 'QUA_HAN', Ngay_Du_Kien: today, Ngay_Da_Gui: '', Kenh: 'EMAIL', Nguoi_Nhan: partner.Email, So_Tien_Con_Lai: document.outstanding, Trang_Thai: 'CHO_GUI', Noi_Dung: content, Pdf_File_Id: '', Reminder_Key: reminderKey, Created_At: new Date() };
      this.store.insert('NHAC_NO', reminder);
      try { this.deps.sendEmail(partner.Email, `FINDEBT — Công nợ ${document.So_Chung_Tu}`, content); const update = this.store.update('NHAC_NO', 'Ma_Nhac', reminder.Ma_Nhac, { Trang_Thai: 'DA_GUI', Ngay_Da_Gui: new Date() }); results.push(update.after); }
      catch (error) { this.store.update('NHAC_NO', 'Ma_Nhac', reminder.Ma_Nhac, { Trang_Thai: 'LOI', Noi_Dung: `${content}\n\nLỗi: ${error.message}` }); }
    });
    return results;
  }

  audit(action, table, id, before, after) { this.store.insert('AUDIT_LOG', { Ma_Log: this.deps.id('LOG'), Nguoi_Dung: this.deps.userEmail(), Hanh_Dong: action, Bang_Du_Lieu: table, Ma_Ban_Ghi: id, Du_Lieu_Truoc: before ? JSON.stringify(before) : '', Du_Lieu_Sau: after ? JSON.stringify(after) : '', Thoi_Gian: new Date() }); }
}

function mapDocument(row) { return { ...row, id: row.Ma_CT, partnerId: row.Ma_DT, type: row.Loai_Cong_No, originalAmount: money(row.So_Tien_Goc), dueDate: row.Han_Thanh_Toan, voided: row.Trang_Thai_Ban_Ghi === 'DA_HUY' }; }
function mapBank(row) { return row ? { bankCode: row.Ma_Ngan_Hang, accountNumber: row.So_Tai_Khoan, accountName: row.Ten_Chu_Tai_Khoan } : null; }
function dashboard(summary, promises, today) { const open = summary.rows.filter(row => row.outstanding > 0); return { kpis: { receivable: summary.receivable, payable: summary.payable, net: summary.net, overdue: summary.overdue }, aging: summary.aging, dueSoon: open.filter(row => day(row.Han_Thanh_Toan) >= day(today) && day(row.Han_Thanh_Toan) - day(today) <= 7 * 86400000).slice(0, 8), overdue: open.filter(row => row.daysOverdue > 0).sort((a, b) => b.daysOverdue - a.daysOverdue).slice(0, 8), promises: { today: promises.filter(p => dateKey(p.Ngay_Hen) === dateKey(today)), upcoming: promises.filter(p => day(p.Ngay_Hen) > day(today)), late: promises.filter(p => day(p.Ngay_Hen) < day(today)) } }; }
function publicConfig(config) { const allowed = ['TEN_DOANH_NGHIEP', 'THEME', 'NHAC_NO_LICH', 'NHAC_NO_SAU_30', 'EMAIL_TEMPLATE']; return Object.fromEntries(allowed.map(key => [key, config[key]])); }
function renderEmail(template, partner, document, config) { return String(template).replaceAll('{{TEN_KHACH_HANG}}', partner.Ten_DT).replaceAll('{{SO_CHUNG_TU}}', document.So_Chung_Tu).replaceAll('{{SO_TIEN_CON_LAI}}', formatVnd(document.outstanding)).replaceAll('{{HAN_THANH_TOAN}}', dateKey(document.Han_Thanh_Toan)).replaceAll('{{TEN_DOANH_NGHIEP}}', config.TEN_DOANH_NGHIEP || 'Doanh nghiệp'); }
function defaultEmailTemplate() { return 'Kính gửi {{TEN_KHACH_HANG}},\n\n{{TEN_DOANH_NGHIEP}} xin nhắc khoản công nợ chứng từ {{SO_CHUNG_TU}}, còn lại {{SO_TIEN_CON_LAI}}, hạn thanh toán {{HAN_THANH_TOAN}}. Kính mong Quý khách kiểm tra và phản hồi lịch thanh toán.\n\nTrân trọng.'; }
function requireText(value, label) { if (!value || !String(value).trim()) throw new Error(`${label} là bắt buộc`); return String(value).trim(); }
function clean(value) { return value == null ? '' : String(value).trim().slice(0, 2000); }
function money(value) { const number = Number(value || 0); if (!Number.isSafeInteger(number) || number < 0) throw new Error('Số tiền VND không hợp lệ'); return number; }
function moneyPositive(value) { const number = money(value); if (number <= 0) throw new Error('Số tiền phải lớn hơn 0'); return number; }
function integer(value) { const number = Number(value); if (!Number.isInteger(number) || number < 0) throw new Error('Giá trị số nguyên không hợp lệ'); return number; }
function validDate(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) throw new Error('Ngày không hợp lệ'); return date; }
function truthy(value) { return value === true || String(value).toLowerCase() === 'true'; }
function day(value) { const d = new Date(value); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); }
function dateKey(value) { return new Date(value).toISOString().slice(0, 10); }
function formatVnd(value) { return `${Number(value).toLocaleString('vi-VN')} ₫`; }
function maskAccount(value) { const text = String(value); return `${'*'.repeat(Math.max(0, text.length - 4))}${text.slice(-4)}`; }
