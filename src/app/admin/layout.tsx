import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/AdminSidebar/AdminSidebar';
import styles from './layout.module.scss';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/sign_in');

  // Проверяем роль admin в user_metadata или profiles
  const isAdmin = user.user_metadata?.role === 'admin' ||
    user.email === process.env.ADMIN_EMAIL;

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
