'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { gsap } from 'gsap';
import { createClient } from '@/lib/supabase/client';
import { lessons } from '@/data/lessons';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import styles from './page.module.scss';

export default function CoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/sign_in'); return; }
    setLoading(false);

    // GSAP анимация после загрузки
    setTimeout(() => {
      gsap.fromTo('[data-animate]',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }, 50);
  };

  if (loading) return null;

  const modules = lessons.reduce((acc, lesson) => {
    const n = lesson.moduleNumber;
    if (!acc[n]) acc[n] = { number: n, title: lesson.module, lessons: [] };
    acc[n].lessons.push(lesson);
    return acc;
  }, {} as Record<number, { number: number; title: string; lessons: typeof lessons }>);

  return (
    <>
      <Header />
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.pageHeader}>
            <h1>Курс по психологии кризиса</h1>
            <p>Пройдите все уроки и получите сертификат</p>
          </div>

          <div className={styles.modules}>
            {Object.values(modules).map((module, mi) => (
              <div key={module.number} className={styles.module} data-animate data-delay={`${mi * 0.1}`}>
                <div className={styles.moduleHeader}>
                  <div className={styles.moduleNumber}>{module.number}</div>
                  <h2 className={styles.moduleTitle}>{module.title}</h2>
                </div>
                <div className={styles.lessons}>
                  {module.lessons.map((lesson) => (
                    <Link key={lesson.id} href={`/lesson/${lesson.id}`} className={styles.lessonLink}>
                      <div className={styles.lessonLeft}>
                        <div className={styles.lessonNumber}>{lesson.id}</div>
                        <div className={styles.lessonTitle}>{lesson.title}</div>
                      </div>
                      <ChevronRight size={20} className={styles.arrow} />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Link href="/dashboard" className={styles.backLink}>
            <ArrowLeft size={18} /> Вернуться в кабинет
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
