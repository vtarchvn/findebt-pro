import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const demo = {
  config: { TEN_DOANH_NGHIEP: 'Công ty Minh An', THEME: 'dark' },
  workspace: { workspaceId: 'WS-DEMO2026', email: 'owner@minhan.vn', role: 'OWNER', spreadsheetUrl: '#sheet-console', rootFolderUrl: '#drive-workspace' },
  members: [{ email: 'owner@minhan.vn', role: 'OWNER' }, { email: 'ketoan@minhan.vn', role: 'ACCOUNTANT' }],
  health: { score: 90, issues: [{ level: 'MEDIUM', code: 'STALE_BACKUP', message: 'Backup gần nhất đã 8 ngày.' }], metrics: { backups: 3, lastBackupAt: '2026-08-17T02:00:00.000Z', duplicateNames: 0, invalidEmails: 0, orphanDocuments: 0 } },
  partners: [
    { Ma_DT: 'KH-ANPHAT', Ten_DT: 'Công ty An Phát', Phan_Loai: 'KHACH_HANG', So_Dien_Thoai: '0901 234 567', Email: 'ketoan@example.vn', Han_Muc_Tin_Dung: 500000000, Cho_Phep_Nhac_No: true },
    { Ma_DT: 'KH-HOANGGIA', Ten_DT: 'Nội thất Hoàng Gia', Phan_Loai: 'KHACH_HANG', So_Dien_Thoai: '0909 888 222', Email: 'finance@example.vn', Han_Muc_Tin_Dung: 300000000, Cho_Phep_Nhac_No: true },
    { Ma_DT: 'NCC-VIETGO', Ten_DT: 'Vật liệu Việt Gỗ', Phan_Loai: 'NHA_CUNG_CAP', So_Dien_Thoai: '028 3888 9999', Email: 'ar@example.vn', Han_Muc_Tin_Dung: 0, Cho_Phep_Nhac_No: false }
  ],
  documents: [
    { Ma_CT: 'CT-001', Ma_DT: 'KH-ANPHAT', So_Chung_Tu: 'HĐ-2408-018', Loai_Cong_No: 'PHAI_THU', Ngay_Chung_Tu: '2026-07-10', Han_Thanh_Toan: '2026-08-09', originalAmount: 180000000, outstanding: 126000000, daysOverdue: 16, status: 'THANH_TOAN_MOT_PHAN' },
    { Ma_CT: 'CT-002', Ma_DT: 'KH-HOANGGIA', So_Chung_Tu: 'HĐ-2408-021', Loai_Cong_No: 'PHAI_THU', Ngay_Chung_Tu: '2026-06-11', Han_Thanh_Toan: '2026-07-11', originalAmount: 100000000, outstanding: 70000000, daysOverdue: 45, status: 'THANH_TOAN_MOT_PHAN' },
    { Ma_CT: 'CT-003', Ma_DT: 'NCC-VIETGO', So_Chung_Tu: 'MH-0826-004', Loai_Cong_No: 'PHAI_TRA', Ngay_Chung_Tu: '2026-08-14', Han_Thanh_Toan: '2026-09-13', originalAmount: 95000000, outstanding: 95000000, daysOverdue: 0, status: 'CHUA_THANH_TOAN' }
  ],
  dashboard: { kpis: { receivable: 628400000, payable: 214900000, net: 413500000, overdue: 196000000 }, aging: { TRONG_HAN: 312400000, QUA_HAN_1_30: 146000000, QUA_HAN_31_60: 70000000, QUA_HAN_TREN_60: 100000000 }, overdue: [], dueSoon: [], promises: { today: [], upcoming: [], late: [] } },
  bankAccounts: [{ Ma_TK: 'NH-1', Ma_Ngan_Hang: 'VCB', So_Tai_Khoan: '0123456789', Ten_Chu_Tai_Khoan: 'CONG TY MINH AN', Ten_Hien_Thi: 'Vietcombank chính', Mac_Dinh: true }], promises: []
};
demo.dashboard.overdue = demo.documents.filter(row => row.daysOverdue > 0);

createServer(async (request, response) => {
  let html = await readFile(new URL('../web/Index.html', import.meta.url), 'utf8');
  html = html.replace('setupNav();renderIcons();', `state=${JSON.stringify(demo)};setupNav();renderIcons();`);
  html = html.replace("};load();\n</script>", request.url.includes('setup=1') ? "};showSetup({email:'owner@minhan.vn'});\n</script>" : "};render();\n</script>");
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); response.end(html);
}).listen(4173, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:4173'));
