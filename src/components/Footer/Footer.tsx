'use client';

import Link from 'next/link';
import { Brain, Send, Rss, Globe } from 'lucide-react';
import styles from './Footer.module.scss';

export default function Footer() {
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
            <Link href="/course">Курс</Link>
            <Link href="/test">Тесты</Link>
            <Link href="/dashboard">Личный кабинет</Link>
          </div>

          <div className={styles.links}>
            <h4>Ресурсы</h4>
            <Link href="/sign_up">Регистрация</Link>
            <Link href="/sign_in">Вход</Link>
            <Link href="/certificate">Сертификат</Link>
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
