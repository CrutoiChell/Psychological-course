'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Brain, Send, Rss, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './Footer.module.scss';

export default function Footer() {
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <Brain size={28} className={styles.logoIcon} />
              <span className={styles.logoText}>Психология кризиса</span>
            </div>
            <p className={styles.description}>
              Онлайн-платформа для преодоления эмоционального выгорания
              и восстановления баланса в жизни.
            </p>
          </div>

          <div className={styles.links}>
            <h4>Навигация</h4>
            <Link href="/">Главная</Link>
            <Link href={user ? '/course' : '/sign_in'}>Курс</Link>
            <Link href={user ? '/test' : '/sign_in'}>Тесты</Link>
            <Link href={user ? '/dashboard' : '/sign_in'}>Личный кабинет</Link>
          </div>

          <div className={styles.links}>
            <h4>Ресурсы</h4>
            {user ? (
              <>
                <Link href="/dashboard">Мой кабинет</Link>
                <Link href="/certificate">Сертификат</Link>
              </>
            ) : (
              <>
                <Link href="/sign_up">Регистрация</Link>
                <Link href="/sign_in">Вход</Link>
              </>
            )}
          </div>

          <div className={styles.links}>
            <h4>Контакты</h4>
            <a href="mailto:support@example.com">support@example.com</a>
            <a href="tel:+1234567890">+1 (234) 567-890</a>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>&copy; 2026 Психология кризиса. Все права защищены.</p>
          <div className={styles.social}>
            <a href="https://t.me/" target="_blank" rel="noopener noreferrer" aria-label="Telegram"><Send size={18} /></a>
            <a href="https://vk.com/" target="_blank" rel="noopener noreferrer" aria-label="VK"><Globe size={18} /></a>
            <a href="mailto:support@example.com" aria-label="Email"><Rss size={18} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
