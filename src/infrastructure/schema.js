export const SCHEMA_VERSION = 2;

export const TABLES = Object.freeze({
  CONFIG: ['Khoa', 'Gia_Tri', 'Updated_At'],
  DOI_TUONG: ['Ma_DT', 'Ten_DT', 'Phan_Loai', 'So_Dien_Thoai', 'Email', 'Nguoi_Lien_He', 'Dia_Chi', 'Han_Muc_Tin_Dung', 'Du_No_Dau_Ky', 'Thoi_Han_No_Chuan', 'Ghi_Chu', 'Cho_Phep_Nhac_No', 'Kenh_Nhac_No', 'Nhac_Truoc_Han', 'Chu_Ky_Nhac_Qua_Han', 'Trang_Thai', 'Created_At', 'Updated_At'],
  CHUNG_TU_CONG_NO: ['Ma_CT', 'Ma_DT', 'Loai_Cong_No', 'So_Chung_Tu', 'Ngay_Chung_Tu', 'Han_Thanh_Toan', 'So_Tien_Goc', 'Dien_Giai', 'Trang_Thai_Ban_Ghi', 'Created_At', 'Updated_At'],
  THANH_TOAN: ['Ma_TT', 'Ma_DT', 'Loai_Cong_No', 'Ngay_Thanh_Toan', 'So_Tien', 'Phuong_Thuc', 'Tham_Chieu', 'Ghi_Chu', 'Trang_Thai_Ban_Ghi', 'Created_At', 'Updated_At'],
  PHAN_BO_THANH_TOAN: ['Ma_PB', 'Ma_TT', 'Ma_CT', 'So_Tien_Phan_Bo', 'Trang_Thai_Ban_Ghi', 'Created_At'],
  NHAC_NO: ['Ma_Nhac', 'Ma_CT', 'Ma_DT', 'Loai_Nhac', 'Ngay_Du_Kien', 'Ngay_Da_Gui', 'Kenh', 'Nguoi_Nhan', 'So_Tien_Con_Lai', 'Trang_Thai', 'Noi_Dung', 'Pdf_File_Id', 'Reminder_Key', 'Created_At'],
  HEN_THANH_TOAN: ['Ma_Hen', 'Ma_DT', 'Ma_CT', 'Ngay_Hen', 'So_Tien_Hen', 'Ghi_Chu', 'Trang_Thai', 'Created_At', 'Updated_At'],
  TAI_KHOAN_NGAN_HANG: ['Ma_TK', 'Ma_Ngan_Hang', 'So_Tai_Khoan', 'Ten_Chu_Tai_Khoan', 'Ten_Hien_Thi', 'Mac_Dinh', 'Trang_Thai', 'Created_At', 'Updated_At'],
  AUDIT_LOG: ['Ma_Log', 'Nguoi_Dung', 'Hanh_Dong', 'Bang_Du_Lieu', 'Ma_Ban_Ghi', 'Du_Lieu_Truoc', 'Du_Lieu_Sau', 'Thoi_Gian'],
  IMPORT_LOG: ['Ma_Import', 'Loai', 'Ten_File', 'Tong_Dong', 'Thanh_Cong', 'That_Bai', 'Chi_Tiet_Loi', 'Nguoi_Dung', 'Created_At'],
  THANH_VIEN: ['Email', 'Vai_Tro', 'Trang_Thai', 'Created_At', 'Updated_At'],
  IMPORT_STAGING: ['Import_Key', 'Dong', 'Loai', 'Du_Lieu_JSON', 'Trang_Thai', 'Loi', 'Created_At'],
  IMPORT_ERRORS: ['Import_Key', 'Dong', 'Loai', 'Noi_Dung_Loi', 'Du_Lieu_JSON', 'Created_At']
});

