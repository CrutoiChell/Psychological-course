import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminNotifyRecipients } from '@/lib/notify-email';
import DebugButtons from './DebugButtons';
import styles from '../page.module.scss';

async function getDiagnostics() {
  const out: Record<string, any> = {};

  const supabase = await createClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  out.session = userErr
    ? `ошибка: ${userErr.message}`
    : user
      ? { email: user.email, id: user.id, role: user.user_metadata?.role ?? '(нет)' }
      : '(не залогинен)';

  out.env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? '(не задан)',
    NEXT_PUBLIC_ADMIN_EMAIL: process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '(не задан)',
    ADMIN_NOTIFY_EMAIL_raw: process.env.ADMIN_NOTIFY_EMAIL ?? '(не задан)',
    notify_recipients_resolved: getAdminNotifyRecipients(),
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'OK' : 'MISSING',
  };

  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  out.isAdmin = user
    ? user.user_metadata?.role === 'admin' ||
      (Boolean(user.email) && Boolean(adminEmail) && user.email!.toLowerCase() === adminEmail!.toLowerCase())
    : false;

  try {
    const admin = createAdminClient();
    const tables = ['lessons_content', 'tests_content', 'tips_content', 'applications', 'user_progress', 'test_results', 'ratings'] as const;
    const counts: Record<string, any> = {};
    for (const t of tables) {
      const { count, error } = await admin.from(t).select('*', { count: 'exact', head: true });
      counts[t] = error ? `ОШИБКА: ${error.message}` : (count ?? 0);
    }
    out.tables = counts;
  } catch (e: any) {
    out.tables = `Не удалось создать admin client: ${e.message}`;
  }

  return out;
}

export default async function DebugPage() {
  const data = await getDiagnostics();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Диагностика админки</h1>
        <p>Если что-то выглядит не так — проблема в этой строке.</p>
      </div>

      <pre style={{
        background: 'var(--bg-secondary)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '0.75rem',
        padding: '1rem',
        color: 'var(--text-heading)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontSize: '0.85rem',
        lineHeight: 1.5,
      }}>
        {JSON.stringify(data, null, 2)}
      </pre>

      <DebugButtons />
    </div>
  );
}
