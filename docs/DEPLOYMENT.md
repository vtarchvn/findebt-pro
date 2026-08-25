# Deployment

## Bootstrap thủ công một lần

Tạo Apps Script project, lấy Script ID, `npm install`, `npm run setup`, cập nhật `.clasp.json`, chạy `npx clasp login`, rồi `npm run push`. Deploy Web App với **Execute as: User accessing the web app**. Lần mở đầu cần chấp thuận OAuth; FINDEBT chỉ tạo Google Sheet/cây Drive sau khi người dùng chọn **Tạo workspace mới**.

Không phát hành bản nhiều người với `USER_DEPLOYING`: cấu hình đó làm mọi Drive/Sheet call chạy dưới danh tính chủ deployment và có thể biến dữ liệu thành kho dùng chung ngoài ý muốn.

## GitHub Actions

CI luôn lint/test/build. CD là workflow thủ công và cần secrets `CLASP_JSON` (scriptId/rootDir) và `CLASPRC_JSON` (OAuth clasp). Không đặt secrets trong repo. Mỗi lần deploy Apps Script tạo version mới; kiểm tra URL deployment sau khi chạy.
