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

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />
      <main className={styles.adminMain}>
        {children}
      </main>
    </div>
  );
}
