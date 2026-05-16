import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/AdminSidebar/AdminSidebar';
import styles from './layout.module.scss';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/sign_in');

  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdminByRole = user.user_metadata?.role === 'admin';
  const isAdminByEmail = Boolean(
    user.email &&
    adminEmail &&
    user.email.toLowerCase() === adminEmail.toLowerCase()
  );
  const isAdmin = isAdminByRole || isAdminByEmail;

  if (!isAdmin) redirect('/dashboard');

  const missingEnv: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingEnv.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingEnv.push('SUPABASE_SERVICE_ROLE_KEY');

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />
      <main className={styles.adminMain}>
        {missingEnv.length > 0 && (
          <div style={{
            margin: '0 0 1rem',
            padding: '0.875rem 1rem',
            background: 'rgba(251,191,36,0.12)',
            border: '1px solid rgba(251,191,36,0.4)',
            color: '#fde68a',
            borderRadius: 10,
            fontSize: '0.9rem',
          }}>
            <strong>Админка работает в ограниченном режиме.</strong>
            <div style={{ marginTop: 6 }}>
              Не заданы переменные окружения: <code>{missingEnv.join(', ')}</code>. Добавьте их в Vercel → Settings → Environment Variables и сделайте Redeploy.
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
