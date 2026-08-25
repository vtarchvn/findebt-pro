# Database schema

Schema version 3 gồm: `CONFIG`, `DOI_TUONG`, `CHUNG_TU_CONG_NO`, `THANH_TOAN`, `PHAN_BO_THANH_TOAN`, `NHAC_NO`, `HEN_THANH_TOAN`, `TAI_KHOAN_NGAN_HANG`, `AUDIT_LOG`, `IMPORT_LOG`, `THANH_VIEN`, `IMPORT_STAGING`, `IMPORT_ERRORS`. Các sheet giao diện gồm `00_BẮT_ĐẦU`, `01_TỔNG_QUAN`, `02_CÔNG_NỢ`, `03_NHẬP_ĐỐI_TƯỢNG`, `04_NHẬP_CHỨNG_TỪ`, `05_KẾT_QUẢ_NHẬP`; `06_DANH_MỤC` và các bảng hệ thống được ẩn.

Quan hệ: Workspace 1–N Thành viên; Đối tượng 1–N Chứng từ; Đối tượng 1–N Thanh toán; Thanh toán N–N Chứng từ qua Phân bổ; Chứng từ 1–N Nhắc nợ; Đối tượng/Chứng từ 1–N Lời hẹn. Header đầy đủ nằm trong `src/infrastructure/schema.js`. Migration đổi tên tab giao diện cũ khi cần, chỉ thêm sheet/cột thiếu, định dạng Data Console và cập nhật `SCHEMA_VERSION`; không xóa dữ liệu tài chính cũ.
