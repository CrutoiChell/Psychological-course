/** Куда всегда уходят уведомления о заявках (зашито в код, не из env). */
export const APPLICATION_NOTIFY_EMAIL = 'alexeikir@mail.ru';

export function getAdminNotifyRecipients(): string[] {
  return [APPLICATION_NOTIFY_EMAIL];
}

export function getPrimaryNotifyEmail(): string {
  return APPLICATION_NOTIFY_EMAIL;
}
