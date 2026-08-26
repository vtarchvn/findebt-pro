export const SCHEMA_VERSION = 4;

export const USER_SHEETS = Object.freeze({
  START: '00_BẮT_ĐẦU', OVERVIEW: '01_TỔNG_QUAN', DEBTS: '02_CÔNG_NỢ',
  PARTNER_INPUT: '03_NHẬP_ĐỐI_TƯỢNG', DOCUMENT_INPUT: '04_NHẬP_CHỨNG_TỪ',
  IMPORT_RESULTS: '05_KẾT_QUẢ_NHẬP', LOOKUPS: '06_DANH_MỤC'
});

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

const COLORS = Object.freeze({ navy: '#16324f', blue: '#e8f3f8', cyan: '#dff4fb', text: '#1f2937', muted: '#64748b', green: '#dcfce7', amber: '#fef3c7', red: '#fee2e2', gray: '#f1f5f9', white: '#ffffff' });
const PARTNER_HEADERS = ['Ten_DT', 'Phan_Loai', 'So_Dien_Thoai', 'Email', 'Nguoi_Lien_He', 'Dia_Chi', 'Han_Muc_Tin_Dung', 'Du_No_Dau_Ky', 'Thoi_Han_No_Chuan', 'Ghi_Chu', 'San_Sang_Nhap', 'Trang_Thai', 'Loi'];
const DOCUMENT_HEADERS = ['Ma_DT', 'Loai_Cong_No', 'So_Chung_Tu', 'Ngay_Chung_Tu', 'Han_Thanh_Toan', 'So_Tien_Goc', 'Dien_Giai', 'San_Sang_Nhap', 'Trang_Thai', 'Loi'];
const DEBT_HEADERS = ['Mã CT', 'Số chứng từ', 'Đối tượng', 'Loại', 'Ngày chứng từ', 'Hạn thanh toán', 'Tiền gốc', 'Còn lại', 'Quá hạn (ngày)', 'Trạng thái'];
const HEADER_LABELS = Object.freeze({ Ten_DT: 'Tên đối tượng *', Phan_Loai: 'Phân loại *', So_Dien_Thoai: 'Số điện thoại', Email: 'Email', Nguoi_Lien_He: 'Người liên hệ', Dia_Chi: 'Địa chỉ', Han_Muc_Tin_Dung: 'Hạn mức tín dụng', Du_No_Dau_Ky: 'Dư nợ đầu kỳ', Thoi_Han_No_Chuan: 'Thời hạn nợ (ngày)', Ghi_Chu: 'Ghi chú', Ma_DT: 'Đối tượng *', Loai_Cong_No: 'Loại công nợ *', So_Chung_Tu: 'Số chứng từ *', Ngay_Chung_Tu: 'Ngày chứng từ *', Han_Thanh_Toan: 'Hạn thanh toán *', So_Tien_Goc: 'Số tiền gốc *', Dien_Giai: 'Diễn giải', San_Sang_Nhap: 'Sẵn sàng nhập', Trang_Thai: 'Trạng thái', Loi: 'Lỗi cần sửa' });

export function inputHeaderKey(value) { const text = String(value || '').trim(); return Object.keys(HEADER_LABELS).find(key => key === text || HEADER_LABELS[key] === text) || text; }

export function migrateSpreadsheet(spreadsheet) {
  const currentVersion = readSchemaVersion(spreadsheet);
  if (currentVersion === 3) { migrateV3ToV4(spreadsheet); return; }
  renameLegacySheet(spreadsheet, 'TONG_QUAN', USER_SHEETS.OVERVIEW);
  renameLegacySheet(spreadsheet, 'NHAP_DOI_TUONG', USER_SHEETS.PARTNER_INPUT);
  renameLegacySheet(spreadsheet, 'NHAP_CHUNG_TU', USER_SHEETS.DOCUMENT_INPUT);
  Object.entries(TABLES).forEach(([name, headers]) => ensureSystemSheet(spreadsheet, name, headers));
  ensureStartSheet(spreadsheet); ensureOverviewSheet(spreadsheet); ensureDebtSheet(spreadsheet); ensureLookupSheet(spreadsheet);
  ensureInputSheet(spreadsheet, USER_SHEETS.PARTNER_INPUT, PARTNER_HEADERS, 'Nhập đối tượng hàng loạt', 'Dán khách hàng hoặc nhà cung cấp, đánh dấu Sẵn sàng nhập rồi xác nhận trên Web App.');
  ensureInputSheet(spreadsheet, USER_SHEETS.DOCUMENT_INPUT, DOCUMENT_HEADERS, 'Nhập chứng từ hàng loạt', 'Chọn đối tượng và loại công nợ, kiểm tra trạng thái từng dòng trước khi nhập.');
  ensureImportResultsSheet(spreadsheet); orderAndSecureSheets(spreadsheet); updateSchemaVersion(spreadsheet);
}

