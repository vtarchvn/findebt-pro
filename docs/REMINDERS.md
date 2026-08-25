# Reminders

Mặc định chạy T−3, T, T+3, T+7, T+14, T+30, sau đó mỗi 7 ngày. Trigger chạy 08:00. Mỗi lần gửi kiểm tra lại outstanding, permission của đối tượng, email, lời hẹn và `Reminder_Key`; snapshot số tiền/nội dung được ghi vào `NHAC_NO` trước khi gửi. Trạng thái: `CHO_GUI`, `DA_GUI`, `DA_HUY`, `LOI`.

Apps Script quotas vẫn áp dụng; doanh nghiệp cần kiểm tra quota MailApp theo loại tài khoản Google.
