import { SheetStore } from '../infrastructure/sheetStore.js';
import { USER_SHEETS, inputHeaderKey } from '../infrastructure/schema.js';
import { WorkspaceManager } from '../infrastructure/workspace.js';
import { FinDebtService } from '../application/findebtService.js';
import { canAccess, normalizeEmail } from '../domain/access.js';

const IMPORT_TYPES = Object.freeze(['DOI_TUONG', 'CHUNG_TU_CONG_NO']);
const BOOTSTRAP_CACHE_SECONDS = 120;
const HEALTH_CACHE_SECONDS = 300;

function manager() { return new WorkspaceManager(); }

function createService(requiredRole = 'VIEWER') {
  const workspace = manager().requireWorkspace();
  const store = new SheetStore(workspace.spreadsheet); store.migrate();
  if (store.config().WORKSPACE_MODE === 'SNAPSHOT' && requiredRole !== 'VIEWER') throw new Error('Snapshot ở chế độ chỉ đọc. Hãy nhân bản thành workspace hoạt động trước khi ghi dữ liệu.');
  const identity = authorize(store, requiredRole);
  const app = new FinDebtService(store, {
    id: prefix => `${prefix}-${Utilities.getUuid().slice(0, 8).toUpperCase()}`,
    userEmail: () => identity.email,
    sendEmail: (to, subject, body) => MailApp.sendEmail({ to, subject, body, name: 'FINDEBT PRO' })
  });
  app.workspace = workspace; app.identity = identity; return app;
}

function locked(requiredRole, operation) {
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try { return operation(createService(requiredRole)); } finally { lock.releaseLock(); }
}

function mutatingLocked(requiredRole, operation) {
  return locked(requiredRole, app => { const result = operation(app); bumpDataVersion(app); return result; });
}

function doGet() { return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('FINDEBT PRO').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).addMetaTag('viewport', 'width=device-width, initial-scale=1'); }
function getSessionContext() { return manager().context(); }

function createWorkspace(company) {
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const session = manager().create(company || {}); const app = createService('OWNER'); app.initialize(company || {});
    return { session, data: enrichedBootstrap(app) };
  } finally { lock.releaseLock(); }
}

function connectWorkspace(rootFolderId) {
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try { const session = manager().connect(rootFolderId); return { session, data: enrichedBootstrap(createService('VIEWER')) }; }
  finally { lock.releaseLock(); }
}

function disconnectWorkspace() { return manager().disconnect(); }
function initialize(company) { return manager().context().connected ? locked('ADMIN', app => app.initialize(company)) : createWorkspace(company); }
function bootstrap() { return locked('VIEWER', app => enrichedBootstrap(app)); }
function savePartner(input) { return mutatingLocked('ACCOUNTANT', app => app.savePartner(input)); }
function createDocument(input) { return mutatingLocked('ACCOUNTANT', app => app.createDocument(input)); }
function recordPayment(input) { return mutatingLocked('ACCOUNTANT', app => app.recordPayment(input)); }
function voidRecord(table, id) { return mutatingLocked('ADMIN', app => app.voidRecord(table, id)); }
function savePromise(input) { return mutatingLocked('ACCOUNTANT', app => app.savePromise(input)); }
function saveBankAccount(input) { return mutatingLocked('ADMIN', app => app.saveBankAccount(input)); }
function getVietQr(documentId, accountId) { return locked('VIEWER', app => app.getVietQr(documentId, accountId)); }
function processReminders() { return mutatingLocked('ACCOUNTANT', app => app.processReminders()); }

function createReminderTrigger() {
  createService('ADMIN'); ScriptApp.getProjectTriggers().filter(trigger => trigger.getHandlerFunction() === 'processReminders').forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('processReminders').timeBased().atHour(8).everyDays(1).create(); return { ok: true };
}

function createBackupTrigger() {
  createService('ADMIN'); ScriptApp.getProjectTriggers().filter(trigger => trigger.getHandlerFunction() === 'createBackup').forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('createBackup').timeBased().atHour(2).everyDays(1).create(); return { ok: true };
}

function createBackup() {
  return locked('ACCOUNTANT', app => {
    const folder = manager().folder('05_BACKUPS'); const file = DriveApp.getFileById(app.store.spreadsheet.getId()); const copy = file.makeCopy(`FINDEBT_BACKUP_${stamp()}`, folder);
    app.audit('TAO_BACKUP', 'DRIVE', copy.getId(), null, { name: copy.getName() }); return { id: copy.getId(), name: copy.getName(), url: copy.getUrl() };
  });
}

