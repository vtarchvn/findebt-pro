# Database schema

Schema version 1 gồm: `CONFIG`, `DOI_TUONG`, `CHUNG_TU_CONG_NO`, `THANH_TOAN`, `PHAN_BO_THANH_TOAN`, `NHAC_NO`, `HEN_THANH_TOAN`, `TAI_KHOAN_NGAN_HANG`, `AUDIT_LOG`, `IMPORT_LOG`.

Quan hệ: Đối tượng 1–N Chứng từ; Đối tượng 1–N Thanh toán; Thanh toán N–N Chứng từ qua Phân bổ; Chứng từ 1–N Nhắc nợ; Đối tượng/Chứng từ 1–N Lời hẹn. Header đầy đủ nằm trong `src/infrastructure/schema.js`. Migration chỉ thêm sheet/cột thiếu và cập nhật `SCHEMA_VERSION`, không xóa dữ liệu cũ.
