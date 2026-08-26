# Product spec

FINDEBT PRO phục vụ kế toán và chủ doanh nghiệp Việt Nam cần theo dõi phải thu/phải trả mà không vận hành hạ tầng. Luồng chính: khởi tạo → tạo đối tượng → ghi chứng từ → thu/trả và phân bổ → theo dõi aging/dashboard → nhắc nợ/VietQR/PDF → báo cáo/backup.

Desktop ưu tiên phân tích; mobile ưu tiên dashboard, tìm nợ, quá hạn, VietQR, ghi nhận thu tiền và nhắc nợ. Mobile giữ bốn đích chính ở thanh điều hướng dưới, dùng nhãn ngắn và gom tác vụ thứ cấp vào bottom sheet có trạng thái trang hiện tại, vùng chạm lớn và safe-area. Hệ thống hỗ trợ dark/light, keyboard focus, semantic labels và độ tương phản tài chính rõ ràng.

## Nhận diện ứng dụng

- Biểu tượng chính dùng `web/assets/vtarch-symbol-transparent.png`: chỉ giữ phần biểu tượng gradient, không chữ và có nền trong suốt.
- Quy trình build nhúng biểu tượng vào `dist/Index.html` dưới dạng data URL để Google Apps Script hiển thị ổn định mà không phụ thuộc hosting ảnh bên ngoài.
- Build dùng biến thể 256×256 đã tối ưu (`web/assets/vtarch-symbol-256.png`) để giảm kích thước tải ban đầu; ảnh gốc chất lượng cao vẫn được giữ làm tài sản nguồn.
- Logo doanh nghiệp trong Cài đặt là dữ liệu riêng của từng workspace và không thay thế biểu tượng sản phẩm FINDEBT PRO ở thanh điều hướng.

## Tác giả và hỗ trợ

- Tab `Tác giả & hỗ trợ` là thông tin cấp sản phẩm, tách biệt với hồ sơ doanh nghiệp của từng workspace.
- Thông tin chính thức: tác giả `Nguyễn Văn Thanh (VTARCH)`, email `vtarch.vn@gmail.com`, website `https://vtarch.vercel.app/`, mã nguồn `https://github.com/vtarchvn/findebt-pro`.
- Khu vực hỗ trợ ưu tiên liên kết trực tiếp tới hướng dẫn mới nhất tại `https://github.com/vtarchvn/findebt-pro/blob/main/docs/USER_GUIDE.md`; thông tin ủng hộ là nội dung thứ cấp.
- Khu vực “Mời tôi một ly cà phê” hiển thị VietQR Techcombank, số tài khoản `36500766889999` và chủ tài khoản `NGUYEN VAN THANH`. QR không đặt trước số tiền; người dùng vẫn được nhắc kiểm tra người nhận trước khi xác nhận.