function listBackups() {
  createService('VIEWER'); const files = manager().folder('05_BACKUPS').getFiles(); const result = [];
  while (files.hasNext()) { const file = files.next(); result.push({ id: file.getId(), name: file.getName(), updatedAt: file.getLastUpdated().toISOString(), url: file.getUrl() }); }
  return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function restoreBackup(fileId) {
  return locked('OWNER', app => {
    const folder = manager().folder('05_BACKUPS'); const allowed = folder.getFiles(); let sourceFile = null;
    while (allowed.hasNext()) { const candidate = allowed.next(); if (candidate.getId() === fileId) { sourceFile = candidate; break; } }
    if (!sourceFile) throw new Error('Backup không thuộc workspace hiện tại.'); DriveApp.getFileById(app.store.spreadsheet.getId()).makeCopy(`FINDEBT_BEFORE_RESTORE_${stamp()}`, folder);
    const source = SpreadsheetApp.openById(sourceFile.getId()); source.getSheets().forEach(sourceSheet => { const target = app.store.spreadsheet.getSheetByName(sourceSheet.getName()) || app.store.spreadsheet.insertSheet(sourceSheet.getName()); target.clear(); const values = sourceSheet.getDataRange().getValues(); if (values.length && values[0].length) target.getRange(1, 1, values.length, values[0].length).setValues(values); });
    app.store.migrate(); app.audit('RESTORE_BACKUP', 'DRIVE', fileId, null, { restoredAt: new Date() }); return { ok: true };
  });
}

function cloneWorkspace(mode = 'TEMPLATE') {
  return locked('OWNER', app => {
    if (!['TEMPLATE', 'FULL', 'SNAPSHOT'].includes(mode)) throw new Error('Chế độ sao chép không hợp lệ.');
    const sourceRoot = DriveApp.getFolderById(app.workspace.rootFolderId); const suffix = mode === 'TEMPLATE' ? 'MẪU TRỐNG' : mode === 'FULL' ? 'BẢN SAO' : 'SNAPSHOT';
    const targetRoot = DriveApp.getRootFolder().createFolder(`${sourceRoot.getName()} — ${suffix} ${stamp()}`); const workspaceId = `WS-${Utilities.getUuid().slice(0, 12).toUpperCase()}`; const workspaceManager = manager(); const folders = workspaceManager.ensureFolders(targetRoot); let spreadsheet;
    if (mode === 'TEMPLATE') {
      spreadsheet = SpreadsheetApp.create(`${app.store.spreadsheet.getName()} — Mẫu trống`); DriveApp.getFileById(spreadsheet.getId()).moveTo(folders['01_DATA']); const store = new SheetStore(spreadsheet); store.migrate(); const sourceConfig = app.store.config();
      store.setConfig({ TEN_DOANH_NGHIEP: sourceConfig.TEN_DOANH_NGHIEP, THEME: sourceConfig.THEME || 'dark', NHAC_NO_LICH: sourceConfig.NHAC_NO_LICH, NHAC_NO_SAU_30: sourceConfig.NHAC_NO_SAU_30, EMAIL_TEMPLATE: sourceConfig.EMAIL_TEMPLATE, WORKSPACE_ID: workspaceId, ROOT_FOLDER_ID: targetRoot.getId(), OWNER_EMAIL: app.identity.email, REMINDERS_ENABLED: 'false' });
      store.insert('THANH_VIEN', { Email: app.identity.email, Vai_Tro: 'OWNER', Trang_Thai: 'HOAT_DONG', Created_At: new Date(), Updated_At: new Date() });
    } else {
      const result = copyFolderTree(sourceRoot, targetRoot, app.store.spreadsheet.getId()); if (!result.spreadsheetId) throw new Error('Không tìm thấy Sheet dữ liệu trong bản sao.'); spreadsheet = SpreadsheetApp.openById(result.spreadsheetId); const store = new SheetStore(spreadsheet); store.migrate(); store.setConfig({ WORKSPACE_ID: workspaceId, ROOT_FOLDER_ID: targetRoot.getId(), OWNER_EMAIL: app.identity.email, WORKSPACE_MODE: mode === 'SNAPSHOT' ? 'SNAPSHOT' : 'ACTIVE', REMINDERS_ENABLED: 'false', CLONED_AT: new Date() });
      store.all('THANH_VIEN').filter(row => normalizeEmail(row.Email) !== app.identity.email).forEach(row => store.update('THANH_VIEN', 'Email', row.Email, { Trang_Thai: 'DA_HUY', Updated_At: new Date() }));
    }
    workspaceManager.writeManifest(targetRoot, { workspaceId, spreadsheetId: spreadsheet.getId(), folders }); app.audit('NHAN_BAN_WORKSPACE', 'DRIVE', targetRoot.getId(), null, { mode, workspaceId }); return { id: targetRoot.getId(), name: targetRoot.getName(), url: targetRoot.getUrl(), spreadsheetUrl: spreadsheet.getUrl(), mode };
  });
}

function exportCsv(table) { return locked('VIEWER', app => { const rows = app.store.all(table); if (!rows.length) return ''; const headers = Object.keys(rows[0]); return [headers, ...rows.map(row => headers.map(header => row[header]))].map(row => row.map(csvCell).join(',')).join('\r\n'); }); }
function previewCsv(entityType, csvText, fileName = 'import.csv') { return locked('ACCOUNTANT', app => prepareImport(app, entityType, csvText, fileName, false)); }
function commitCsv(entityType, csvText, fileName = 'import.csv') { return mutatingLocked('ACCOUNTANT', app => prepareImport(app, entityType, csvText, fileName, true)); }
function importCsv(entityType, csvText, fileName = 'import.csv') { return commitCsv(entityType, csvText, fileName); }

function importFromSheet(entityType) {
  return mutatingLocked('ACCOUNTANT', app => {
    const sheetName = entityType === 'DOI_TUONG' ? USER_SHEETS.PARTNER_INPUT : entityType === 'CHUNG_TU_CONG_NO' ? USER_SHEETS.DOCUMENT_INPUT : '';
    if (!sheetName) throw new Error('Loại staging không hợp lệ.'); const sheet = app.store.spreadsheet.getSheetByName(sheetName); const matrix = sheet.getDataRange().getValues(); const headerIndex = matrix.findIndex(row => row.map(inputHeaderKey).includes(entityType === 'DOI_TUONG' ? 'Ten_DT' : 'Ma_DT')); if (headerIndex < 0) throw new Error(`Không tìm thấy hàng tiêu đề trong ${sheetName}.`);
    const headers = matrix[headerIndex].map(inputHeaderKey); const readyIndex = headers.indexOf('San_Sang_Nhap'); let rows = matrix.slice(headerIndex + 1).filter(row => row.some(value => value !== '' && value !== false)); if (readyIndex >= 0) rows = rows.filter(row => row[readyIndex] === true || String(row[readyIndex]).toLowerCase() === 'true'); if (!rows.length) throw new Error(`Chưa có dòng nào được đánh dấu Sẵn sàng nhập trong ${sheetName}.`);
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n'); return prepareImport(app, entityType, csv, `${sheetName}.csv`, true);
  });
}

function saveMember(input) {
  return mutatingLocked('OWNER', app => {
    const email = normalizeEmail(input?.email); if (!isEmail(email)) throw new Error('Email thành viên không hợp lệ.'); const role = String(input?.role || '').toUpperCase(); if (!['ADMIN', 'ACCOUNTANT', 'VIEWER'].includes(role)) throw new Error('Vai trò không hợp lệ.');
    const rows = app.store.all('THANH_VIEN'); const existing = rows.find(row => normalizeEmail(row.Email) === email); const now = new Date(); if (existing) app.store.update('THANH_VIEN', 'Email', existing.Email, { Vai_Tro: role, Trang_Thai: 'HOAT_DONG', Updated_At: now }); else app.store.insert('THANH_VIEN', { Email: email, Vai_Tro: role, Trang_Thai: 'HOAT_DONG', Created_At: now, Updated_At: now });
    const root = DriveApp.getFolderById(app.workspace.rootFolderId); root.removeEditor(email); root.removeViewer(email); if (role === 'VIEWER') root.addViewer(email); else root.addEditor(email);
    app.audit('LUU_THANH_VIEN', 'THANH_VIEN', email, existing || null, { Email: email, Vai_Tro: role }); return { email, role };
  });
}

function removeMember(email) {
  return mutatingLocked('OWNER', app => {
    const normalized = normalizeEmail(email); if (normalized === normalizeEmail(app.store.config().OWNER_EMAIL)) throw new Error('Không thể xóa chủ workspace.'); const result = app.store.update('THANH_VIEN', 'Email', normalized, { Trang_Thai: 'DA_HUY', Updated_At: new Date() }); const root = DriveApp.getFolderById(app.workspace.rootFolderId); root.removeEditor(normalized); root.removeViewer(normalized); app.audit('GO_THANH_VIEN', 'THANH_VIEN', normalized, result.before, result.after); return result.after;
  });
}

function generateDebtPdf(partnerId) {
  return locked('ACCOUNTANT', app => {
    const data = app.bootstrap(); const partner = data.partners.find(p => p.Ma_DT === partnerId); if (!partner) throw new Error('Không tìm thấy đối tượng.'); const docs = app.accountingModel(new Date()).summary.rows.filter(row => row.Ma_DT === partnerId && row.outstanding > 0); const total = docs.reduce((sum, row) => sum + row.outstanding, 0);
    const doc = DocumentApp.create(`Phiếu công nợ ${partner.Ma_DT} ${new Date().toISOString().slice(0, 10)}`); const body = doc.getBody(); body.appendHeading(data.config.TEN_DOANH_NGHIEP || 'FINDEBT PRO', DocumentApp.ParagraphHeading.HEADING1); body.appendHeading('THÔNG BÁO CÔNG NỢ', DocumentApp.ParagraphHeading.HEADING2); body.appendParagraph(`Khách hàng/NCC: ${partner.Ten_DT} (${partner.Ma_DT})`); body.appendParagraph(`Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`);
    const table = body.appendTable([['Chứng từ', 'Ngày CT', 'Hạn TT', 'Tiền gốc', 'Đã TT', 'Còn lại'], ...docs.map(row => [String(row.So_Chung_Tu), String(row.Ngay_Chung_Tu).slice(0, 10), String(row.Han_Thanh_Toan).slice(0, 10), formatVnd(row.originalAmount), formatVnd(row.originalAmount - row.outstanding), formatVnd(row.outstanding)])]); table.getRow(0).editAsText().setBold(true); body.appendParagraph(`TỔNG CÒN LẠI: ${formatVnd(total)}`).setBold(true); doc.saveAndClose(); const pdf = DriveApp.getFileById(doc.getId()).getAs(MimeType.PDF); const folder = manager().folder('03_REPORTS/STATEMENTS'); const file = folder.createFile(pdf).setName(`${doc.getName()}.pdf`); DriveApp.getFileById(doc.getId()).setTrashed(true); app.audit('TAO_PDF', 'DRIVE', file.getId(), null, { partnerId, total }); return { id: file.getId(), name: file.getName(), url: file.getUrl(), total };
  });
}

function enrichedBootstrap(app) {
  const startedAt = Date.now(); const cached = readBootstrapCache(app); const data = cached.data || app.bootstrap();
  if (!cached.data) writeBootstrapCache(app, data);
  const members = app.store.all('THANH_VIEN').filter(row => row.Trang_Thai === 'HOAT_DONG').map(row => ({ email: row.Email, role: row.Vai_Tro }));
  const workspace = { workspaceId: app.workspace.workspaceId, rootFolderId: app.workspace.rootFolderId, rootFolderUrl: app.workspace.rootFolderUrl, spreadsheetId: app.workspace.spreadsheetId, spreadsheetUrl: app.workspace.spreadsheetUrl, email: app.identity.email, role: app.identity.role };
  return { ...data, workspace, members, health: null, performance: { bootstrapMs: Date.now() - startedAt, cacheHit: Boolean(cached.data), dataVersion: dataVersion(app) } };
}

function loadWorkspaceHealth() {
  return locked('VIEWER', app => ({ health: workspaceHealth(app), measuredAt: new Date().toISOString() }));
}

function syncDataConsole() {
  return locked('ACCOUNTANT', app => { const data = readBootstrapCache(app).data || app.bootstrap(); const health = workspaceHealth(app); refreshConsole(app, data, health); return { ok: true, syncedAt: new Date().toISOString() }; });
}

function loadDocumentsPage(query = {}) {
  return locked('VIEWER', app => {
    const startedAt = Date.now(); const page = Math.max(1, Number(query.page) || 1); const pageSize = Math.min(100, Math.max(10, Number(query.pageSize) || 40));
    const search = normalizeText(query.search); const type = String(query.type || 'ALL'); const status = String(query.status || 'ALL'); const partnerNames = new Map(app.store.all('DOI_TUONG').map(row => [row.Ma_DT, row.Ten_DT]));
    let rows = app.accountingModel(new Date()).summary.rows.map(row => ({ ...row, partnerName: partnerNames.get(row.Ma_DT) || row.Ma_DT }));
    if (search) rows = rows.filter(row => normalizeText(`${row.So_Chung_Tu} ${row.Ma_DT} ${row.partnerName} ${row.Dien_Giai}`).includes(search));
    if (type !== 'ALL') rows = rows.filter(row => row.Loai_Cong_No === type);
    if (status === 'OVERDUE') rows = rows.filter(row => row.outstanding > 0 && row.daysOverdue > 0);
    if (status === 'OPEN') rows = rows.filter(row => row.outstanding > 0);
    if (status === 'PAID') rows = rows.filter(row => row.outstanding <= 0);
    const sort = String(query.sort || 'DATE_DESC');
    rows.sort(sort === 'DUE_ASC' ? (a, b) => String(a.Han_Thanh_Toan).localeCompare(String(b.Han_Thanh_Toan)) : sort === 'OUTSTANDING_DESC' ? (a, b) => b.outstanding - a.outstanding : (a, b) => String(b.Ngay_Chung_Tu).localeCompare(String(a.Ngay_Chung_Tu)));
    const total = rows.length; const start = (page - 1) * pageSize;
    return { rows: rows.slice(start, start + pageSize), page, pageSize, total, hasMore: start + pageSize < total, performance: { queryMs: Date.now() - startedAt } };
  });
}

function cacheKey(app, kind) { return `FD:${kind}:${app.workspace.spreadsheetId}:${dataVersion(app)}`; }
function dataVersion(app) { return Number(PropertiesService.getScriptProperties().getProperty(`DATA_VERSION_${app.workspace.spreadsheetId}`) || 1); }
function bumpDataVersion(app) { const next = dataVersion(app) + 1; PropertiesService.getScriptProperties().setProperty(`DATA_VERSION_${app.workspace.spreadsheetId}`, String(next)); return next; }
function readBootstrapCache(app) { try { const value = CacheService.getScriptCache().get(cacheKey(app, 'BOOT')); return { data: value ? JSON.parse(value) : null }; } catch { return { data: null }; } }
function writeBootstrapCache(app, data) { try { CacheService.getScriptCache().put(cacheKey(app, 'BOOT'), JSON.stringify(data), BOOTSTRAP_CACHE_SECONDS); } catch { /* Cache is an optimization only. */ } }
function workspaceHealth(app) { const key = cacheKey(app, 'HEALTH'); try { const value = CacheService.getScriptCache().get(key); if (value) return JSON.parse(value); } catch { /* Recalculate below. */ } const health = calculateHealth(app); try { CacheService.getScriptCache().put(key, JSON.stringify(health), HEALTH_CACHE_SECONDS); } catch { /* Cache is an optimization only. */ } return health; }

function authorize(store, requiredRole) {
  const email = normalizeEmail(Session.getActiveUser().getEmail()); if (!email) throw new Error('Không xác định được email Google đang đăng nhập.'); const config = store.config(); let member = store.all('THANH_VIEN').find(row => normalizeEmail(row.Email) === email && row.Trang_Thai === 'HOAT_DONG');
  if (!member && normalizeEmail(config.OWNER_EMAIL) === email) { const now = new Date(); member = { Email: email, Vai_Tro: 'OWNER', Trang_Thai: 'HOAT_DONG', Created_At: now, Updated_At: now }; store.insert('THANH_VIEN', member); }
  if (!member) throw new Error('Bạn chưa được cấp quyền trong workspace này.'); const role = String(member.Vai_Tro || 'VIEWER').toUpperCase(); if (!canAccess(role, requiredRole)) throw new Error(`Thao tác yêu cầu vai trò ${requiredRole}. Vai trò hiện tại: ${role}.`); return { email, role };
}

function prepareImport(app, entityType, csvText, fileName, commit) {
  if (!IMPORT_TYPES.includes(entityType)) throw new Error('Loại import không được hỗ trợ.'); if (!csvText || csvText.length > 2_000_000) throw new Error('File CSV trống hoặc vượt giới hạn 2 MB.'); const matrix = Utilities.parseCsv(String(csvText).replace(/^\uFEFF/, '')); if (matrix.length < 2) throw new Error('CSV phải có header và ít nhất một dòng dữ liệu.');
  const headers = matrix[0].map(inputHeaderKey); const required = entityType === 'DOI_TUONG' ? ['Ten_DT', 'Phan_Loai'] : ['Ma_DT', 'Loai_Cong_No', 'So_Chung_Tu', 'Ngay_Chung_Tu', 'Han_Thanh_Toan', 'So_Tien_Goc']; const missing = required.filter(field => !headers.includes(field)); if (missing.length) throw new Error(`Thiếu cột bắt buộc: ${missing.join(', ')}`);
  const existingPartners = app.store.all('DOI_TUONG'); const existingDocs = app.store.all('CHUNG_TU_CONG_NO'); const seen = new Set(); const valid = []; const errors = []; const importKey = `IMP-${Utilities.getUuid().slice(0, 8).toUpperCase()}`;
  matrix.slice(1).forEach((values, index) => { if (!values.some(value => String(value).trim())) return; const rowNumber = index + 2; const row = normalizeImportRow(Object.fromEntries(headers.map((header, column) => [header, values[column] ?? '']))); try { if (entityType === 'DOI_TUONG') validatePartnerImport(row, existingPartners, seen); else validateDocumentImport(row, existingPartners, existingDocs, seen); valid.push({ rowNumber, row }); } catch (error) { errors.push({ row: rowNumber, message: error.message, data: row }); } });
  if (!commit && errors.length) app.store.insertMany('IMPORT_ERRORS', errors.slice(0, 100).map(error => ({ Import_Key: importKey, Dong: error.row, Loai: entityType, Noi_Dung_Loi: error.message, Du_Lieu_JSON: JSON.stringify(error.data).slice(0, 45000), Created_At: new Date() })));
  let success = 0;
  const result = { importKey, fileName: String(fileName).slice(0, 200), total: valid.length + errors.length, valid: valid.length, success, failed: errors.length, errors: errors.slice(0, 100), preview: valid.slice(0, 10).map(item => ({ row: item.rowNumber, data: item.row })), canCommit: errors.length === 0 && valid.length > 0, committed: commit };
  if (commit && errors.length) {
    writeImportResultSheet(app, entityType, result);
    throw new Error(`Không import vì còn ${errors.length} dòng lỗi. Xem tab ${USER_SHEETS.IMPORT_RESULTS}, sửa dữ liệu rồi thử lại.`);
  }
  if (commit) {
    app.store.batch(() => valid.forEach(item => { if (entityType === 'DOI_TUONG') app.savePartner(item.row); else app.createDocument(item.row); success += 1; }));
    result.success = success;
    app.store.insert('IMPORT_LOG', { Ma_Import: importKey, Loai: entityType, Ten_File: result.fileName, Tong_Dong: result.total, Thanh_Cong: success, That_Bai: 0, Chi_Tiet_Loi: '', Nguoi_Dung: app.identity.email, Created_At: new Date() });
  }
  writeImportResultSheet(app, entityType, result); return result;
}

function normalizeImportRow(row) {
  const partnerTypes = { 'khách hàng': 'KHACH_HANG', 'nhà cung cấp': 'NHA_CUNG_CAP' }; const debtTypes = { 'phải thu': 'PHAI_THU', 'phải trả': 'PHAI_TRA' };
  if (row.Phan_Loai) row.Phan_Loai = partnerTypes[normalizeText(row.Phan_Loai)] || String(row.Phan_Loai).trim().toUpperCase();
  if (row.Loai_Cong_No) row.Loai_Cong_No = debtTypes[normalizeText(row.Loai_Cong_No)] || String(row.Loai_Cong_No).trim().toUpperCase();
  if (row.Ma_DT) row.Ma_DT = String(row.Ma_DT).split(/\s+[—–-]\s+/)[0].trim(); return row;
}

function validatePartnerImport(row, existing, seen) {
  const name = String(row.Ten_DT || '').trim(); if (!name) throw new Error('Thiếu Ten_DT.'); if (!['KHACH_HANG', 'NHA_CUNG_CAP'].includes(row.Phan_Loai)) throw new Error('Phan_Loai phải là KHACH_HANG hoặc NHA_CUNG_CAP.'); if (row.Email && !isEmail(row.Email)) throw new Error('Email không hợp lệ.'); ['Han_Muc_Tin_Dung', 'Du_No_Dau_Ky'].forEach(field => { if (row[field] && (!Number.isSafeInteger(Number(row[field])) || Number(row[field]) < 0)) throw new Error(`${field} không hợp lệ.`); }); if (row.Thoi_Han_No_Chuan && (!Number.isInteger(Number(row.Thoi_Han_No_Chuan)) || Number(row.Thoi_Han_No_Chuan) < 0)) throw new Error('Thoi_Han_No_Chuan không hợp lệ.'); const key = `${normalizeText(name)}|${row.Phan_Loai}`; if (seen.has(key) || existing.some(item => `${normalizeText(item.Ten_DT)}|${item.Phan_Loai}` === key && item.Trang_Thai !== 'DA_HUY')) throw new Error('Đối tượng bị trùng tên và phân loại.'); seen.add(key);
}

function validateDocumentImport(row, partners, existing, seen) {
  if (!partners.some(item => item.Ma_DT === String(row.Ma_DT).trim() && item.Trang_Thai !== 'DA_HUY')) throw new Error('Ma_DT không tồn tại.'); if (!['PHAI_THU', 'PHAI_TRA'].includes(row.Loai_Cong_No)) throw new Error('Loai_Cong_No không hợp lệ.'); if (!String(row.So_Chung_Tu || '').trim()) throw new Error('Thiếu So_Chung_Tu.'); if (!Number.isSafeInteger(Number(row.So_Tien_Goc)) || Number(row.So_Tien_Goc) <= 0) throw new Error('So_Tien_Goc phải là số nguyên VND lớn hơn 0.'); if (Number.isNaN(new Date(row.Ngay_Chung_Tu).getTime()) || Number.isNaN(new Date(row.Han_Thanh_Toan).getTime())) throw new Error('Ngày chứng từ hoặc hạn thanh toán không hợp lệ.'); const key = `${row.Ma_DT}|${row.Loai_Cong_No}|${normalizeText(row.So_Chung_Tu)}`; if (seen.has(key) || existing.some(item => `${item.Ma_DT}|${item.Loai_Cong_No}|${normalizeText(item.So_Chung_Tu)}` === key && item.Trang_Thai_Ban_Ghi !== 'DA_HUY')) throw new Error('Chứng từ bị trùng trong cùng đối tượng và loại công nợ.'); seen.add(key);
}

function calculateHealth(app) {
  const partners = app.store.all('DOI_TUONG').filter(row => row.Trang_Thai !== 'DA_HUY'); const docs = app.store.all('CHUNG_TU_CONG_NO').filter(row => row.Trang_Thai_Ban_Ghi !== 'DA_HUY'); const partnerIds = new Set(partners.map(row => row.Ma_DT)); const duplicateNames = partners.length - new Set(partners.map(row => `${normalizeText(row.Ten_DT)}|${row.Phan_Loai}`)).size; const invalidEmails = partners.filter(row => row.Email && !isEmail(row.Email)).length; const orphanDocuments = docs.filter(row => !partnerIds.has(row.Ma_DT)).length;
  const backups = listFolderFiles(manager().folder('05_BACKUPS')); const lastBackup = backups.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]; const backupAgeDays = lastBackup ? Math.floor((Date.now() - new Date(lastBackup.updatedAt).getTime()) / 86400000) : null; const members = app.store.all('THANH_VIEN').filter(row => row.Trang_Thai === 'HOAT_DONG'); const issues = [];
  let permissionMismatches = 0; try { const root = DriveApp.getFolderById(app.workspace.rootFolderId); const editors = new Set(root.getEditors().map(user => normalizeEmail(user.getEmail()))); const viewers = new Set(root.getViewers().map(user => normalizeEmail(user.getEmail()))); const expected = members.filter(row => row.Vai_Tro !== 'OWNER'); permissionMismatches = expected.filter(row => row.Vai_Tro === 'VIEWER' ? !viewers.has(normalizeEmail(row.Email)) : !editors.has(normalizeEmail(row.Email))).length + [...editors, ...viewers].filter(email => email && !members.some(row => normalizeEmail(row.Email) === email)).length; } catch { permissionMismatches = 0; }
  if (!backups.length) issues.push({ level: 'HIGH', code: 'NO_BACKUP', message: 'Workspace chưa có bản backup.' }); else if (backupAgeDays > 7) issues.push({ level: 'MEDIUM', code: 'STALE_BACKUP', message: `Backup gần nhất đã ${backupAgeDays} ngày.` }); if (duplicateNames) issues.push({ level: 'MEDIUM', code: 'DUPLICATES', message: `${duplicateNames} đối tượng có dấu hiệu trùng.` }); if (invalidEmails) issues.push({ level: 'MEDIUM', code: 'INVALID_EMAIL', message: `${invalidEmails} email không hợp lệ.` }); if (orphanDocuments) issues.push({ level: 'HIGH', code: 'ORPHAN_DOCUMENT', message: `${orphanDocuments} chứng từ không còn đối tượng hợp lệ.` }); if (!members.some(row => row.Vai_Tro === 'OWNER')) issues.push({ level: 'HIGH', code: 'NO_OWNER', message: 'Workspace chưa có Owner hợp lệ.' });
  if (permissionMismatches) issues.push({ level: 'HIGH', code: 'PERMISSION_MISMATCH', message: `${permissionMismatches} quyền Drive không khớp danh sách thành viên.` }); const score = Math.max(0, 100 - issues.reduce((sum, issue) => sum + (issue.level === 'HIGH' ? 25 : 10), 0)); return { score, issues, metrics: { partners: partners.length, documents: docs.length, members: members.length, backups: backups.length, lastBackupAt: lastBackup?.updatedAt || '', duplicateNames, invalidEmails, orphanDocuments, permissionMismatches } };
}

