import { SheetStore } from '../infrastructure/sheetStore.js';
import { FinDebtService } from '../application/findebtService.js';

function service() {
  const props = PropertiesService.getUserProperties(); const spreadsheetId = props.getProperty('FINDEBT_SPREADSHEET_ID');
  const spreadsheet = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : createDataStore(props);
  return new FinDebtService(new SheetStore(spreadsheet), {
    id: prefix => `${prefix}-${Utilities.getUuid().slice(0, 8).toUpperCase()}`,
    userEmail: () => Session.getActiveUser().getEmail() || 'unknown',
    sendEmail: (to, subject, body) => MailApp.sendEmail({ to, subject, body, name: 'FINDEBT PRO' })
  });
}

function createDataStore(props) {
  const spreadsheet = SpreadsheetApp.create('FINDEBT PRO — Data'); props.setProperty('FINDEBT_SPREADSHEET_ID', spreadsheet.getId());
  const first = spreadsheet.getSheets()[0]; first.setName('CONFIG'); return spreadsheet;
}

function locked(operation) {
  const lock = LockService.getUserLock(); lock.waitLock(30000);
  try { return operation(service()); } finally { lock.releaseLock(); }
}

function doGet() { return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('FINDEBT PRO').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).addMetaTag('viewport', 'width=device-width, initial-scale=1'); }
function initialize(company) { return locked(app => app.initialize(company)); }
function bootstrap() { return locked(app => { app.store.migrate(); return app.bootstrap(); }); }
function savePartner(input) { return locked(app => app.savePartner(input)); }
function createDocument(input) { return locked(app => app.createDocument(input)); }
function recordPayment(input) { return locked(app => app.recordPayment(input)); }
function voidRecord(table, id) { return locked(app => app.voidRecord(table, id)); }
function savePromise(input) { return locked(app => app.savePromise(input)); }
function saveBankAccount(input) { return locked(app => app.saveBankAccount(input)); }
function getVietQr(documentId, accountId) { return locked(app => app.getVietQr(documentId, accountId)); }
function processReminders() { return locked(app => app.processReminders()); }

function createReminderTrigger() {
  ScriptApp.getProjectTriggers().filter(trigger => trigger.getHandlerFunction() === 'processReminders').forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('processReminders').timeBased().atHour(8).everyDays(1).create(); return { ok: true };
}

function createBackupTrigger() {
  ScriptApp.getProjectTriggers().filter(trigger => trigger.getHandlerFunction() === 'createBackup').forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('createBackup').timeBased().atHour(2).everyDays(1).create(); return { ok: true };
}

function createBackup() {
  return locked(app => {
    const folder = ensureFolderPath(['FINDEBT_PRO', 'BACKUPS']); const file = DriveApp.getFileById(app.store.spreadsheet.getId());
    const copy = file.makeCopy(`FINDEBT_BACKUP_${new Date().toISOString().replace(/[:.]/g, '-')}`, folder); app.audit('TAO_BACKUP', 'DRIVE', copy.getId(), null, { name: copy.getName() }); return { id: copy.getId(), name: copy.getName(), url: copy.getUrl() };
  });
}

function listBackups() { const folder = ensureFolderPath(['FINDEBT_PRO', 'BACKUPS']); const files = folder.getFiles(); const result = []; while (files.hasNext()) { const file = files.next(); result.push({ id: file.getId(), name: file.getName(), updatedAt: file.getLastUpdated().toISOString(), url: file.getUrl() }); } return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }

function restoreBackup(fileId) {
  return locked(app => {
    const folder = ensureFolderPath(['FINDEBT_PRO', 'BACKUPS']); const allowed = folder.getFiles(); let sourceFile = null;
    while (allowed.hasNext()) { const candidate = allowed.next(); if (candidate.getId() === fileId) { sourceFile = candidate; break; } }
    if (!sourceFile) throw new Error('Backup không thuộc thư mục FINDEBT_PRO/BACKUPS');
    DriveApp.getFileById(app.store.spreadsheet.getId()).makeCopy(`FINDEBT_BEFORE_RESTORE_${new Date().toISOString().replace(/[:.]/g, '-')}`, folder);
    const source = SpreadsheetApp.openById(sourceFile.getId()); Object.keys(app.store.config()).length; source.getSheets().forEach(sourceSheet => { const target = app.store.spreadsheet.getSheetByName(sourceSheet.getName()) || app.store.spreadsheet.insertSheet(sourceSheet.getName()); target.clear(); const values = sourceSheet.getDataRange().getValues(); if (values.length && values[0].length) target.getRange(1, 1, values.length, values[0].length).setValues(values); });
    app.audit('RESTORE_BACKUP', 'DRIVE', fileId, null, { restoredAt: new Date() }); return { ok: true };
  });
}

function exportCsv(table) {
  return locked(app => { const rows = app.store.all(table); if (!rows.length) return ''; const headers = Object.keys(rows[0]); return [headers, ...rows.map(row => headers.map(header => row[header]))].map(row => row.map(csvCell).join(',')).join('\r\n'); });
}

