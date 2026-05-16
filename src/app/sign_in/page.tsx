'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { createClient, SUPABASE_ENV_ERROR } from '@/lib/supabase/client';
import Header from '@/components/Header/Header';
import styles from './page.module.scss';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      if (!supabase) throw new Error(SUPABASE_ENV_ERROR);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.authPage}>
        <div className={styles.authBackground}>
          <div className={styles.gradientOrb} />
          <div className={styles.gradientOrb2} />
        </div>

        <div className={styles.authContainer}>
          <div className={styles.authCard}>
            <div className={styles.authHeader}>
              <div className={styles.iconWrap}>
                <LogIn size={32} />
              </div>
              <h1>С возвращением!</h1>
              <p>Войдите в свой аккаунт</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <div className={styles.error}>
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password">Пароль</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={styles.input}
                />
              </div>

              <button type="submit" className={styles.btnSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    Вход...
                  </>
                ) : (
                  'Войти'
                )}
              </button>
            </form>

            <div className={styles.footer}>
              <p>
                Нет аккаунта?{' '}
                <Link href="/sign_up">Зарегистрироваться</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
