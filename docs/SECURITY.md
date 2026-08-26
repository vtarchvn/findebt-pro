# Security

- Web App bật `XFrameOptionsMode.ALLOWALL` để `google.script.run` hoạt động ổn định trong trình duyệt nhúng của Codex và các lớp iframe do Google Apps Script sử dụng. Đây chỉ là chính sách hiển thị; mọi API dữ liệu vẫn phải xác thực workspace, thành viên và vai trò ở phía máy chủ. Không xem việc trang được nhúng là bằng chứng người dùng đã được cấp quyền.
- Xuất CSV chỉ cho phép danh sách bảng công khai cố định: khách hàng/nhà cung cấp và chứng từ công nợ.
- Vai trò `VIEWER` chỉ nhận số tài khoản đã che; VietQR vẫn được tạo phía server từ dữ liệu đầy đủ.
- Preview import không ghi log hoặc thay đổi Google Sheet. Chỉ thao tác xác nhận import mới tạo dữ liệu và audit log.
- Mọi thao tác ghi tiếp tục kiểm tra vai trò và giữ `ScriptLock`; client không quyết định số dư hay quyền truy cập.

Không có password/token/Google credentials trong source hoặc Sheet. Web app bắt buộc chạy `USER_ACCESSING`; không dùng `USER_DEPLOYING` cho deployment nhiều người. Mỗi tài khoản chỉ kết nối workspace do họ sở hữu hoặc được chia sẻ. Spreadsheet/Root Folder ID nằm trong User Properties và manifest của workspace.

Mọi write được khóa bằng Script Lock, validate server-side, kiểm tra vai trò và audit. Vai trò: `OWNER`, `ADMIN`, `ACCOUNTANT`, `VIEWER`. Thêm/gỡ thành viên đồng thời cập nhật bảng `THANH_VIEN` và quyền thư mục Drive. HTML escape dữ liệu trước khi render. OAuth scope chỉ gồm Sheets, Drive, Docs, Mail, triggers và email identity.

Khi deploy, chọn access phù hợp (ưu tiên nội bộ domain nếu có), review OAuth consent và giới hạn quyền chỉnh sửa spreadsheet. `ANYONE` chỉ cho phép tải ứng dụng; dữ liệu vẫn yêu cầu quyền Google Drive và quyền thành viên phía server. Không bật chia sẻ Drive kiểu “Anyone with the link”. GitHub CD lấy `.clasp.json`/`.clasprc.json` từ encrypted secrets.
