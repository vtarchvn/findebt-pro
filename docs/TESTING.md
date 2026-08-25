# Testing

`npm test` chạy accounting unit tests; `npm run check` chạy lint, test và build. Critical test xác nhận hóa đơn 100.000.000, thu 30.000.000, outstanding/aging/reminder/QR đều là 70.000.000; sau khi thu đủ thì paid, không aging, reminder hoặc QR.

Trước release còn cần smoke test trong tài khoản Google: OAuth, tạo Sheet, RPC, Mail quota, trigger, Drive PDF/backup, restore trên bản dữ liệu thử, desktop Chrome và mobile Safari/Chrome.
