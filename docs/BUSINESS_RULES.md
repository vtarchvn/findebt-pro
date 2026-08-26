# Business rules

- Outstanding = tiền gốc − tổng phân bổ thuộc thanh toán còn hiệu lực.
- Trạng thái theo thứ tự: đã hủy; đã thanh toán; thanh toán một phần; quá hạn; chưa thanh toán.
- Dư khách hàng = đầu kỳ + bán nợ − thu đã phân bổ. Dư NCC tương tự cho mua nợ/trả nợ.
- Dòng tiền công nợ ròng = phải thu − phải trả.
- Tiền VND phải là số nguyên không âm; số giao dịch phải lớn hơn 0.
- Toàn bộ tiền thu/trả phải được phân bổ; phân bổ không được vượt outstanding và phải cùng khách hàng/nhà cung cấp, cùng loại công nợ.
- Không được hủy chứng từ khi còn phân bổ thuộc thanh toán đang hiệu lực. Muốn hủy chứng từ phải hủy thanh toán liên quan trước để giữ dấu vết đối ứng.
- Lời hẹn phải thuộc khách hàng/nhà cung cấp hợp lệ; nếu chọn chứng từ thì chứng từ phải cùng hồ sơ và số tiền hẹn không vượt dư còn lại.
- Mỗi workspace chỉ có một tài khoản ngân hàng mặc định. Số tài khoản được lưu dưới dạng chuỗi chữ số, không phải số dùng để tính toán.
- Ngày nghiệp vụ là ngày dân sự theo múi giờ `Asia/Ho_Chi_Minh`, không suy ra bằng ngày UTC.
- Client chỉ gửi ý định; server xác thực và tính lại mọi số liệu.
