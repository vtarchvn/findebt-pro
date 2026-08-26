import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('web inline action bindings', () => {
  it('only references declared handler functions', () => {
    const source = fs.readFileSync(new URL('../web/Index.html', import.meta.url), 'utf8');
    const declared = new Set([...source.matchAll(/(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(match => match[1]));
    const attributes = [...source.matchAll(/(?:onclick|onchange)=["']([^"']*)["']/g)].map(match => match[1]);
    const handlers = new Set(attributes.flatMap(value => [...value.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g)].map(match => match[1])));
    const browserBuiltins = new Set(['if', 'confirm']);
    expect([...handlers].filter(name => !declared.has(name) && !browserBuiltins.has(name))).toEqual([]);
  });

  it('keeps native form controls readable in both color schemes', () => {
    const source = fs.readFileSync(new URL('../web/Index.html', import.meta.url), 'utf8');
    expect(source).toContain('html[data-theme=dark]{color-scheme:dark}');
    expect(source).toContain('html[data-theme=light]{color-scheme:light}');
    expect(source).toContain('html[data-theme=dark] select,html[data-theme=dark] option');
    expect(source).toContain('html[data-theme=light] select,html[data-theme=light] option');
  });

  it('handles payment forms with no available document', () => {
    const source = fs.readFileSync(new URL('../web/Index.html', import.meta.url), 'utf8');
    expect(source).toContain('payment-unavailable');
    expect(source).toContain("if(!doc||!doc.value){toast('Chưa có chứng từ còn dư để thanh toán'");
    expect(source).toContain('function syncPaymentDocument()');
  });

  it('announces asynchronous toast feedback to assistive technology', () => {
    const source = fs.readFileSync(new URL('../web/Index.html', import.meta.url), 'utf8');
    expect(source).toContain('id="toast-stack" class="toast-stack" role="status" aria-live="polite"');
  });

  it('publishes verified author and optional coffee support details', () => {
    const source = fs.readFileSync(new URL('../web/Index.html', import.meta.url), 'utf8');
    expect(source).toContain("name:'Nguyễn Văn Thanh (VTARCH)'");
    expect(source).toContain("website:'https://vtarch.vercel.app/'");
    expect(source).toContain("account:'36500766889999'");
    expect(source).toContain('Mời tôi một ly cà phê');
    expect(source).toContain('function supportQrUrl()');
  });

  it('provides an accessible mobile navigation sheet with persistent route state', () => {
    const source = fs.readFileSync(new URL('../web/Index.html', import.meta.url), 'utf8');
    expect(source).toContain('id="mobile-more-btn"');
    expect(source).toContain('aria-haspopup="dialog"');
    expect(source).toContain('mobile-menu-sheet');
    expect(source).toContain("secondary=['payments','reports','settings','about'].includes(page)");
    expect(source).toContain("more.setAttribute('aria-expanded','false')");
  });

  it('links product support to the canonical GitHub user guide', () => {
    const source = fs.readFileSync(new URL('../web/Index.html', import.meta.url), 'utf8');
    expect(source).toContain("guide:'https://github.com/vtarchvn/findebt-pro/blob/main/docs/USER_GUIDE.md'");
    expect(source).toContain('class="support-guide"');
  });

  it('embeds the app logo in both static and dynamic Apps Script output', () => {
    const build = fs.readFileSync(new URL('../scripts/build.mjs', import.meta.url), 'utf8');
    expect(build).toContain('const indexHtml = embedAppLogo(compatibleTemplate)');
    expect(build).toContain('const clientScript = embedAppLogo(transpiled.code)');
    expect(build).toContain('clientScript.includes(appLogoPath)');
  });

  it('uses the proven staged startup flow', () => {
    const source = fs.readFileSync(new URL('../web/Index.html', import.meta.url), 'utf8');
    expect(source).toContain("const session=await rpc('getSessionContext')");
    expect(source).toContain("state=await rpc('bootstrap')");
    expect(source).not.toContain("await rpc('bootstrapSession')");
  });

  it('does not let blocked browser storage stop client startup', () => {
    const source = fs.readFileSync(new URL('../web/Index.html', import.meta.url), 'utf8');
    expect(source).toContain('function storageGet(key){try{');
    expect(source).toContain('function bootClient(){try{');
    expect(source).toContain('catch(error){showClientStartupError(error)}');
    expect(source).not.toContain("localStorage.removeItem('findebt-debt-view')");
  });

  it('installs a minimal startup canary before the main application script', () => {
    const source = fs.readFileSync(new URL('../web/Index.html', import.meta.url), 'utf8');
    expect(source).toContain("status.textContent='Mã nền đã chạy. Đang nạp ứng dụng…'");
    expect(source).toContain("report('mã ứng dụng chính không phản hồi sau 8 giây')");
    expect(source.indexOf("status.textContent='Mã nền đã chạy. Đang nạp ứng dụng…'")).toBeLessThan(source.indexOf('const icons='));
  });
});
