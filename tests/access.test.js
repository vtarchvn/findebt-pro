import { describe, expect, it } from 'vitest';
import { canAccess, normalizeEmail } from '../src/domain/access.js';

describe('workspace access policy', () => {
  it('normalizes Google account email', () => expect(normalizeEmail('  Owner@Example.COM ')).toBe('owner@example.com'));
  it('allows viewers to read only', () => { expect(canAccess('VIEWER', 'VIEWER')).toBe(true); expect(canAccess('VIEWER', 'ACCOUNTANT')).toBe(false); });
  it('allows accountants to write financial data but not administer', () => { expect(canAccess('ACCOUNTANT', 'VIEWER')).toBe(true); expect(canAccess('ACCOUNTANT', 'ACCOUNTANT')).toBe(true); expect(canAccess('ACCOUNTANT', 'ADMIN')).toBe(false); });
  it('allows admins below owner authority', () => { expect(canAccess('ADMIN', 'ACCOUNTANT')).toBe(true); expect(canAccess('ADMIN', 'OWNER')).toBe(false); });
  it('allows owner operations', () => expect(canAccess('OWNER', 'OWNER')).toBe(true));
  it('fails closed for unknown roles', () => { expect(canAccess('UNKNOWN', 'VIEWER')).toBe(false); expect(canAccess('OWNER', 'UNKNOWN')).toBe(false); });
});