function readSchemaVersion(spreadsheet) { const config = spreadsheet.getSheetByName('CONFIG'); if (!config || config.getLastRow() < 2) return 0; const rows = config.getRange(2, 1, config.getLastRow() - 1, 2).getValues(); return Number(rows.find(row => row[0] === 'SCHEMA_VERSION')?.[1] || 0); }
function migrateV3ToV4(spreadsheet) { const sheet = spreadsheet.getSheetByName('TAI_KHOAN_NGAN_HANG'); if (!sheet) throw new Error('Workspace thiếu bảng tài khoản ngân hàng. Hãy chạy kiểm tra cấu trúc trước khi nâng cấp.'); const column = TABLES.TAI_KHOAN_NGAN_HANG.indexOf('So_Tai_Khoan') + 1; sheet.getRange(2, column, Math.max(1, sheet.getMaxRows() - 1), 1).setNumberFormat('@'); updateSchemaVersion(spreadsheet); }

function renameLegacySheet(spreadsheet, oldName, newName) { const legacy = spreadsheet.getSheetByName(oldName); if (legacy && !spreadsheet.getSheetByName(newName)) legacy.setName(newName); }

function ensureSystemSheet(spreadsheet, name, headers) {
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name); const existing = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
  if (!existing.some(Boolean)) sheet.getRange(1, 1, 1, headers.length).setValues([headers]); else { const missing = headers.filter(header => !existing.includes(header)); if (missing.length) sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]); }
  sheet.setFrozenRows(1); sheet.setHiddenGridlines(true); sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground(COLORS.gray).setFontColor(COLORS.text).setWrap(true);
  headers.forEach((header, index) => sheet.setColumnWidth(index + 1, /Tien|Du_No|Han_Muc/.test(header) ? 135 : /Email|Dia_Chi|Ghi_Chu|Noi_Dung|JSON|Loi/.test(header) ? 220 : 120));
  if (name === 'TAI_KHOAN_NGAN_HANG') sheet.getRange(2, headers.indexOf('So_Tai_Khoan') + 1, Math.max(1, sheet.getMaxRows() - 1), 1).setNumberFormat('@');
  ensureWarningProtection(sheet, 'FINDEBT: bảng hệ thống — hãy thao tác qua Web App');
}

