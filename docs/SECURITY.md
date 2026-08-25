# Security

Không có password/token/Google credentials trong source hoặc Sheet. Web app bắt buộc chạy `USER_ACCESSING`; không dùng `USER_DEPLOYING` cho deployment nhiều người. Mỗi tài khoản chỉ kết nối workspace do họ sở hữu hoặc được chia sẻ. Spreadsheet/Root Folder ID nằm trong User Properties và manifest của workspace.

Mọi write được khóa bằng Script Lock, validate server-side, kiểm tra vai trò và audit. Vai trò: `OWNER`, `ADMIN`, `ACCOUNTANT`, `VIEWER`. Thêm/gỡ thành viên đồng thời cập nhật bảng `THANH_VIEN` và quyền thư mục Drive. HTML escape dữ liệu trước khi render. OAuth scope chỉ gồm Sheets, Drive, Docs, Mail, triggers và email identity.

Khi deploy, chọn access phù hợp (ưu tiên nội bộ domain nếu có), review OAuth consent và giới hạn quyền chỉnh sửa spreadsheet. `ANYONE` chỉ cho phép tải ứng dụng; dữ liệu vẫn yêu cầu quyền Google Drive và quyền thành viên phía server. Không bật chia sẻ Drive kiểu “Anyone with the link”. GitHub CD lấy `.clasp.json`/`.clasprc.json` từ encrypted secrets.
