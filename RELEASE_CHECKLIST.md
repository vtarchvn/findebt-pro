# Release checklist

- [x] `npm run check` PASS
- [x] Không phát hiện credentials/secrets trong source
- [x] Critical accounting journey PASS
- [ ] Thử khởi tạo Sheet bằng tài khoản Google sạch
- [ ] Thử AR/AP, partial/multi-allocation và void
- [ ] Thử mọi aging bucket, credit warning, promise-to-pay
- [ ] Thử VietQR bằng tài khoản ngân hàng sandbox/doanh nghiệp
- [ ] Thử email reminder, chống trùng và dừng khi paid
- [ ] Thử PDF, CSV, backup và restore trên dữ liệu thử
- [x] Kiểm tra desktop và mobile responsive bằng browser smoke test
- [ ] Kiểm tra light mode và tablet trên Apps Script deployment
- [ ] Review OAuth access và MailApp quotas
- [ ] Tạo Apps Script version/deployment, ghi URL và rollback version