function refreshConsole(app, data, health) {
  const spreadsheet = app.store.spreadsheet; const overview = spreadsheet.getSheetByName(USER_SHEETS.OVERVIEW); if (!overview) return; const kpis = data.dashboard.kpis; const now = new Date(); const partnerNames = new Map(data.partners.map(row => [row.Ma_DT, row.Ten_DT])); const allDocuments = app.accountingModel(now).summary.rows.slice().sort((a, b) => String(b.Ngay_Chung_Tu).localeCompare(String(a.Ngay_Chung_Tu)));
  overview.getRange('A5:H5').setValues([['Giá trị hiện tại', kpis.receivable, kpis.payable, kpis.net, kpis.overdue, data.partners.length, allDocuments.filter(row => row.outstanding > 0).length, now]]).setFontWeight('bold'); overview.getRange('B5:E5').setNumberFormat('#,##0 "₫"');
  const alerts = allDocuments.filter(row => row.outstanding > 0 && row.daysOverdue > 0).sort((a, b) => b.daysOverdue - a.daysOverdue).slice(0, 20).map(row => [row.daysOverdue > 60 ? 'Cao' : 'Trung bình', partnerNames.get(row.Ma_DT) || row.Ma_DT, row.So_Chung_Tu, row.Han_Thanh_Toan, row.outstanding, row.daysOverdue, displayDocumentStatus(row), health.score]); overview.getRange(8, 1, Math.max(20, overview.getLastRow() - 7), 8).clearContent(); if (alerts.length) { overview.getRange(8, 1, alerts.length, 8).setValues(alerts); overview.getRange(8, 5, alerts.length, 1).setNumberFormat('#,##0 "₫"'); }
  const debtSheet = spreadsheet.getSheetByName(USER_SHEETS.DEBTS); const debtRows = allDocuments.slice(0, 1000).map(row => [row.Ma_CT, row.So_Chung_Tu, partnerNames.get(row.Ma_DT) || row.Ma_DT, row.Loai_Cong_No === 'PHAI_THU' ? 'Phải thu' : 'Phải trả', row.Ngay_Chung_Tu, row.Han_Thanh_Toan, row.originalAmount, row.outstanding, Math.max(0, row.daysOverdue), displayDocumentStatus(row)]); debtSheet.getRange(6, 1, Math.max(1, debtSheet.getLastRow() - 5), 10).clearContent(); if (debtRows.length) debtSheet.getRange(6, 1, debtRows.length, 10).setValues(debtRows);
  const lookup = spreadsheet.getSheetByName(USER_SHEETS.LOOKUPS); const lookupRows = data.partners.map(row => [`${row.Ma_DT} — ${row.Ten_DT}`, row.Ma_DT, row.Ten_DT]); lookup.getRange(2, 1, Math.max(1, lookup.getLastRow() - 1), 3).clearContent(); if (lookupRows.length) lookup.getRange(2, 1, lookupRows.length, 3).setValues(lookupRows);
  updateStartSheet(app, health, now); ensureOverviewChart(overview); app.store.setConfig({ LAST_CONSOLE_SYNC_AT: now.toISOString() });
}

