# Database schema

Schema version 2 gồm: `CONFIG`, `DOI_TUONG`, `CHUNG_TU_CONG_NO`, `THANH_TOAN`, `PHAN_BO_THANH_TOAN`, `NHAC_NO`, `HEN_THANH_TOAN`, `TAI_KHOAN_NGAN_HANG`, `AUDIT_LOG`, `IMPORT_LOG`, `THANH_VIEN`, `IMPORT_STAGING`, `IMPORT_ERRORS`. Các sheet giao diện dữ liệu gồm `TONG_QUAN`, `NHAP_DOI_TUONG` và `NHAP_CHUNG_TU`.

Quan hệ: Workspace 1–N Thành viên; Đối tượng 1–N Chứng từ; Đối tượng 1–N Thanh toán; Thanh toán N–N Chứng từ qua Phân bổ; Chứng từ 1–N Nhắc nợ; Đối tượng/Chứng từ 1–N Lời hẹn. Header đầy đủ nằm trong `src/infrastructure/schema.js`. Migration chỉ thêm sheet/cột thiếu, tạo Data Console/staging và cập nhật `SCHEMA_VERSION`, không xóa dữ liệu tài chính cũ.
