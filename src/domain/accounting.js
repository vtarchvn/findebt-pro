export const DOC_TYPES = Object.freeze({ RECEIVABLE: 'PHAI_THU', PAYABLE: 'PHAI_TRA' });
export const DOC_STATUS = Object.freeze({ PAID: 'DA_THANH_TOAN', PARTIAL: 'THANH_TOAN_MOT_PHAN', OVERDUE: 'QUA_HAN', OPEN: 'CHUA_THANH_TOAN', VOID: 'DA_HUY' });
export const AGING_BUCKETS = Object.freeze({ CURRENT: 'TRONG_HAN', D1_30: 'QUA_HAN_1_30', D31_60: 'QUA_HAN_31_60', D60_PLUS: 'QUA_HAN_TREN_60' });

export function assertVnd(value, field = 'Số tiền') {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || !Number.isInteger(number)) throw new Error(`${field} phải là số nguyên VND không âm`);
  return number;
}

export function allocatedForDocument(documentId, allocations, activePayments = null) {
  return allocations.filter(a => a.documentId === documentId && !a.voided && (!activePayments || activePayments.has(a.paymentId))).reduce((sum, a) => sum + assertVnd(a.amount, 'Tiền phân bổ'), 0);
}

export function outstanding(document, allocations, payments = []) {
  if (document.voided) return 0;
  const active = payments.length ? new Set(payments.filter(p => !p.voided).map(p => p.id)) : null;
  return Math.max(0, assertVnd(document.originalAmount, 'Tiền chứng từ') - allocatedForDocument(document.id, allocations, active));
}

export function daysOverdue(dueDate, today = new Date()) {
  const due = toDay(dueDate); const now = toDay(today);
  return Math.max(0, Math.floor((now - due) / 86400000));
}

export function agingBucket(dueDate, today = new Date()) {
  const days = daysOverdue(dueDate, today);
  if (toDay(dueDate) >= toDay(today)) return AGING_BUCKETS.CURRENT;
  if (days <= 30) return AGING_BUCKETS.D1_30;
  if (days <= 60) return AGING_BUCKETS.D31_60;
  return AGING_BUCKETS.D60_PLUS;
}

export function documentState(document, allocations, payments = [], today = new Date()) {
  if (document.voided) return { outstanding: 0, status: DOC_STATUS.VOID, bucket: null, daysOverdue: 0 };
  const due = outstanding(document, allocations, payments);
  const allocated = assertVnd(document.originalAmount) - due;
  const lateDays = daysOverdue(document.dueDate, today);
  const status = due === 0 ? DOC_STATUS.PAID : allocated > 0 ? DOC_STATUS.PARTIAL : lateDays > 0 ? DOC_STATUS.OVERDUE : DOC_STATUS.OPEN;
  return { outstanding: due, status, bucket: due > 0 ? agingBucket(document.dueDate, today) : null, daysOverdue: lateDays };
}

export function validateAllocation(payment, allocations, documentMap) {
  if (!payment || payment.voided) throw new Error('Thanh toán không hợp lệ hoặc đã hủy');
  const total = allocations.reduce((sum, allocation) => {
    const doc = documentMap.get(allocation.documentId);
    if (!doc || doc.voided) throw new Error(`Chứng từ ${allocation.documentId} không hợp lệ`);
    if (doc.partnerId !== payment.partnerId || doc.type !== payment.type) throw new Error('Thanh toán và chứng từ không cùng đối tượng/loại công nợ');
    return sum + assertVnd(allocation.amount, 'Tiền phân bổ');
  }, 0);
  const paymentAmount = assertVnd(payment.amount, 'Tiền thanh toán');
  if (total > paymentAmount) throw new Error('Tổng phân bổ vượt số tiền thanh toán');
  if (total < paymentAmount) throw new Error('Toàn bộ số tiền thanh toán phải được phân bổ vào chứng từ');
  return total;
}

