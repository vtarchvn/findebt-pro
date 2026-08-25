export const ROLE_LEVEL = Object.freeze({ VIEWER: 1, ACCOUNTANT: 2, ADMIN: 3, OWNER: 4 });

export function normalizeEmail(value) { return String(value || '').trim().toLowerCase(); }

export function canAccess(actualRole, requiredRole) {
  return (ROLE_LEVEL[String(actualRole || '').toUpperCase()] || 0) >= (ROLE_LEVEL[String(requiredRole || '').toUpperCase()] || Number.POSITIVE_INFINITY);
}