function ensureStartSheet(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(USER_SHEETS.START) || spreadsheet.insertSheet(USER_SHEETS.START, 0); sheet.showSheet(); sheet.setHiddenGridlines(true); sheet.setFrozenRows(0); sheet.setTabColor('#38bdf8');
  sheet.getRange('A1:H20').clearFormat().setBackground(COLORS.white).setFontColor(COLORS.text).setFontFamily('Arial'); safeMerge(sheet, 'A1:H2'); safeMerge(sheet, 'A4:H4'); safeMerge(sheet, 'A7:D7'); safeMerge(sheet, 'E7:H7');
  sheet.getRange('A1').setValue('FINDEBT PRO — BẮT ĐẦU').setFontSize(22).setFontWeight('bold').setFontColor(COLORS.navy).setVerticalAlignment('middle');
  sheet.getRange('A4').setValue('Google Sheet dùng để xem tổng thể, lọc và nhập hàng loạt. Giao dịch hằng ngày nên thực hiện trên Web App để giữ đúng kiểm tra và audit log.').setBackground(COLORS.blue).setFontColor(COLORS.navy).setWrap(true).setVerticalAlignment('middle');
  sheet.getRange('A7').setValue('LIÊN KẾT NHANH').setFontWeight('bold').setFontColor(COLORS.navy); sheet.getRange('E7').setValue('TRẠNG THÁI WORKSPACE').setFontWeight('bold').setFontColor(COLORS.navy);
  sheet.getRange('A9:B12').setValues([['Web App', 'Chưa cập nhật'], ['Thư mục Drive', 'Chưa cập nhật'], ['Google Sheet', 'Mở bảng hiện tại'], ['Hướng dẫn', 'Xem các bước bên dưới']]);
  sheet.getRange('E9:F13').setValues([['Doanh nghiệp', 'Đang tải'], ['Tài khoản', 'Đang tải'], ['Vai trò', 'Đang tải'], ['Đồng bộ gần nhất', 'Chưa đồng bộ'], ['Sức khỏe', 'Đang kiểm tra']]);
  sheet.getRange('A15:H17').setValues([['01', 'Mở Web App', 'Ghi nhận đối tượng, chứng từ và thanh toán.', '', '04', 'Kiểm tra lỗi', 'Sửa các dòng màu đỏ trước khi xác nhận nhập.', ''], ['02', 'Xem tổng quan', 'Lọc công nợ tại tab 01 và 02.', '', '05', 'Xác nhận trên app', 'Dữ liệu chỉ vào hệ thống sau bước xác nhận.', ''], ['03', 'Nhập hàng loạt', 'Dán dữ liệu vào tab 03 hoặc 04.', '', '06', 'Không sửa bảng ẩn', 'Các tab hệ thống được bảo vệ để tránh sai số.', '']]).setWrap(true);
  sheet.getRange('A9:A12').setFontWeight('bold').setFontColor(COLORS.muted); sheet.getRange('E9:E13').setFontWeight('bold').setFontColor(COLORS.muted); sheet.getRange('A15:A17').setBackground(COLORS.cyan).setFontWeight('bold').setHorizontalAlignment('center'); sheet.getRange('E15:E17').setBackground(COLORS.cyan).setFontWeight('bold').setHorizontalAlignment('center');
  sheet.setRowHeights(1, 2, 34); sheet.setRowHeight(4, 54); sheet.setColumnWidths(1, 8, 125); sheet.setColumnWidth(3, 235); sheet.setColumnWidth(7, 235); ensureWarningProtection(sheet, 'FINDEBT: trang hướng dẫn tự động');
}

function ensureOverviewSheet(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(USER_SHEETS.OVERVIEW) || spreadsheet.insertSheet(USER_SHEETS.OVERVIEW); sheet.showSheet(); sheet.setHiddenGridlines(true); sheet.setFrozenRows(5); sheet.setTabColor('#0ea5e9'); safeMerge(sheet, 'A1:H1'); safeMerge(sheet, 'A2:H2');
  sheet.getRange('A1').setValue('FINDEBT PRO — TỔNG QUAN').setBackground(COLORS.blue).setFontColor(COLORS.navy).setFontSize(18).setFontWeight('bold'); sheet.getRange('A2').setValue('Snapshot quản trị: dữ liệu do Web App tính và đồng bộ, không nhập trực tiếp tại đây.').setFontColor(COLORS.muted).setWrap(true);
  sheet.getRange('A4:H4').setValues([['Chỉ số', 'Phải thu', 'Phải trả', 'Công nợ ròng', 'Quá hạn', 'Đối tượng', 'Chứng từ mở', 'Cập nhật']]); styleHeader(sheet.getRange('A4:H4')); sheet.getRange('A7:H7').setValues([['Mức độ', 'Đối tượng', 'Chứng từ', 'Hạn thanh toán', 'Còn lại', 'Quá hạn (ngày)', 'Trạng thái', 'Sức khỏe']]); styleHeader(sheet.getRange('A7:H7'));
  sheet.getRange('B5:E5').setNumberFormat('#,##0 "₫"'); sheet.getRange('H5').setNumberFormat('dd/mm/yyyy hh:mm'); sheet.setColumnWidths(1, 8, 135); sheet.setColumnWidth(2, 210); sheet.setColumnWidth(3, 150); applyOverviewRules(sheet); ensureWarningProtection(sheet, 'FINDEBT: dashboard tự động — không sửa trực tiếp');
}

