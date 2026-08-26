# FINDEBT PRO

Quản trị công nợ phải thu/phải trả miễn phí cho doanh nghiệp Việt Nam, vận hành hoàn toàn trên Google Apps Script, Google Sheets và Google Drive.

**Bắt đầu tại đây:** [Hướng dẫn sử dụng có hình minh họa](docs/USER_GUIDE.md) · [Hướng dẫn quản trị triển khai](docs/ADMIN_GUIDE.md) · [Bản FINDEBT PRO đang chạy](https://script.google.com/macros/s/AKfycbzPMDvCufvzEEzwXh5gTX6qQLyEYWzxrCzpFdn4LU1HpgivOmlpn-VxZK6dx5T_ln8C/exec)

## Tính năng

- Khách hàng/nhà cung cấp, chứng từ AR/AP, thu–trả và phân bổ nhiều-nhiều.
- Outstanding, trạng thái, aging và hạn mức tín dụng được tính phía server.
- VietQR theo đúng số tiền còn phải thu; reminder chống gửi trùng và dừng khi trả đủ.
- Promise to Pay, PDF công nợ, CSV, backup/restore Drive và audit log.
- Workspace riêng theo tài khoản Google; wizard tạo mới hoặc liên kết thư mục Drive đã được chia sẻ.
- Google Sheet Data Console, staging nhập hàng loạt, phân quyền Owner/Admin/Kế toán/Viewer.
- Nhân bản mẫu trống, bản sao đầy đủ hoặc snapshot chỉ đọc; kiểm tra sức khỏe dữ liệu và backup.
- Dark/light mode; giao diện riêng cho desktop, tablet và mobile, với thanh điều hướng dưới và bảng chức năng tối ưu cho thao tác một tay.

## Triển khai lần đầu

Yêu cầu duy nhất cho người triển khai: tài khoản Google và Node.js 20+ trên máy kỹ thuật. Người dùng cuối chỉ mở URL Web App.

1. Tạo một Apps Script project tại [script.google.com](https://script.google.com), mở **Project settings** và chép Script ID.
2. Chạy `npm install`, `npm run setup`, thay `YOUR_SCRIPT_ID` trong `.clasp.json`.
3. Chạy `npx clasp login`, `npm run push`.
4. Trong Apps Script chọn **Deploy → New deployment → Web app**, Execute as **User accessing the web app**, chọn phạm vi truy cập phù hợp tổ chức.
5. Mở URL, cấp quyền Google, chọn **Tạo workspace mới** hoặc **Liên kết workspace** đã được chia sẻ.
6. Trong Nhắc nợ, bật trigger hằng ngày nếu muốn gửi email tự động.

Các lệnh: `npm test`, `npm run lint`, `npm run build`, `npm run push`, `npm run deploy`, `npm run check`.

Không commit `.clasp.json`, `.clasprc.json`, token hay credentials. Xem [Deployment](docs/DEPLOYMENT.md), [User guide có ảnh](docs/USER_GUIDE.md), [Admin guide](docs/ADMIN_GUIDE.md) và [Architecture](ARCHITECTURE.md).
