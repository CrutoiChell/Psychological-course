'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, LogOut, User, LayoutDashboard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './Header.module.scss';

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Используем getSession вместо getUser — не требует сетевого запроса и не конкурирует за lock
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      const u = session?.user;
      if (u) {
        const admin = u.user_metadata?.role === 'admin' || u.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        setIsAdmin(admin);
      }
    });

    // Слушаем изменения сессии
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      const u = session?.user;
      if (u) {
        const admin = u.user_metadata?.role === 'admin' || u.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        setIsAdmin(admin);
      } else {
        setIsAdmin(false);
      }
    });

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Brain size={28} className={styles.logoIcon} />
          <span className={styles.logoText}>Психология кризиса</span>
        </Link>

        <nav className={styles.nav}>
          <Link href="/" className={pathname === '/' ? styles.active : ''}>Главная</Link>
          <Link href="/course" className={pathname === '/course' ? styles.active : ''}>Курс</Link>
          <Link href="/test" className={pathname.startsWith('/test') ? styles.active : ''}>Тесты</Link>
          {user && (
            <Link href="/dashboard" className={pathname === '/dashboard' ? styles.active : ''}>Кабинет</Link>
          )}
        </nav>

        <div className={styles.actions}>
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin" className={styles.btnAdmin}>
                  <LayoutDashboard size={15} />
                  Админ
                </Link>
              )}
              <Link href="/dashboard" className={styles.btnSecondary}>
                <User size={16} />
                Профиль
              </Link>
              <button onClick={handleSignOut} className={styles.btnPrimary}>
                <LogOut size={16} />
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link href="/sign_in" className={styles.btnSecondary}>Войти</Link>
              <Link href="/sign_up" className={styles.btnPrimary}>Начать</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