function writeImportResultSheet(app, entityType, result) {
  const sheet = app.store.spreadsheet.getSheetByName(USER_SHEETS.IMPORT_RESULTS); if (!sheet) return; const now = new Date(); sheet.getRange('A5:F5').setValues([[result.importKey, entityType === 'DOI_TUONG' ? 'Đối tượng' : 'Chứng từ', result.total, result.valid, result.failed, now]]); sheet.getRange('F5').setNumberFormat('dd/mm/yyyy hh:mm'); sheet.getRange('A7:F100').clearContent();
  const rows = result.errors.length ? result.errors.slice(0, 93).map(error => [error.row, 'Lỗi', error.message, JSON.stringify(error.data).slice(0, 1000), 'Cần sửa', importSuggestion(error.message)]) : [['—', result.committed ? 'Thành công' : 'Hợp lệ', result.committed ? `Đã nhập ${result.success} dòng.` : `${result.valid} dòng đã sẵn sàng để xác nhận.`, '', result.committed ? 'Đã nhập' : 'Chờ xác nhận', result.committed ? 'Dữ liệu đã đồng bộ với Web App.' : 'Quay lại Web App và chọn Xác nhận nhập.']]; sheet.getRange(7, 1, rows.length, 6).setValues(rows);
}

function updateStartSheet(app, health, syncedAt) {
  const sheet = app.store.spreadsheet.getSheetByName(USER_SHEETS.START); if (!sheet) return; const config = app.store.config(); const links = [[ScriptApp.getService().getUrl() || '', 'Mở Web App'], [app.workspace.rootFolderUrl, 'Mở thư mục Drive'], [app.workspace.spreadsheetUrl, 'Mở Google Sheet']];
  links.forEach(([url, label], index) => { const builder = SpreadsheetApp.newRichTextValue().setText(label); if (url) builder.setLinkUrl(url); sheet.getRange(9 + index, 2).setRichTextValue(builder.build()).setFontColor('#0369a1').setFontWeight('bold'); });
  sheet.getRange('F9:F13').setValues([[config.TEN_DOANH_NGHIEP || 'Doanh nghiệp'], [app.identity.email], [roleDisplay(app.identity.role)], [syncedAt], [`${health.score}/100 — ${health.issues.length ? 'Cần kiểm tra' : 'Ổn định'}`]]); sheet.getRange('F12').setNumberFormat('dd/mm/yyyy hh:mm'); sheet.getRange('F13').setBackground(health.score >= 90 ? '#dcfce7' : health.score >= 70 ? '#fef3c7' : '#fee2e2');
}

