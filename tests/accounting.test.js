import { describe, expect, it } from 'vitest';
import { AGING_BUCKETS, DOC_STATUS, DOC_TYPES, agingBucket, creditLimitCheck, documentState, shouldSendReminder, summarize, validateAllocation, vietQrUrl } from '../src/domain/accounting.js';

const today = new Date('2026-08-25T00:00:00Z');
const invoice = { id: 'INV001', partnerId: 'KH001', type: DOC_TYPES.RECEIVABLE, originalAmount: 100_000_000, dueDate: '2026-07-11' };

describe('critical accounting journey', () => {
  it('uses remaining amount for aging, reminders and VietQR then stops after full payment', () => {
    const payments = [{ id: 'PAY1', partnerId: 'KH001', type: DOC_TYPES.RECEIVABLE, amount: 30_000_000 }];
    const allocations = [{ paymentId: 'PAY1', documentId: 'INV001', amount: 30_000_000 }];
    const partial = documentState(invoice, allocations, payments, today);
    expect(partial).toMatchObject({ outstanding: 70_000_000, status: DOC_STATUS.PARTIAL, bucket: AGING_BUCKETS.D31_60 });
    expect(summarize([invoice], allocations, payments, today).aging.QUA_HAN_31_60).toBe(70_000_000);
    expect(shouldSendReminder({ state: partial, reminderKey: 'INV001:T+30' })).toBe(true);
    expect(vietQrUrl({ bankCode: 'VCB', accountNumber: '123', accountName: 'CTY ABC' }, invoice, partial)).toContain('amount=70000000');
    payments.push({ id: 'PAY2', partnerId: 'KH001', type: DOC_TYPES.RECEIVABLE, amount: 70_000_000 });
    allocations.push({ paymentId: 'PAY2', documentId: 'INV001', amount: 70_000_000 });
    const paid = documentState(invoice, allocations, payments, today);
    expect(paid).toMatchObject({ outstanding: 0, status: DOC_STATUS.PAID, bucket: null });
    expect(shouldSendReminder({ state: paid, reminderKey: 'INV001:T+30' })).toBe(false);
    expect(vietQrUrl({ bankCode: 'VCB', accountNumber: '123', accountName: 'ABC' }, invoice, paid)).toBeNull();
  });
});

describe('allocation and safeguards', () => {
  it('supports one payment across invoices and many payments per invoice', () => {
    const docs = new Map([['A', { id: 'A', partnerId: 'P', type: DOC_TYPES.RECEIVABLE }], ['B', { id: 'B', partnerId: 'P', type: DOC_TYPES.RECEIVABLE }]]);
    expect(validateAllocation({ partnerId: 'P', type: DOC_TYPES.RECEIVABLE, amount: 100 }, [{ documentId: 'A', amount: 40 }, { documentId: 'B', amount: 60 }], docs)).toBe(100);
    expect(documentState({ ...invoice, originalAmount: 100 }, [{ paymentId: 'P1', documentId: 'INV001', amount: 30 }, { paymentId: 'P2', documentId: 'INV001', amount: 20 }], [{ id: 'P1' }, { id: 'P2' }], today).outstanding).toBe(50);
  });

  it('rejects over-allocation and invalid VND', () => {
    const docs = new Map([['A', { id: 'A', partnerId: 'P', type: DOC_TYPES.RECEIVABLE }]]);
    expect(() => validateAllocation({ partnerId: 'P', type: DOC_TYPES.RECEIVABLE, amount: 99 }, [{ documentId: 'A', amount: 100 }], docs)).toThrow('vượt');
    expect(() => documentState({ ...invoice, originalAmount: 1.2 }, [], [], today)).toThrow('số nguyên VND');
  });

  it('voids payment effect without hard delete', () => {
    const state = documentState({ ...invoice, originalAmount: 100 }, [{ paymentId: 'P1', documentId: 'INV001', amount: 100 }], [{ id: 'P1', voided: true }], today);
    expect(state.outstanding).toBe(100);
  });
});

describe('aging, credit and reminder rules', () => {
  it.each([['2026-08-25', AGING_BUCKETS.CURRENT], ['2026-08-24', AGING_BUCKETS.D1_30], ['2026-07-11', AGING_BUCKETS.D31_60], ['2026-06-01', AGING_BUCKETS.D60_PLUS]])('buckets %s', (date, bucket) => expect(agingBucket(date, today)).toBe(bucket));
  it('detects exceeded credit', () => expect(creditLimitCheck(80, 30, 100)).toMatchObject({ projectedDebt: 110, exceededBy: 10, exceeded: true }));
  it('prevents duplicate reminders and pauses for promise-to-pay', () => {
    const state = { outstanding: 70, status: DOC_STATUS.OVERDUE };
    expect(shouldSendReminder({ state, reminderKey: 'x', sentKeys: new Set(['x']), today })).toBe(false);
    expect(shouldSendReminder({ state, reminderKey: 'y', promiseUntil: '2026-08-26', today })).toBe(false);
  });
});
