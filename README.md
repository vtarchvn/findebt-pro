# FINDEBT PRO

Quản trị công nợ phải thu/phải trả miễn phí cho doanh nghiệp Việt Nam, vận hành hoàn toàn trên Google Apps Script, Google Sheets và Google Drive.

## Tính năng

- Khách hàng/nhà cung cấp, chứng từ AR/AP, thu–trả và phân bổ nhiều-nhiều.
- Outstanding, trạng thái, aging và hạn mức tín dụng được tính phía server.
- VietQR theo đúng số tiền còn phải thu; reminder chống gửi trùng và dừng khi trả đủ.
- Promise to Pay, PDF công nợ, CSV, backup/restore Drive và audit log.
- Dark/light mode; giao diện riêng cho desktop, tablet và mobile.

## Triển khai lần đầu

Yêu cầu duy nhất cho người triển khai: tài khoản Google và Node.js 20+ trên máy kỹ thuật. Người dùng cuối chỉ mở URL Web App.

1. Tạo một Apps Script project tại [script.google.com](https://script.google.com), mở **Project settings** và chép Script ID.
2. Chạy `npm install`, `npm run setup`, thay `YOUR_SCRIPT_ID` trong `.clasp.json`.
3. Chạy `npx clasp login`, `npm run push`.
4. Trong Apps Script chọn **Deploy → New deployment → Web app**, Execute as **User deploying**, chọn phạm vi truy cập phù hợp tổ chức.
5. Mở URL, cấp quyền Google, nhập tên doanh nghiệp và nhấn **Khởi tạo FINDEBT**.
6. Trong Nhắc nợ, bật trigger hằng ngày nếu muốn gửi email tự động.

Các lệnh: `npm test`, `npm run lint`, `npm run build`, `npm run push`, `npm run deploy`, `npm run check`.

Không commit `.clasp.json`, `.clasprc.json`, token hay credentials. Xem [Deployment](docs/DEPLOYMENT.md), [User guide](docs/USER_GUIDE.md) và [Architecture](ARCHITECTURE.md).