export function migrateSpreadsheet(spreadsheet) {
  Object.entries(TABLES).forEach(([name, headers]) => ensureSheet(spreadsheet, name, headers));
  ensureConsole(spreadsheet);
  ensureInputSheet(spreadsheet, 'NHAP_DOI_TUONG', ['Ten_DT', 'Phan_Loai', 'So_Dien_Thoai', 'Email', 'Nguoi_Lien_He', 'Dia_Chi', 'Han_Muc_Tin_Dung', 'Du_No_Dau_Ky', 'Thoi_Han_No_Chuan', 'Ghi_Chu']);
  ensureInputSheet(spreadsheet, 'NHAP_CHUNG_TU', ['Ma_DT', 'Loai_Cong_No', 'So_Chung_Tu', 'Ngay_Chung_Tu', 'Han_Thanh_Toan', 'So_Tien_Goc', 'Dien_Giai']);
  const config = spreadsheet.getSheetByName('CONFIG');
  const rows = config.getDataRange().getValues();
  const versionRow = rows.findIndex(row => row[0] === 'SCHEMA_VERSION');
  const now = new Date();
  if (versionRow < 0) config.appendRow(['SCHEMA_VERSION', SCHEMA_VERSION, now]);
  else if (Number(rows[versionRow][1]) < SCHEMA_VERSION) config.getRange(versionRow + 1, 2, 1, 2).setValues([[SCHEMA_VERSION, now]]);
}

function ensureSheet(spreadsheet, name, headers) {
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  const existing = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
  if (!existing.some(Boolean)) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  else {
    const missing = headers.filter(header => !existing.includes(header));
    if (missing.length) sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#16324f').setFontColor('#f8fafc').setWrap(true);
  sheet.setHiddenGridlines(true);
  headers.forEach((header, index) => sheet.setColumnWidth(index + 1, /Tien|Du_No|Han_Muc/.test(header) ? 135 : /Email|Dia_Chi|Ghi_Chu|Noi_Dung|JSON|Loi/.test(header) ? 220 : 120));
  const protectedNames = ['CONFIG', 'AUDIT_LOG', 'IMPORT_LOG', 'IMPORT_ERRORS'];
  if (protectedNames.includes(name) && !sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).length) {
    const protection = sheet.protect().setDescription('FINDEBT: vùng hệ thống'); protection.setWarningOnly(true);
  }
}

function ensureConsole(spreadsheet) {
  const sheet = spreadsheet.getSheetByName('TONG_QUAN') || spreadsheet.insertSheet('TONG_QUAN', 0);
  if (sheet.getRange('A1').getValue() !== 'FINDEBT PRO — DATA CONSOLE') {
    sheet.setHiddenGridlines(true); sheet.setFrozenRows(4); sheet.setColumnWidths(1, 8, 130);
    sheet.getRange('A1:H1').merge().setValue('FINDEBT PRO — DATA CONSOLE').setBackground('#0b1220').setFontColor('#f8fafc').setFontSize(18).setFontWeight('bold').setHorizontalAlignment('left');
    sheet.getRange('A2:H2').merge().setValue('Xem tổng thể, lọc dữ liệu và kiểm soát nhập hàng loạt. Dữ liệu tài chính nên được ghi qua Web App hoặc IMPORT_STAGING.').setBackground('#e8f3f8').setFontColor('#29445f').setWrap(true);
    sheet.getRange('A4:H4').setValues([['Chỉ số', 'Phải thu', 'Phải trả', 'Dòng tiền ròng', 'Quá hạn', 'Đối tượng', 'Chứng từ mở', 'Cập nhật']]).setBackground('#16324f').setFontColor('#fff').setFontWeight('bold');
  }
}

function ensureInputSheet(spreadsheet, name, headers) {
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  if (!sheet.getLastRow()) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1); sheet.setHiddenGridlines(true);
  sheet.getRange(1, 1, 1, headers.length).setBackground('#28666e').setFontColor('#fff').setFontWeight('bold').setWrap(true);
  headers.forEach((header, index) => sheet.setColumnWidth(index + 1, /Dia_Chi|Ghi_Chu|Dien_Giai/.test(header) ? 220 : 145));
  if (name === 'NHAP_DOI_TUONG') sheet.getRange('B2:B1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['KHACH_HANG', 'NHA_CUNG_CAP'], true).setAllowInvalid(false).build());
  if (name === 'NHAP_CHUNG_TU') {
    sheet.getRange('B2:B1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['PHAI_THU', 'PHAI_TRA'], true).setAllowInvalid(false).build());
    sheet.getRange('D2:E1000').setNumberFormat('yyyy-mm-dd');
  }
}
