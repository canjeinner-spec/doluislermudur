/**
 * Sign-up / sign-in is limited to well-known personal email providers. This
 * keeps out throwaway, nonsense or made-up domains ("random kafalarına göre"
 * kayıtlar). It's a client-side gate for the MVP; a Supabase "before user
 * created" auth hook can enforce the same list server-side later.
 *
 * To allow more providers, just add their domain here.
 */
export const ALLOWED_EMAIL_DOMAINS = new Set<string>([
  // Google
  'gmail.com', 'googlemail.com',
  // Microsoft
  'outlook.com', 'outlook.com.tr', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'live.com.tr', 'msn.com',
  // Apple
  'icloud.com', 'me.com', 'mac.com',
  // Yahoo
  'yahoo.com', 'yahoo.co.uk', 'ymail.com',
  // Proton
  'proton.me', 'protonmail.com',
  // Yandex
  'yandex.com', 'yandex.com.tr', 'yandex.ru',
  // Other mainstream
  'aol.com', 'gmx.com', 'gmx.net', 'zoho.com',
]);

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Validate an email's shape and that it belongs to an allowed provider. */
export function checkEmailPolicy(raw: string): { ok: boolean; reason?: string } {
  const email = raw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, reason: 'Geçerli bir e-posta gir.' };
  }
  const domain = email.slice(email.lastIndexOf('@') + 1);
  if (!ALLOWED_EMAIL_DOMAINS.has(domain)) {
    return {
      ok: false,
      reason: 'Yalnızca bilinen sağlayıcılar kabul ediliyor (Gmail, Outlook, iCloud, Yahoo…).',
    };
  }
  return { ok: true };
}