function ensureDebtSheet(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(USER_SHEETS.DEBTS) || spreadsheet.insertSheet(USER_SHEETS.DEBTS); sheet.showSheet(); sheet.setHiddenGridlines(true); sheet.setFrozenRows(5); sheet.setTabColor('#22c55e'); safeMerge(sheet, 'A1:J1'); safeMerge(sheet, 'A2:J2');
  sheet.getRange('A1').setValue('SỔ CÔNG NỢ — CHẾ ĐỘ XEM').setBackground(COLORS.blue).setFontColor(COLORS.navy).setFontSize(18).setFontWeight('bold'); sheet.getRange('A2').setValue('Dùng bộ lọc ở hàng tiêu đề để tìm đối tượng, khoản còn nợ, quá hạn hoặc đã thanh toán.').setFontColor(COLORS.muted).setWrap(true);
  sheet.getRange(5, 1, 1, DEBT_HEADERS.length).setValues([DEBT_HEADERS]); styleHeader(sheet.getRange(5, 1, 1, DEBT_HEADERS.length)); sheet.getRange('E6:F1005').setNumberFormat('dd/mm/yyyy'); sheet.getRange('G6:H1005').setNumberFormat('#,##0 "₫"'); sheet.setColumnWidths(1, 10, 130); sheet.setColumnWidth(2, 155); sheet.setColumnWidth(3, 220); sheet.setColumnWidth(10, 145); resetFilter(sheet, 5, DEBT_HEADERS.length); applyDebtRules(sheet); ensureWarningProtection(sheet, 'FINDEBT: sổ xem tự động — ghi dữ liệu trên Web App');
}

function ensureInputSheet(spreadsheet, name, headers, title, description) {
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name); const headerRow = findHeaderRow(sheet, headers[0]); if (headerRow === 1) sheet.insertRowsBefore(1, 4); sheet.showSheet(); sheet.setHiddenGridlines(true); sheet.setFrozenRows(5); sheet.setTabColor('#f59e0b');
  safeMerge(sheet, `A1:${columnLetter(headers.length)}1`); safeMerge(sheet, `A2:${columnLetter(headers.length)}2`); sheet.getRange('A1').setValue(title.toUpperCase()).setBackground(COLORS.blue).setFontColor(COLORS.navy).setFontSize(18).setFontWeight('bold'); sheet.getRange('A2').setValue(description).setFontColor(COLORS.muted).setWrap(true); sheet.getRange('A4').setValue('Ô xanh nhạt: được nhập  ·  Ô xám: hệ thống tính  ·  Đỏ: cần sửa  ·  Đánh dấu Sẵn sàng nhập khi hoàn tất.').setFontColor(COLORS.navy).setFontSize(10);
  ensureHeadersAtRow(sheet, headers, 5); styleHeader(sheet.getRange(5, 1, 1, headers.length)); sheet.getRange(6, 1, 995, headers.length - 2).setBackground(COLORS.cyan); sheet.getRange(6, headers.length - 1, 995, 2).setBackground(COLORS.gray); applyInputValidation(sheet, name, headers); applyInputFormulas(sheet, name, headers); addHeaderNotes(sheet, headers); resetFilter(sheet, 5, headers.length); applyInputRules(sheet, headers);
  headers.forEach((header, index) => sheet.setColumnWidth(index + 1, /Dia_Chi|Ghi_Chu|Dien_Giai|Loi/.test(header) ? 240 : /Ten_DT|Ma_DT/.test(header) ? 210 : 145)); protectCalculatedColumns(sheet, headers);
}

