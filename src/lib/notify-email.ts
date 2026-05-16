/**
 * Куда слать уведомления о заявках (Resend).
 * ADMIN_NOTIFY_EMAIL — приоритет (можно несколько через запятую).
 * Иначе fallback на ADMIN_EMAIL.
 */
const DEFAULT_NOTIFY_EMAIL = 'alexeikir@mail.ru';

export function getAdminNotifyRecipients(): string[] {
  const raw =
    process.env.ADMIN_NOTIFY_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    DEFAULT_NOTIFY_EMAIL;

  const emails = raw
    .split(/[,;]/)
    .map(e => e.trim().toLowerCase())
    .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  return emails.length > 0 ? [...new Set(emails)] : [DEFAULT_NOTIFY_EMAIL];
}

export function getPrimaryNotifyEmail(): string {
  return getAdminNotifyRecipients()[0];
}
