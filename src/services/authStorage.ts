import type { CsrfToken } from '@/types/auth';

// Authentication is held by the server's HttpOnly session cookie, never JS storage.
// Only the short-lived CSRF request token is cached in memory.
let csrfToken: CsrfToken | null = null;

export const authStorage = {
  getCsrfToken: () => csrfToken,
  setCsrfToken: (token: CsrfToken) => { csrfToken = token; },
  clear: () => { csrfToken = null; },
};
