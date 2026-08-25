# Architecture

FINDEBT dùng clean layering:

- `src/domain`: accounting core thuần JavaScript, không phụ thuộc Google APIs.
- `src/application`: use cases, validation, audit và orchestration.
- `src/infrastructure`: batch Sheet store, schema/migration và Workspace Manager cho Drive/manifest.
- `src/server`: adapter cho Apps Script, Drive, Mail, triggers và RPC.
- `web`: single-page responsive UI; không quyết định số liệu tài chính.
- `gas`: top-level Apps Script entry points.

`esbuild` bundle server thành `dist/Bundle.js`; `Code.gs` giữ các hàm global mà Apps Script yêu cầu. Web app chạy bằng người truy cập. User Properties của từng tài khoản chỉ lưu `workspaceId`, Root Folder ID và Spreadsheet ID; nguồn sự thật có thể khôi phục là `99_SYSTEM/FINDEBT_MANIFEST.json` và bảng `CONFIG`. Financial records chỉ được void/reverse; Audit Log lưu before/after.

Mỗi workspace có một thư mục gốc với các nhánh đánh số `00_HUONG_DAN` đến `99_SYSTEM`. Thành viên được kiểm tra hai lớp: quyền Drive và bảng `THANH_VIEN`. `ScriptLock` bảo vệ ghi đồng thời giữa nhiều kế toán dùng chung workspace. Snapshot đặt `WORKSPACE_MODE=SNAPSHOT` và bị chặn ghi phía server.

ADR-001: Google Sheets là datastore để không cần server/database. ADR-002: tiền VND là safe integer. ADR-003: trạng thái/outstanding luôn được dựng lại từ chứng từ và phân bổ đang hiệu lực. ADR-004: mỗi workspace là một tenant độc lập trong Drive của người dùng. ADR-005: User Properties là con trỏ/cache, manifest và Sheet config cho phép liên kết lại mà không phụ thuộc tên thư mục.

## Luồng hiệu năng v2.1

- Bootstrap chỉ đọc snapshot nghiệp vụ cần cho màn hình đầu; health Drive và đồng bộ `01_TỔNG_QUAN`, `02_CÔNG_NỢ`, `00_BẮT_ĐẦU` chạy nền sau khi giao diện đã hiện.
- `SheetStore` memoize mỗi bảng trong một request, bỏ migration khi schema đã đúng và gom các đợt import thành một lần `setValues` cho mỗi bảng.
- Cache bootstrap được khóa theo Spreadsheet ID và `DATA_VERSION`; mọi mutation nghiệp vụ tăng phiên bản nên không dùng dữ liệu cũ.
- Sổ công nợ dùng RPC phân trang, tìm kiếm/lọc/sắp xếp phía máy chủ. Bộ lọc gần nhất được lưu cục bộ trên trình duyệt, không chứa dữ liệu tài chính.
- Health cache 5 phút và kiểm tra backup, dữ liệu mồ côi, email, trùng đối tượng, Owner và độ lệch giữa quyền Drive với `THANH_VIEN`.

## Google Sheet Console v2.2

- Bảy tab người dùng được đánh số theo luồng: bắt đầu, tổng quan, công nợ, hai bảng nhập, kết quả nhập và danh mục ẩn.
- Các bảng nghiệp vụ hệ thống vẫn là nguồn dữ liệu chuẩn, được ẩn và bảo vệ cảnh báo; Sheet người dùng chỉ là lớp xem/nhập có kiểm soát.
- Web App tự đồng bộ snapshot Sheet sau các mutation. Bảng nhập chỉ gửi những dòng đã đánh dấu **Sẵn sàng nhập** và ghi lỗi về `05_KẾT_QUẢ_NHẬP`.
- Migration schema 3 đổi tên các tab cũ và giữ nguyên dữ liệu đã nhập, không xóa bản ghi tài chính.
