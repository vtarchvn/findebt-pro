# Security

Không có password/token/Google credentials trong source hoặc Sheet. Spreadsheet ID nằm ở User Properties. Mọi write được khóa bằng User Lock, validate server-side và audit. HTML escape dữ liệu trước khi render. OAuth scope chỉ gồm Sheets, Drive, Mail, triggers và email identity.

Khi deploy, chọn access phù hợp (ưu tiên nội bộ domain nếu có), review OAuth consent và giới hạn quyền chỉnh sửa spreadsheet. GitHub CD lấy `.clasp.json`/`.clasprc.json` từ encrypted secrets.
