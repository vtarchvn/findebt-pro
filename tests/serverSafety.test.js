import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(new URL('../src/server/index.js', import.meta.url), 'utf8');
const workspaceSource = fs.readFileSync(new URL('../src/infrastructure/workspace.js', import.meta.url), 'utf8');

describe('server safety contracts', () => {
  it('keeps Apps Script RPC compatible with embedded app browsers', () => expect(source).toContain('XFrameOptionsMode.ALLOWALL'));
  it('only includes the approved client bundle in HTML templates', () => {
    expect(source).toContain("if (filename !== 'Client')");
    expect(source).toContain('HtmlService.createHtmlOutputFromFile(filename).getContent()');
  });
  it('keeps session discovery independent from Sheet and Drive access', () => {
    expect(source).toContain('function getSessionContext() { return manager().session(); }');
    const sessionBody = workspaceSource.match(/session\(\) \{([\s\S]*?)\n {2}\}/)?.[1] || '';
    expect(sessionBody).not.toContain('SpreadsheetApp');
    expect(sessionBody).not.toContain('DriveApp');
  });
  it('whitelists exported tables before reading data', () => {
    expect(source).toContain("const EXPORT_TABLES = Object.freeze(['DOI_TUONG', 'CHUNG_TU_CONG_NO'])");
    expect(source).toContain('if (!EXPORT_TABLES.includes(table))');
  });
  it('restores sheets with their structure instead of values only', () => {
    expect(source).toContain('sourceSheet.copyTo(target)');
    expect(source).not.toContain('target.clear(); const values = sourceSheet.getDataRange().getValues()');
  });
});
