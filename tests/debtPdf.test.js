import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const server = fs.readFileSync(new URL('../src/server/index.js', import.meta.url), 'utf8');
const gas = fs.readFileSync(new URL('../gas/Code.gs', import.meta.url), 'utf8');
const web = fs.readFileSync(new URL('../web/Index.html', import.meta.url), 'utf8');

describe('debt PDF document types', () => {
  it('supports payment notices and reconciliation statements', () => {
    expect(server).toContain("['PAYMENT_NOTICE', 'RECONCILIATION']");
    expect(server).toContain('paymentNoticeTitle');
    expect(server).toContain('BIÊN BẢN ĐỐI CHIẾU CÔNG NỢ');
    expect(server).toContain('appendPaymentInstructions');
    expect(server).toContain('reconciliationBalanceLabel');
  });

  it('passes the selected document type through the Apps Script wrapper', () => {
    expect(gas).toContain('generateDebtPdf(partnerId, documentType)');
    expect(gas).toContain('FinDebtApp.generateDebtPdf(partnerId, documentType)');
  });

  it('offers both documents as explicit user actions', () => {
    expect(web).toContain("makePdf('PAYMENT_NOTICE')");
    expect(web).toContain("makePdf('RECONCILIATION')");
    expect(web).toContain('Mẫu PDF dùng để gửi và ký xác nhận');
  });

  it('uses the editable company profile and logo in generated documents', () => {
    expect(server).toContain('appendDocumentHeader');
    expect(server).toContain('config.LOGO_FILE_ID');
    expect(server).toContain('DIA_CHI_DOANH_NGHIEP');
    expect(gas).toContain('saveCompanyProfile(input)');
    expect(web).toContain('Hồ sơ doanh nghiệp');
    expect(web).toContain('saveCompanyProfileUi');
  });
});
