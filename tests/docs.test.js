import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const guidePath = path.join(root, 'docs', 'USER_GUIDE.md');

describe('user guide assets', () => {
  it('keeps every local guide image resolvable from the markdown file', () => {
    const source = fs.readFileSync(guidePath, 'utf8');
    const localImages = [...source.matchAll(/!\[[^\]]*\]\((?!https?:\/\/)([^)]+)\)/g)].map(match => match[1]);
    expect(localImages.length).toBeGreaterThanOrEqual(13);
    localImages.forEach(relativePath => {
      expect(fs.existsSync(path.resolve(path.dirname(guidePath), relativePath)), relativePath).toBe(true);
    });
  });

  it('documents the refreshed dashboard, data center, PDFs and mobile view', () => {
    const source = fs.readFileSync(guidePath, 'utf8');
    [
      '01-dashboard.png',
      '08-reports.png',
      '08a-payment-notice.png',
      '08b-reconciliation.png',
      '10-mobile-dashboard.png'
    ].forEach(image => expect(source).toContain(image));
    expect(source).toContain('FINDEBT PRO 2.8.1');
    expect(source).toContain('deployment `@42`');
  });
});