function ensureOverviewChart(sheet) {
  if (sheet.getCharts().length) return; const chart = sheet.newChart().asColumnChart().addRange(sheet.getRange('B4:E5')).setNumHeaders(1).setPosition(4, 10, 0, 0).setOption('title', 'Cơ cấu công nợ hiện tại').setOption('legend', { position: 'none' }).setOption('colors', ['#0ea5e9']).setOption('backgroundColor', '#ffffff').build(); sheet.insertChart(chart);
}

function displayDocumentStatus(row) { if (row.outstanding <= 0) return 'Đã thanh toán'; if (row.daysOverdue > 0) return 'Quá hạn'; if (row.outstanding < row.originalAmount) return 'Thanh toán một phần'; return 'Chưa thanh toán'; }
function roleDisplay(role) { return ({ OWNER: 'Chủ sở hữu', ADMIN: 'Quản trị', ACCOUNTANT: 'Kế toán', VIEWER: 'Chỉ xem' })[role] || 'Chỉ xem'; }
function importSuggestion(message) { if (/email/i.test(message)) return 'Kiểm tra định dạng ten@congty.vn.'; if (/trùng/i.test(message)) return 'Đổi tên hoặc số chứng từ bị trùng.'; if (/Ma_DT|đối tượng/i.test(message)) return 'Chọn lại đối tượng từ dropdown.'; if (/ngày/i.test(message)) return 'Dùng ngày hợp lệ và kiểm tra hạn thanh toán.'; if (/tiền|So_Tien/i.test(message)) return 'Nhập số nguyên VND lớn hơn 0.'; return 'Sửa dữ liệu theo thông báo rồi kiểm tra lại.'; }

