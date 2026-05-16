'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { gsap } from 'gsap';
import type { Lesson } from '@/data/lessons';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import styles from './page.module.scss';

export default function CourseClient({ lessons, completedIds = [] }: { lessons: Lesson[]; completedIds?: string[] }) {
  const completedSet = new Set(completedIds);

  useEffect(() => {
    const t = setTimeout(() => {
      gsap.fromTo('[data-animate]',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }, 50);
    return () => clearTimeout(t);
  }, []);

  const modules = lessons.reduce((acc, lesson) => {
    const n = lesson.moduleNumber;
    if (!acc[n]) acc[n] = { number: n, title: lesson.module, lessons: [] };
    acc[n].lessons.push(lesson);
    return acc;
  }, {} as Record<number, { number: number; title: string; lessons: Lesson[] }>);

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
            {Object.values(modules).map((module, mi) => {
              const moduleDone = module.lessons.length > 0 && module.lessons.every(l => completedSet.has(l.id));
              return (
                <div
                  key={module.number}
                  className={`${styles.module} ${moduleDone ? styles.moduleCompleted : ''}`}
                  data-animate
                  data-delay={`${mi * 0.1}`}
                >
                  <div className={styles.moduleHeader}>
                    <div className={styles.moduleNumber}>{module.number}</div>
                    <h2 className={styles.moduleTitle}>{module.title}</h2>
                    {moduleDone && <CheckCircle size={22} className={styles.moduleCheck} />}
                  </div>
                  <div className={styles.lessons}>
                    {module.lessons.map((lesson) => {
                      const done = completedSet.has(lesson.id);
                      return (
                        <Link
                          key={lesson.id}
                          href={`/lesson/${lesson.id}`}
                          className={`${styles.lessonLink} ${done ? styles.lessonCompleted : ''}`}
                        >
                          <div className={styles.lessonLeft}>
                            <div className={`${styles.lessonNumber} ${done ? styles.lessonNumberDone : ''}`}>
                              {done ? <CheckCircle size={18} /> : lesson.id}
                            </div>
                            <div className={styles.lessonTitle}>{lesson.title}</div>
                          </div>
                          {done
                            ? <CheckCircle size={20} className={styles.lessonCheck} />
                            : <ChevronRight size={20} className={styles.arrow} />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
