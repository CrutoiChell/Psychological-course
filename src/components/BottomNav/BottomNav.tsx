'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, BookOpen, ClipboardList, User } from 'lucide-react';
import styles from './BottomNav.module.scss';

const navItems = [
  { href: '/', icon: Home, label: 'Главная' },
  { href: '/course', icon: BookOpen, label: 'Курс' },
  { href: '/test', icon: ClipboardList, label: 'Тесты' },
  { href: '/dashboard', icon: User, label: 'Кабинет' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.bottomNav}>
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`${styles.navItem} ${active ? styles.active : ''}`}>
            <div className={styles.iconWrap}>
              <Icon size={22} />
              {active && <div className={styles.activeDot} />}
            </div>
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
