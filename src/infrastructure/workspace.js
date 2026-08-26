import { SheetStore } from './sheetStore.js';

const PROP = Object.freeze({
  spreadsheet: 'FINDEBT_SPREADSHEET_ID',
  root: 'FINDEBT_ROOT_FOLDER_ID',
  workspace: 'FINDEBT_WORKSPACE_ID'
});

export const WORKSPACE_FOLDERS = Object.freeze([
  '00_HUONG_DAN',
  '01_DATA',
  '02_IMPORTS',
  '03_REPORTS',
  '04_EXPORTS',
  '05_BACKUPS',
  '06_ATTACHMENTS',
  '99_SYSTEM'
]);

export class WorkspaceManager {
  constructor(deps = {}) {
    this.props = deps.props || PropertiesService.getUserProperties();
    this.email = deps.email || (() => Session.getActiveUser().getEmail());
    this.uuid = deps.uuid || (() => Utilities.getUuid());
  }

  session() {
    const spreadsheetId = this.props.getProperty(PROP.spreadsheet) || '';
    return {
      connected: Boolean(spreadsheetId),
      email: this.requireEmail(),
      workspaceId: this.props.getProperty(PROP.workspace) || '',
      spreadsheetId,
      rootFolderId: this.props.getProperty(PROP.root) || ''
    };
  }

  context({ migrateLegacy = false } = {}) {
    const spreadsheetId = this.props.getProperty(PROP.spreadsheet);
    if (!spreadsheetId) return { connected: false, email: this.requireEmail() };
    try {
      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      let rootId = this.props.getProperty(PROP.root);
      if (!rootId && migrateLegacy) rootId = this.organizeLegacy(spreadsheet).rootId;
      const workspaceId = this.props.getProperty(PROP.workspace) || `WS-${this.uuid().slice(0, 12).toUpperCase()}`;
      this.props.setProperty(PROP.workspace, workspaceId);
      return {
        connected: true,
        email: this.requireEmail(),
        workspaceId,
        spreadsheetId,
        spreadsheetUrl: spreadsheet.getUrl(),
        rootFolderId: rootId || '',
        rootFolderUrl: rootId ? DriveApp.getFolderById(rootId).getUrl() : '',
        spreadsheetName: spreadsheet.getName()
      };
    } catch {
      this.clear();
      return { connected: false, email: this.requireEmail(), error: 'Workspace đã mất quyền truy cập hoặc không còn tồn tại.' };
    }
  }

  requireWorkspace() {
    const context = this.context({ migrateLegacy: true });
    if (!context.connected) throw new Error('Hãy tạo hoặc liên kết workspace FINDEBT trước khi sử dụng.');
    return { ...context, spreadsheet: SpreadsheetApp.openById(context.spreadsheetId) };
  }

  create(company = {}) {
    if (this.context().connected) throw new Error('Tài khoản đang liên kết một workspace. Hãy ngắt liên kết trước khi tạo workspace mới.');
    const name = sanitizeName(company.name || 'Doanh nghiệp của tôi');
    const workspaceId = `WS-${this.uuid().slice(0, 12).toUpperCase()}`;
    const root = DriveApp.getRootFolder().createFolder(`FINDEBT_PRO — ${name}`);
    const folders = this.ensureFolders(root);
    const spreadsheet = SpreadsheetApp.create(`FINDEBT PRO — ${name}`);
    DriveApp.getFileById(spreadsheet.getId()).moveTo(folders['01_DATA']);
    this.bind({ workspaceId, rootId: root.getId(), spreadsheetId: spreadsheet.getId() });
    const store = new SheetStore(spreadsheet); store.migrate();
    store.setConfig({ WORKSPACE_ID: workspaceId, ROOT_FOLDER_ID: root.getId(), OWNER_EMAIL: this.requireEmail(), TEN_DOANH_NGHIEP: name, EMAIL_KE_TOAN: company.email || this.requireEmail(), CREATED_AT: new Date() });
    ensureOwner(store, this.requireEmail());
    this.writeManifest(root, { workspaceId, spreadsheetId: spreadsheet.getId(), folders });
    this.writeGuide(folders['00_HUONG_DAN'], root, spreadsheet);
    return this.context();
  }