export function creditLimitCheck(currentDebt, newCredit, limit) {
  const current = assertVnd(currentDebt, 'Dư nợ hiện tại');
  const transaction = assertVnd(newCredit, 'Giao dịch mới');
  const ceiling = assertVnd(limit, 'Hạn mức');
  const projected = current + transaction;
  return { limit: ceiling, currentDebt: current, transaction, projectedDebt: projected, exceededBy: Math.max(0, projected - ceiling), exceeded: projected > ceiling };
}

export function summarize(documents, allocations, payments, today = new Date()) {
  const aging = Object.fromEntries(Object.values(AGING_BUCKETS).map(k => [k, 0]));
  const activePayments = new Set(payments.filter(payment => !payment.voided).map(payment => payment.id));
  const allocatedByDocument = new Map();
  allocations.forEach(allocation => {
    if (allocation.voided || !activePayments.has(allocation.paymentId)) return;
    allocatedByDocument.set(allocation.documentId, (allocatedByDocument.get(allocation.documentId) || 0) + assertVnd(allocation.amount, 'Tiền phân bổ'));
  });
  let receivable = 0; let payable = 0; let overdue = 0;
  const rows = documents.map(document => {
    const state = documentStateFromAllocated(document, allocatedByDocument.get(document.id) || 0, today);
    if (state.outstanding && state.bucket) aging[state.bucket] += state.outstanding;
    if (document.type === DOC_TYPES.RECEIVABLE) receivable += state.outstanding;
    if (document.type === DOC_TYPES.PAYABLE) payable += state.outstanding;
    if (state.daysOverdue > 0) overdue += state.outstanding;
    return { ...document, ...state };
  });
  return { receivable, payable, net: receivable - payable, overdue, aging, rows };
}

export function shouldSendReminder({ state, reminderKey, sentKeys = new Set(), promiseUntil = null, today = new Date() }) {
  if (!state || state.outstanding <= 0 || state.status === DOC_STATUS.PAID || sentKeys.has(reminderKey)) return false;
  if (promiseUntil && toDay(promiseUntil) >= toDay(today)) return false;
  return true;
}

export function vietQrUrl(account, document, state) {
  if (!state || state.outstanding <= 0 || document.type !== DOC_TYPES.RECEIVABLE) return null;
  if (!account?.bankCode || !account?.accountNumber || !account?.accountName) throw new Error('Tài khoản ngân hàng chưa đầy đủ');
  const info = `FIN ${document.partnerId} ${document.id}`.slice(0, 50);
  return `https://img.vietqr.io/image/${encodeURIComponent(account.bankCode)}-${encodeURIComponent(account.accountNumber)}-compact2.png?amount=${state.outstanding}&addInfo=${encodeURIComponent(info)}&accountName=${encodeURIComponent(account.accountName)}`;
}

export function civilDateKey(value) {
  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Ngày không hợp lệ');
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function toDay(value) {
  const [year, month, date] = civilDateKey(value).split('-').map(Number);
  return Date.UTC(year, month - 1, date);
}

function documentStateFromAllocated(document, allocatedAmount, today) {
  if (document.voided) return { outstanding: 0, status: DOC_STATUS.VOID, bucket: null, daysOverdue: 0 };
  const original = assertVnd(document.originalAmount, 'Tiền chứng từ');
  const allocated = Math.min(original, assertVnd(allocatedAmount, 'Tiền phân bổ'));
  const due = original - allocated;
  const lateDays = daysOverdue(document.dueDate, today);
  const status = due === 0 ? DOC_STATUS.PAID : allocated > 0 ? DOC_STATUS.PARTIAL : lateDays > 0 ? DOC_STATUS.OVERDUE : DOC_STATUS.OPEN;
  return { outstanding: due, status, bucket: due > 0 ? agingBucket(document.dueDate, today) : null, daysOverdue: lateDays };
}