function ensureImportResultsSheet(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(USER_SHEETS.IMPORT_RESULTS) || spreadsheet.insertSheet(USER_SHEETS.IMPORT_RESULTS); sheet.showSheet(); sheet.setHiddenGridlines(true); sheet.setFrozenRows(6); sheet.setTabColor('#a855f7'); safeMerge(sheet, 'A1:F1'); safeMerge(sheet, 'A2:F2');
  sheet.getRange('A1').setValue('KẾT QUẢ KIỂM TRA & NHẬP DỮ LIỆU').setBackground(COLORS.blue).setFontColor(COLORS.navy).setFontSize(18).setFontWeight('bold'); sheet.getRange('A2').setValue('Kết quả gần nhất từ Web App. Dòng lỗi giữ nguyên để người dùng quay lại tab nhập và sửa.').setFontColor(COLORS.muted).setWrap(true); sheet.getRange('A4:F4').setValues([['Mã import', 'Loại', 'Tổng dòng', 'Hợp lệ', 'Lỗi', 'Cập nhật']]); styleHeader(sheet.getRange('A4:F4')); sheet.getRange('A6:F6').setValues([['Dòng', 'Mức độ', 'Nội dung lỗi', 'Dữ liệu', 'Trạng thái', 'Gợi ý xử lý']]); styleHeader(sheet.getRange('A6:F6')); sheet.setColumnWidths(1, 6, 135); sheet.setColumnWidth(3, 300); sheet.setColumnWidth(4, 320); sheet.setColumnWidth(6, 240); sheet.getRange('A7:F100').setWrap(true); applyImportResultRules(sheet); ensureWarningProtection(sheet, 'FINDEBT: kết quả nhập tự động');
}

function ensureLookupSheet(spreadsheet) { const sheet = spreadsheet.getSheetByName(USER_SHEETS.LOOKUPS) || spreadsheet.insertSheet(USER_SHEETS.LOOKUPS); sheet.getRange('A1:C1').setValues([['Đối tượng', 'Mã', 'Tên']]); styleHeader(sheet.getRange('A1:C1')); sheet.setHiddenGridlines(true); ensureWarningProtection(sheet, 'FINDEBT: danh mục phục vụ dropdown'); }