  connect(rootFolderId) {
    const root = DriveApp.getFolderById(requireId(rootFolderId));
    const manifest = this.readManifest(root);
    const folders = this.ensureFolders(root);
    const spreadsheetId = manifest?.spreadsheetId || findSpreadsheetId(folders['01_DATA']);
    if (!spreadsheetId) throw new Error('Không tìm thấy Google Sheet dữ liệu trong thư mục 01_DATA.');
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const store = new SheetStore(spreadsheet); store.migrate();
    const config = store.config();
    const workspaceId = manifest?.workspaceId || config.WORKSPACE_ID || `WS-${this.uuid().slice(0, 12).toUpperCase()}`;
    const member = store.all('THANH_VIEN').find(row => normalizeEmail(row.Email) === normalizeEmail(this.requireEmail()) && row.Trang_Thai === 'HOAT_DONG');
    if (!member && normalizeEmail(config.OWNER_EMAIL) !== normalizeEmail(this.requireEmail())) throw new Error('Email này chưa được chủ workspace thêm vào danh sách thành viên.');
    if (!member) ensureOwner(store, this.requireEmail());
    this.bind({ workspaceId, rootId: root.getId(), spreadsheetId });
    store.setConfig({ WORKSPACE_ID: workspaceId, ROOT_FOLDER_ID: root.getId() });
    this.writeManifest(root, { workspaceId, spreadsheetId, folders });
    return this.context();
  }

  disconnect() { this.clear(); return { ok: true }; }

  folder(name) {
    const workspace = this.requireWorkspace();
    const root = DriveApp.getFolderById(workspace.rootFolderId);
    const folders = this.ensureFolders(root);
    if (!folders[name]) throw new Error(`Thư mục workspace không hợp lệ: ${name}`);
    return folders[name];
  }

  organizeLegacy(spreadsheet) {
    const config = new SheetStore(spreadsheet); config.migrate();
    const values = config.config();
    const name = sanitizeName(values.TEN_DOANH_NGHIEP || 'Doanh nghiệp của tôi');
    const legacyRoot = selectLegacyRoot(DriveApp.getRootFolder());
    const root = legacyRoot ? legacyRoot.setName(`FINDEBT_PRO — ${name}`) : DriveApp.getRootFolder().createFolder(`FINDEBT_PRO — ${name}`);
    const folders = this.ensureFolders(root);
    migrateLegacyFolder(root, 'BACKUPS', folders['05_BACKUPS']);
    migrateLegacyFolder(root, 'REPORTS', folders['03_REPORTS']);
    DriveApp.getFileById(spreadsheet.getId()).moveTo(folders['01_DATA']);
    const workspaceId = values.WORKSPACE_ID || `WS-${this.uuid().slice(0, 12).toUpperCase()}`;
    this.bind({ workspaceId, rootId: root.getId(), spreadsheetId: spreadsheet.getId() });
    config.setConfig({ WORKSPACE_ID: workspaceId, ROOT_FOLDER_ID: root.getId(), OWNER_EMAIL: values.OWNER_EMAIL || this.requireEmail(), MIGRATED_AT: new Date() });
    ensureOwner(config, values.OWNER_EMAIL || this.requireEmail());
    this.writeManifest(root, { workspaceId, spreadsheetId: spreadsheet.getId(), folders });
    this.writeGuide(folders['00_HUONG_DAN'], root, spreadsheet);
    return { rootId: root.getId(), workspaceId, folders };
  }

  ensureFolders(root) {
    const folders = Object.fromEntries(WORKSPACE_FOLDERS.map(name => [name, findOrCreateFolder(root, name)]));
    ['TEMPLATES', 'INBOX', 'PROCESSED', 'ERRORS'].forEach(name => { folders[`02_IMPORTS/${name}`] = findOrCreateFolder(folders['02_IMPORTS'], name); });
    ['REMINDERS', 'STATEMENTS', 'RECONCILIATIONS'].forEach(name => { folders[`03_REPORTS/${name}`] = findOrCreateFolder(folders['03_REPORTS'], name); });
    return folders;
  }

