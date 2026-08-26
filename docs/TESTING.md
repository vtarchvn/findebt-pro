# Testing

Luồng khởi động lấy phiên người dùng bằng `WorkspaceManager.session()` mà không mở Google Sheet hoặc Google Drive. Việc kiểm tra quyền và đọc workspace chỉ bắt đầu ở RPC `bootstrap` kế tiếp; bước xác nhận phiên phải báo lỗi sau tối đa 15 giây thay vì tải vô hạn.

Build production dùng Babel hạ toàn bộ JavaScript giao diện về ES5, sau đó bắt buộc phân tích lại với `ecmaVersion: 5`. Build phải thất bại nếu còn `const`, `let`, arrow function, template literal, class hoặc cú pháp mới khác. Canary phải đổi trạng thái tải ngay khi JavaScript được phép chạy và phải hiển thị lỗi hoặc cảnh báo watchdog sau 8 giây nếu script chính không khởi động.

JavaScript production nằm trong `Client.html` và được chèn vào `Index.html` bằng include có whitelist, theo cấu trúc khuyến nghị của Google Apps Script HTML Service. Kiểm tra thư mục `dist/` phải có cả `Index.html` và `Client.html` trước khi deploy.

Sau deploy, chạy `npm run smoke:production -- "<URL deployment có tham số chống cache>"`. Smoke test dùng phiên OAuth clasp hiện có để tải đúng HTML production, giải mã `userHtml` trong sandbox Google, kiểm tra toàn bộ script FINDEBT ở chuẩn ES5, mô phỏng `getSessionContext` và `bootstrap`, rồi yêu cầu dashboard render thành công. Không in access token hoặc nội dung dữ liệu người dùng ra log.

Chạy kiểm tra trước khi bàn giao:

```bash
npm run check
```

Bộ test hồi quy bao phủ thêm:

- phân bổ thiếu hoặc vượt số tiền thanh toán;
- ngày dân sự Việt Nam không lệch do UTC;
- chặn hủy chứng từ đã có thanh toán;
- kiểm tra lời hẹn đúng khách hàng và không vượt dư;
- duy nhất một tài khoản ngân hàng mặc định;
- whitelist xuất CSV, chống iframe và khôi phục sheet theo cấu trúc;
- binding giao diện, trạng thái thông báo và accessibility cơ bản.
- migration nhanh từ schema 3 lên 4 không dựng lại toàn bộ Data Console trong request tải ứng dụng.
- luồng tải production dùng hai bước ổn định `getSessionContext` → `bootstrap`; không gộp session và dữ liệu vào một RPC khó chẩn đoán.

Trước khi phát hành production, tạo một workspace clone để diễn tập backup/restore và kiểm tra thủ công công thức, định dạng, dropdown, protections, chart và sheet ẩn. Không thử khôi phục lần đầu trên dữ liệu thật.

`npm test` chạy accounting unit tests; `npm run check` chạy lint, test và build. Critical test xác nhận hóa đơn 100.000.000, thu 30.000.000, outstanding/aging/reminder/QR đều là 70.000.000; sau khi thu đủ thì paid, không aging, reminder hoặc QR.

Trước release còn cần smoke test trong tài khoản Google: OAuth, tạo Sheet, RPC, Mail quota, trigger, Drive PDF/backup, restore trên bản dữ liệu thử, desktop Chrome và mobile Safari/Chrome.

Với v2.1, smoke test thêm: skeleton xuất hiện trước bootstrap; health cập nhật sau mà không chặn thao tác; `loadDocumentsPage` giữ đúng tổng số và không lặp dòng khi tải thêm; bộ lọc đã lưu phục hồi sau reload; import nhiều dòng chỉ commit khi toàn bộ hợp lệ; mutation làm `dataVersion` tăng và bootstrap mới không trả cache cũ.

Với v2.2, kiểm tra thêm: migration giữ dữ liệu từ ba tab cũ; thứ tự/ẩn/bảo vệ tab đúng; dropdown và checkbox hoạt động; chỉ dòng đã đánh dấu được nhập; lỗi xuất hiện ở `05_KẾT_QUẢ_NHẬP`; dữ liệu mới trên Web App tự cập nhật KPI và sổ công nợ; bộ lọc, định dạng ngày/tiền, màu quá hạn và biểu đồ hiển thị đúng trên desktop/mobile Google Sheets.
