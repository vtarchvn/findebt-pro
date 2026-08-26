import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(root, 'docs');
const guidePath = path.join(docsDir, 'USER_GUIDE.md');
const imageDir = path.join(docsDir, 'images', 'user-guide');

describe('user guide assets', () => {
  it('keeps every local guide image resolvable from the markdown file', () => {
    const markdownFiles = fs.readdirSync(docsDir).filter(name => name.endsWith('.md'));
    const references = markdownFiles.flatMap(name => {
      const filePath = path.join(docsDir, name);
      const source = fs.readFileSync(filePath, 'utf8');
      return [...source.matchAll(/!\[[^\]]*\]\((?!https?:\/\/)([^)]+)\)/g)].map(match => ({ filePath, relativePath: match[1] }));
    });
    references.forEach(({ filePath, relativePath }) => {
      expect(fs.existsSync(path.resolve(path.dirname(filePath), relativePath)), relativePath).toBe(true);
    });
    const referencedNames = new Set(references.filter(item => item.relativePath.includes('images/user-guide/')).map(item => path.basename(item.relativePath)));
    const storedNames = fs.readdirSync(imageDir).filter(name => name.endsWith('.png'));
    expect(storedNames.sort()).toEqual([...referencedNames].sort());
  });

  it('documents current visual examples and the mobile navigation model', () => {
    const source = fs.readFileSync(guidePath, 'utf8');
    [
      '01-dashboard.png',
      '08-reports.png',
      '08a-payment-notice.png',
      '08b-reconciliation.png'
    ].forEach(image => expect(source).toContain(image));
    ['02-partners.png', '04-debts.png', '09-settings.png', '10-mobile-dashboard.png'].forEach(image => expect(source).not.toContain(image));
    expect(source).toContain('FINDEBT PRO 2.8.1');
    expect(source).toContain('deployment `@42`');
    expect(source).toContain('| Đối tác | Báo cáo & dữ liệu |');
  });

  it('keeps deployment and schema documentation aligned with production', () => {
    const admin = fs.readFileSync(path.join(docsDir, 'ADMIN_GUIDE.md'), 'utf8');
    const schema = fs.readFileSync(path.join(docsDir, 'DATABASE_SCHEMA.md'), 'utf8');
    expect(admin).toContain('schema version 4');
    expect(admin).toContain('clasp deploy -i AKfycbzPM');
    expect(admin).toContain('npm run smoke:production');
    expect(schema).toContain('Schema version 4');
  });
});