function importCsv(entityType, csvText, fileName = 'import.csv') {
  if (!['DOI_TUONG', 'CHUNG_TU_CONG_NO'].includes(entityType)) throw new Error('Loại import không được hỗ trợ');
  if (!csvText || csvText.length > 2_000_000) throw new Error('File CSV trống hoặc vượt giới hạn 2 MB');
  return locked(app => {
    const matrix = Utilities.parseCsv(String(csvText).replace(/^\uFEFF/, '')); if (matrix.length < 2) throw new Error('CSV phải có header và ít nhất một dòng dữ liệu');
    const headers = matrix[0].map(value => String(value).trim()); const required = entityType === 'DOI_TUONG' ? ['Ten_DT', 'Phan_Loai'] : ['Ma_DT', 'Loai_Cong_No', 'So_Chung_Tu', 'Ngay_Chung_Tu', 'Han_Thanh_Toan', 'So_Tien_Goc'];
    const missing = required.filter(field => !headers.includes(field)); if (missing.length) throw new Error(`Thiếu cột bắt buộc: ${missing.join(', ')}`);
    const errors = []; let success = 0;
    matrix.slice(1).forEach((values, index) => {
      if (!values.some(value => String(value).trim())) return;
      const row = Object.fromEntries(headers.map((header, column) => [header, values[column] ?? '']));
      try { if (entityType === 'DOI_TUONG') app.savePartner(row); else app.createDocument(row); success += 1; }
      catch (error) { errors.push({ row: index + 2, message: error.message }); }
    });
    const result = { total: matrix.length - 1, success, failed: errors.length, errors };
    app.store.insert('IMPORT_LOG', { Ma_Import: app.deps.id('IMP'), Loai: entityType, Ten_File: String(fileName).slice(0, 200), Tong_Dong: result.total, Thanh_Cong: success, That_Bai: errors.length, Chi_Tiet_Loi: JSON.stringify(errors).slice(0, 45000), Nguoi_Dung: app.deps.userEmail(), Created_At: new Date() });
    return result;
  });
}

function generateDebtPdf(partnerId) {
  return locked(app => {
    const data = app.bootstrap(); const partner = data.partners.find(p => p.Ma_DT === partnerId); if (!partner) throw new Error('Không tìm thấy đối tượng');
    const docs = app.accountingModel(new Date()).summary.rows.filter(row => row.Ma_DT === partnerId && row.outstanding > 0); const total = docs.reduce((sum, row) => sum + row.outstanding, 0); const doc = DocumentApp.create(`Phiếu công nợ ${partner.Ma_DT} ${new Date().toISOString().slice(0, 10)}`); const body = doc.getBody(); body.appendHeading(data.config.TEN_DOANH_NGHIEP || 'FINDEBT PRO', DocumentApp.ParagraphHeading.HEADING1); body.appendHeading('THÔNG BÁO CÔNG NỢ', DocumentApp.ParagraphHeading.HEADING2); body.appendParagraph(`Khách hàng/NCC: ${partner.Ten_DT} (${partner.Ma_DT})`); body.appendParagraph(`Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`); const table = body.appendTable([['Chứng từ', 'Ngày CT', 'Hạn TT', 'Tiền gốc', 'Đã TT', 'Còn lại'], ...docs.map(row => [String(row.So_Chung_Tu), String(row.Ngay_Chung_Tu).slice(0, 10), String(row.Han_Thanh_Toan).slice(0, 10), formatVnd(row.originalAmount), formatVnd(row.originalAmount - row.outstanding), formatVnd(row.outstanding)])]); table.getRow(0).editAsText().setBold(true); body.appendParagraph(`TỔNG CÒN LẠI: ${formatVnd(total)}`).setBold(true); doc.saveAndClose(); const pdf = DriveApp.getFileById(doc.getId()).getAs(MimeType.PDF); const folder = ensureFolderPath(['FINDEBT_PRO', 'REPORTS']); const file = folder.createFile(pdf).setName(`${doc.getName()}.pdf`); DriveApp.getFileById(doc.getId()).setTrashed(true); app.audit('TAO_PDF', 'DRIVE', file.getId(), null, { partnerId, total }); return { id: file.getId(), name: file.getName(), url: file.getUrl(), total };
  });
}

function ensureFolderPath(names) { let parent = DriveApp.getRootFolder(); names.forEach(name => { const found = parent.getFoldersByName(name); parent = found.hasNext() ? found.next() : parent.createFolder(name); }); return parent; }
function csvCell(value) { const text = String(value ?? '').replace(/"/g, '""'); return `"${text}"`; }
function formatVnd(value) { return `${Number(value).toLocaleString('vi-VN')} ₫`; }

globalThis.FinDebtApp = { doGet, initialize, bootstrap, savePartner, createDocument, recordPayment, voidRecord, savePromise, saveBankAccount, getVietQr, processReminders, createReminderTrigger, createBackupTrigger, createBackup, listBackups, restoreBackup, exportCsv, importCsv, generateDebtPdf };