function copyFolderTree(source, target, sourceSpreadsheetId, state = { count: 0, spreadsheetId: '' }) {
  const files = source.getFiles(); while (files.hasNext()) { const file = files.next(); if (file.getName() === 'FINDEBT_MANIFEST.json') continue; state.count += 1; if (state.count > 500) throw new Error('Workspace có hơn 500 tệp. Hãy dùng backup theo Sheet hoặc Google Drive để sao chép thủ công.'); const copy = file.makeCopy(file.getName(), target); if (file.getId() === sourceSpreadsheetId) state.spreadsheetId = copy.getId(); }
  const folders = source.getFolders(); while (folders.hasNext()) { const folder = folders.next(); const matches = target.getFoldersByName(folder.getName()); const child = matches.hasNext() ? matches.next() : target.createFolder(folder.getName()); copyFolderTree(folder, child, sourceSpreadsheetId, state); } return state;
}

function listFolderFiles(folder) { const files = folder.getFiles(); const result = []; while (files.hasNext()) { const file = files.next(); result.push({ id: file.getId(), name: file.getName(), updatedAt: file.getLastUpdated().toISOString() }); } return result; }
function csvCell(value) { const text = String(value ?? '').replace(/"/g, '""'); return `"${text}"`; }
function formatVnd(value) { return `${Number(value).toLocaleString('vi-VN')} ₫`; }
function stamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }
function normalizeText(value) { return String(value || '').trim().toLocaleLowerCase('vi-VN').replace(/\s+/g, ' '); }
function isEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim()); }

globalThis.FinDebtApp = { doGet, getSessionContext, createWorkspace, connectWorkspace, disconnectWorkspace, initialize, bootstrap, loadWorkspaceHealth, syncDataConsole, loadDocumentsPage, savePartner, createDocument, recordPayment, voidRecord, savePromise, saveBankAccount, getVietQr, processReminders, createReminderTrigger, createBackupTrigger, createBackup, listBackups, restoreBackup, cloneWorkspace, exportCsv, previewCsv, commitCsv, importCsv, importFromSheet, saveMember, removeMember, generateDebtPdf };