  writeManifest(root, { workspaceId, spreadsheetId, folders }) {
    const manifest = JSON.stringify({
      schema: 'findebt-workspace/v2', workspaceId, spreadsheetId,
      rootFolderId: root.getId(),
      folders: Object.fromEntries(Object.entries(folders).map(([name, folder]) => [name, folder.getId()])),
      updatedAt: new Date().toISOString()
    }, null, 2);
    const system = folders['99_SYSTEM']; const files = system.getFilesByName('FINDEBT_MANIFEST.json');
    if (files.hasNext()) files.next().setContent(manifest); else system.createFile('FINDEBT_MANIFEST.json', manifest, MimeType.PLAIN_TEXT);
  }

  readManifest(root) {
    const systemFolders = root.getFoldersByName('99_SYSTEM'); if (!systemFolders.hasNext()) return null;
    const files = systemFolders.next().getFilesByName('FINDEBT_MANIFEST.json'); if (!files.hasNext()) return null;
    try { return JSON.parse(files.next().getBlob().getDataAsString()); } catch { return null; }
  }

  writeGuide(folder, root, spreadsheet) {
    const files = folder.getFilesByName('BAT_DAU_TAI_DAY.txt');
    const content = `FINDEBT PRO\n\n1. Mở ứng dụng Web App để nhập và kiểm soát nghiệp vụ.\n2. Mở Google Sheet để lọc, đối chiếu và nhập hàng loạt qua vùng staging.\n3. Không sửa các sheet bắt đầu bằng dấu gạch dưới.\n\nThư mục: ${root.getUrl()}\nDữ liệu: ${spreadsheet.getUrl()}\n`;
    if (files.hasNext()) files.next().setContent(content); else folder.createFile('BAT_DAU_TAI_DAY.txt', content, MimeType.PLAIN_TEXT);
  }

  bind({ workspaceId, rootId, spreadsheetId }) {
    this.props.setProperties({ [PROP.workspace]: workspaceId, [PROP.root]: rootId, [PROP.spreadsheet]: spreadsheetId });
  }
  clear() { this.props.deleteProperty(PROP.workspace); this.props.deleteProperty(PROP.root); this.props.deleteProperty(PROP.spreadsheet); }
  requireEmail() { const email = normalizeEmail(this.email()); if (!email) throw new Error('Google không cung cấp email đăng nhập. Hãy cấp quyền userinfo.email và thử lại.'); return email; }
}

function ensureOwner(store, email) {
  const normalized = normalizeEmail(email); const members = store.all('THANH_VIEN');
  if (members.some(row => normalizeEmail(row.Email) === normalized)) return;
  const now = new Date(); store.insert('THANH_VIEN', { Email: normalized, Vai_Tro: 'OWNER', Trang_Thai: 'HOAT_DONG', Created_At: now, Updated_At: now });
}
function findOrCreateFolder(parent, name) { const matches = parent.getFoldersByName(name); return matches.hasNext() ? matches.next() : parent.createFolder(name); }
function selectLegacyRoot(driveRoot) {
  const matches = driveRoot.getFoldersByName('FINDEBT_PRO'); const candidates = [];
  while (matches.hasNext()) candidates.push(matches.next());
  return candidates.find(folder => folder.getFoldersByName('BACKUPS').hasNext() || folder.getFoldersByName('REPORTS').hasNext()) || (candidates.length === 1 ? candidates[0] : null);
}
function migrateLegacyFolder(root, legacyName, target) {
  const folders = root.getFoldersByName(legacyName); if (!folders.hasNext()) return; const legacy = folders.next();
  const files = legacy.getFiles(); while (files.hasNext()) files.next().moveTo(target);
  const children = legacy.getFolders(); while (children.hasNext()) children.next().moveTo(target);
  legacy.setTrashed(true);
}
function findSpreadsheetId(folder) { const files = folder.getFilesByType(MimeType.GOOGLE_SHEETS); return files.hasNext() ? files.next().getId() : ''; }
function requireId(value) { const id = String(value || '').trim(); if (!/^[\w-]{10,}$/.test(id)) throw new Error('ID thư mục Google Drive không hợp lệ.'); return id; }
function sanitizeName(value) { return String(value).trim().replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').slice(0, 80) || 'Doanh nghiệp của tôi'; }
function normalizeEmail(value) { return String(value || '').trim().toLowerCase(); }
