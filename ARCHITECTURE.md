# Architecture

FINDEBT dùng clean layering:

- `src/domain`: accounting core thuần JavaScript, không phụ thuộc Google APIs.
- `src/application`: use cases, validation, audit và orchestration.
- `src/infrastructure`: batch Sheet store, schema/migration.
- `src/server`: adapter cho Apps Script, Drive, Mail, triggers và RPC.
- `web`: single-page responsive UI; không quyết định số liệu tài chính.
- `gas`: top-level Apps Script entry points.

`esbuild` bundle server thành `dist/Bundle.js`; `Code.gs` giữ các hàm global mà Apps Script yêu cầu. User Properties lưu Spreadsheet ID riêng của người triển khai. Financial records chỉ được void/reverse; Audit Log lưu before/after.

ADR-001: Google Sheets là datastore để không cần server/database. ADR-002: tiền VND là safe integer. ADR-003: trạng thái/outstanding luôn được dựng lại từ chứng từ và phân bổ đang hiệu lực.
