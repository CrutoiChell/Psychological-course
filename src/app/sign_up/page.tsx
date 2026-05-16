'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, AlertCircle } from 'lucide-react';
import { createClient, SUPABASE_ENV_ERROR } from '@/lib/supabase/client';
import Header from '@/components/Header/Header';
import styles from './page.module.scss';

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) router.replace('/dashboard');
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error(SUPABASE_ENV_ERROR);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (signUpError) throw signUpError;
      if (data.user) router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации');
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
                <UserPlus size={32} />
              </div>
              <h1>Начните сегодня</h1>
              <p>Создайте аккаунт и начните путь к восстановлению</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <div className={styles.error}>
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="name">Имя</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ваше имя"
                  className={styles.input}
                />
              </div>

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
                  minLength={6}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Подтвердите пароль</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  className={styles.input}
                />
              </div>

              <button type="submit" className={styles.btnSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    Регистрация...
                  </>
                ) : (
                  'Зарегистрироваться'
                )}
              </button>
            </form>

            <div className={styles.footer}>
              <p>
                Уже есть аккаунт?{' '}
                <Link href="/sign_in">Войти</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
