'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, ClipboardList, Lightbulb,
  FlaskConical, ArrowLeft, Brain, BookOpen
} from 'lucide-react';
import styles from './AdminSidebar.module.scss';

const navItems = [
  { section: 'Обзор' },
  { href: '/admin', icon: LayoutDashboard, label: 'Дашборд', exact: true },
  { section: 'Управление' },
  { href: '/admin/applications', icon: ClipboardList, label: 'Заявки' },
  { href: '/admin/users', icon: Users, label: 'Пользователи' },
  { section: 'Контент' },
  { href: '/admin/lessons', icon: BookOpen, label: 'Уроки' },
  { href: '/admin/tips', icon: Lightbulb, label: 'Советы дня' },
  { href: '/admin/tests', icon: FlaskConical, label: 'Тесты' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <Link href="/admin" className={styles.logo}>
        <Brain size={24} className={styles.logoIcon} />
        <div className={styles.logoText}>
          Админ-панель
          <span>Психология кризиса</span>
        </div>
      </Link>

      <nav className={styles.nav}>
        {navItems.map((item, i) => {
          if ('section' in item) {
            return <div key={i} className={styles.navSection}>{item.section}</div>;
          }
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href!);
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`${styles.navItem} ${active ? styles.active : ''}`}
            >
              <item.icon size={18} className={styles.navIcon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={18} />
          На сайт
        </Link>
      </div>
    </aside>
  );
}
