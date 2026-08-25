# Deployment

## Bootstrap thủ công một lần

Tạo Apps Script project, lấy Script ID, `npm install`, `npm run setup`, cập nhật `.clasp.json`, chạy `npx clasp login`, rồi `npm run push`. Deploy Web App trong Apps Script. Lần mở đầu cần chấp thuận OAuth; FINDEBT tự tạo Google Sheet và folder Drive khi cần.

## GitHub Actions

CI luôn lint/test/build. CD là workflow thủ công và cần secrets `CLASP_JSON` (scriptId/rootDir) và `CLASPRC_JSON` (OAuth clasp). Không đặt secrets trong repo. Mỗi lần deploy Apps Script tạo version mới; kiểm tra URL deployment sau khi chạy.