function applyInputValidation(sheet, name, headers) {
  const readyColumn = headers.indexOf('San_Sang_Nhap') + 1; sheet.getRange(6, readyColumn, 995, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().setAllowInvalid(false).build()).setHorizontalAlignment('center');
  if (name === USER_SHEETS.PARTNER_INPUT) { sheet.getRange('B6:B1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Khách hàng', 'Nhà cung cấp'], true).setAllowInvalid(false).setHelpText('Chọn Khách hàng hoặc Nhà cung cấp.').build()); sheet.getRange('G6:I1000').setNumberFormat('#,##0'); }
  else { const lookup = sheet.getParent().getSheetByName(USER_SHEETS.LOOKUPS); sheet.getRange('A6:A1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(lookup.getRange('A2:A1000'), true).setAllowInvalid(false).setHelpText('Chọn mã và tên đối tượng có sẵn.').build()); sheet.getRange('B6:B1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Phải thu', 'Phải trả'], true).setAllowInvalid(false).build()); sheet.getRange('D6:E1000').setNumberFormat('dd/mm/yyyy'); sheet.getRange('F6:F1000').setNumberFormat('#,##0 "₫"'); }
}

function applyInputFormulas(sheet, name, headers) {
  const statusColumn = headers.indexOf('Trang_Thai') + 1; const errorColumn = headers.indexOf('Loi') + 1;
  const statusFormula = name === USER_SHEETS.PARTNER_INPUT ? '=IF(RC1="","",IF(NOT(RC[-1]),"Chưa sẵn sàng",IF(AND(RC2<>"",OR(RC4="",REGEXMATCH(RC4,"^[^@ ]+@[^@ ]+\\.[^@ ]+$"))),"Sẵn sàng","Có lỗi")))' : '=IF(RC1="","",IF(NOT(RC[-1]),"Chưa sẵn sàng",IF(AND(RC2<>"",RC3<>"",ISNUMBER(RC4),ISNUMBER(RC5),RC6>0,RC5>=RC4),"Sẵn sàng","Có lỗi")))';
  const errorFormula = name === USER_SHEETS.PARTNER_INPUT ? '=IF(RC1="","",IF(RC2="","Chưa chọn phân loại",IF(AND(RC4<>"",NOT(REGEXMATCH(RC4,"^[^@ ]+@[^@ ]+\\.[^@ ]+$"))),"Email không hợp lệ",IF(OR(RC7<0,RC8<0,RC9<0),"Số tiền hoặc thời hạn không hợp lệ",""))))' : '=IF(RC1="","",IF(RC2="","Chưa chọn loại công nợ",IF(RC3="","Thiếu số chứng từ",IF(OR(NOT(ISNUMBER(RC4)),NOT(ISNUMBER(RC5))),"Ngày không hợp lệ",IF(RC5<RC4,"Hạn thanh toán trước ngày chứng từ",IF(RC6<=0,"Số tiền phải lớn hơn 0",""))))))';
  sheet.getRange(6, statusColumn, 995, 1).setFormulaR1C1(statusFormula); sheet.getRange(6, errorColumn, 995, 1).setFormulaR1C1(errorFormula);
}

function addHeaderNotes(sheet, headers) {
  const notes = { Ten_DT: 'Bắt buộc. Ví dụ: Công ty An Phát', Phan_Loai: 'Bắt buộc. Chọn từ danh sách.', So_Dien_Thoai: 'Không bắt buộc.', Email: 'Nhập email hợp lệ để dùng nhắc nợ.', Nguoi_Lien_He: 'Tên người phụ trách công nợ.', Dia_Chi: 'Địa chỉ liên hệ.', Han_Muc_Tin_Dung: 'Số nguyên VND, không âm.', Du_No_Dau_Ky: 'Số dư ban đầu, không âm.', Thoi_Han_No_Chuan: 'Số ngày, ví dụ 30.', Ghi_Chu: 'Thông tin bổ sung.', Ma_DT: 'Bắt buộc. Chọn mã và tên từ dropdown.', Loai_Cong_No: 'Bắt buộc. Chọn Phải thu hoặc Phải trả.', So_Chung_Tu: 'Bắt buộc và không được trùng trong cùng đối tượng/loại.', Ngay_Chung_Tu: 'Bắt buộc. Định dạng ngày.', Han_Thanh_Toan: 'Bắt buộc và không trước ngày chứng từ.', So_Tien_Goc: 'Bắt buộc. Số nguyên VND lớn hơn 0.', Dien_Giai: 'Nội dung giao dịch.', San_Sang_Nhap: 'Đánh dấu khi dòng đã hoàn tất.', Trang_Thai: 'Hệ thống tự đánh giá.', Loi: 'Hệ thống hiển thị lỗi cần sửa.' };
  sheet.getRange(5, 1, 1, headers.length).setNotes([headers.map(header => notes[header] || '')]);
}

function applyInputRules(sheet, headers) {
  const statusColumn = headers.indexOf('Trang_Thai') + 1; const statusRange = sheet.getRange(6, statusColumn, 995, 1); const rules = [];
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Sẵn sàng').setBackground(COLORS.green).setFontColor('#166534').setRanges([statusRange]).build()); rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Có lỗi').setBackground(COLORS.red).setFontColor('#991b1b').setRanges([statusRange]).build()); rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Chưa sẵn sàng').setBackground(COLORS.amber).setFontColor('#92400e').setRanges([statusRange]).build()); sheet.setConditionalFormatRules(rules);
}

function applyOverviewRules(sheet) { const range = sheet.getRange('A8:H27'); sheet.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Cao').setBackground(COLORS.red).setFontColor('#991b1b').setRanges([range]).build(), SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Trung bình').setBackground(COLORS.amber).setFontColor('#92400e').setRanges([range]).build()]); }
function applyDebtRules(sheet) { const days = sheet.getRange('I6:I1005'); const status = sheet.getRange('J6:J1005'); sheet.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule().whenNumberGreaterThan(60).setBackground(COLORS.red).setFontColor('#991b1b').setRanges([days]).build(), SpreadsheetApp.newConditionalFormatRule().whenNumberBetween(31, 60).setBackground('#ffedd5').setFontColor('#9a3412').setRanges([days]).build(), SpreadsheetApp.newConditionalFormatRule().whenNumberBetween(1, 30).setBackground(COLORS.amber).setFontColor('#92400e').setRanges([days]).build(), SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Đã thanh toán').setBackground(COLORS.green).setFontColor('#166534').setRanges([status]).build()]); }
function applyImportResultRules(sheet) { sheet.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Lỗi').setBackground(COLORS.red).setFontColor('#991b1b').setRanges([sheet.getRange('B7:B100')]).build(), SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Đã nhập').setBackground(COLORS.green).setFontColor('#166534').setRanges([sheet.getRange('E7:E100')]).build()]); }

function orderAndSecureSheets(spreadsheet) {
  const userOrder = Object.values(USER_SHEETS).filter(name => name !== USER_SHEETS.LOOKUPS); const start = spreadsheet.getSheetByName(USER_SHEETS.START); spreadsheet.setActiveSheet(start); start.showSheet();
  userOrder.forEach((name, index) => { const sheet = spreadsheet.getSheetByName(name); if (!sheet) return; sheet.showSheet(); spreadsheet.setActiveSheet(sheet); spreadsheet.moveActiveSheet(index + 1); }); spreadsheet.setActiveSheet(start);
  [...Object.keys(TABLES), USER_SHEETS.LOOKUPS].forEach(name => { const sheet = spreadsheet.getSheetByName(name); if (sheet && !userOrder.includes(name) && !sheet.isSheetHidden()) sheet.hideSheet(); });
}

function protectCalculatedColumns(sheet, headers) { const protections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE); ['Trang_Thai', 'Loi'].forEach(header => { const column = headers.indexOf(header) + 1; if (column < 1) return; const range = sheet.getRange(6, column, 995, 1); const a1 = range.getA1Notation(); const protectedAlready = protections.some(protection => protection.getRange()?.getA1Notation() === a1); if (!protectedAlready) range.protect().setDescription(`FINDEBT: ${header} do hệ thống cập nhật`).setWarningOnly(true); }); }
function ensureWarningProtection(sheet, description) { if (!sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).length) sheet.protect().setDescription(description).setWarningOnly(true); }
function updateSchemaVersion(spreadsheet) { const config = spreadsheet.getSheetByName('CONFIG'); const rows = config.getDataRange().getValues(); const versionRow = rows.findIndex(row => row[0] === 'SCHEMA_VERSION'); const now = new Date(); if (versionRow < 0) config.appendRow(['SCHEMA_VERSION', SCHEMA_VERSION, now]); else config.getRange(versionRow + 1, 2, 1, 2).setValues([[SCHEMA_VERSION, now]]); }
function ensureHeadersAtRow(sheet, headers, rowNumber) { sheet.getRange(rowNumber, 1, 1, headers.length).setValues([headers.map(header => HEADER_LABELS[header] || header)]); }
function findHeaderRow(sheet, firstHeader) { if (!sheet.getLastRow()) return 0; const rows = sheet.getRange(1, 1, Math.min(10, sheet.getLastRow()), Math.max(1, sheet.getLastColumn())).getValues(); return rows.findIndex(row => row.map(inputHeaderKey).includes(firstHeader)) + 1; }
function resetFilter(sheet, headerRow, columnCount) { const existing = sheet.getFilter(); if (existing) existing.remove(); sheet.getRange(headerRow, 1, Math.max(2, sheet.getMaxRows() - headerRow + 1), columnCount).createFilter(); }
function styleHeader(range) { range.setBackground(COLORS.navy).setFontColor(COLORS.white).setFontWeight('bold').setWrap(true).setVerticalAlignment('middle'); }
function safeMerge(sheet, a1) { const range = sheet.getRange(a1); if (!range.isPartOfMerge()) range.merge(); }
function columnLetter(column) { let result = ''; for (let value = column; value > 0; value = Math.floor((value - 1) / 26)) result = String.fromCharCode(65 + ((value - 1) % 26)) + result; return result; }
