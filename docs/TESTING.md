# Testing

`npm test` chạy accounting unit tests; `npm run check` chạy lint, test và build. Critical test xác nhận hóa đơn 100.000.000, thu 30.000.000, outstanding/aging/reminder/QR đều là 70.000.000; sau khi thu đủ thì paid, không aging, reminder hoặc QR.

Trước release còn cần smoke test trong tài khoản Google: OAuth, tạo Sheet, RPC, Mail quota, trigger, Drive PDF/backup, restore trên bản dữ liệu thử, desktop Chrome và mobile Safari/Chrome.

Với v2.1, smoke test thêm: skeleton xuất hiện trước bootstrap; health cập nhật sau mà không chặn thao tác; `loadDocumentsPage` giữ đúng tổng số và không lặp dòng khi tải thêm; bộ lọc đã lưu phục hồi sau reload; import nhiều dòng chỉ commit khi toàn bộ hợp lệ; mutation làm `dataVersion` tăng và bootstrap mới không trả cache cũ.

Với v2.2, kiểm tra thêm: migration giữ dữ liệu từ ba tab cũ; thứ tự/ẩn/bảo vệ tab đúng; dropdown và checkbox hoạt động; chỉ dòng đã đánh dấu được nhập; lỗi xuất hiện ở `05_KẾT_QUẢ_NHẬP`; dữ liệu mới trên Web App tự cập nhật KPI và sổ công nợ; bộ lọc, định dạng ngày/tiền, màu quá hạn và biểu đồ hiển thị đúng trên desktop/mobile Google Sheets.
