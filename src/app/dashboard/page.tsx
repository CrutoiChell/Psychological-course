'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen, BarChart2, Award, CheckCircle, ArrowRight,
  Lightbulb, IdCard, ChevronRight, Flame, Brain, Zap, Shield, Target, Lock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { lessons } from '@/data/lessons';
import { tests } from '@/data/tests';
import { tips } from '@/data/tips';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import styles from './page.module.scss';

const testIconMap: Record<string, React.ReactNode> = {
  burnout: <Flame size={22} />,
  personality: <Brain size={22} />,
  stress: <Zap size={22} />,
  stress2: <Zap size={22} />,
  energy: <Zap size={22} />,
  boundaries: <Shield size={22} />,
  perfectionism: <Target size={22} />,
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<Record<string, { score: number; level: string }>>({});
  const [loading, setLoading] = useState(true);
  const [tipIndex] = useState(() => Math.floor(Math.random() * tips.length));

  useEffect(() => { checkUser(); }, []);

  const checkUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/sign_in'); return; }
    setUser(user);

    const [{ data: progressData }, { data: resultsData }] = await Promise.all([
      supabase.from('user_progress').select('lesson_id, completed').eq('user_id', user.id),
      supabase.from('test_results').select('test_type, score, result_text').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    setProgress(progressData || []);

    const results: Record<string, { score: number; level: string }> = {};
    resultsData?.forEach(r => {
      if (!(r.test_type in results)) results[r.test_type] = { score: r.score, level: r.result_text };
    });
    setTestResults(results);
    setLoading(false);
  };

  if (loading) {
    return <div className={styles.loading}><div className={styles.spinner} /></div>;
  }

  const completedSet = new Set(progress.map(p => p.lesson_id));
  const totalCompleted = completedSet.size;
  const progressPercent = Math.round((totalCompleted / lessons.length) * 100);
  const completedTestsCount = Object.keys(testResults).length;
  const canGetCertificate = totalCompleted >= lessons.length || completedTestsCount >= 3;
  const tip = tips[tipIndex];

  return (
    <>
      <Header />
      <div className={styles.page}>
        <div className={styles.container}>

          <div className={styles.pageHeader}>
            <h1>Личный кабинет</h1>
            <p>Добро пожаловать, {user?.user_metadata?.name || 'Студент'}</p>
          </div>

          {/* Tip */}
          <div className={styles.tipCard}>
            <div className={styles.tipIconWrap}>
              <Lightbulb size={24} />
            </div>
            <div className={styles.tipContent}>
              <div className={styles.tipLabel}>Совет дня · {tip.category}</div>
              <div className={styles.tipTitle}>{tip.title}</div>
              <p className={styles.tipText}>{tip.text}</p>
            </div>
          </div>

          <div className={styles.mainGrid}>
            <div className={styles.leftCol}>

              {/* Progress */}
              <div className={styles.progressCard}>
                <div className={styles.progressHeader}>
                  <h2>Прогресс курса</h2>
                  <span className={styles.progressPercent}>{progressPercent}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
                </div>
                <p className={styles.progressText}>Пройдено {totalCompleted} из {lessons.length} уроков</p>
              </div>

              {/* Passport */}
              <div className={styles.passportCard}>
                <div className={styles.passportHeader}>
                  <IdCard size={22} />
                  <h2>Психологический паспорт</h2>
                </div>
                <div className={styles.passportGrid}>
                  {tests.map(test => {
                    const result = testResults[test.id];
                    return (
                      <div key={test.id} className={styles.passportItem}>
                        <div className={styles.passportTestIcon}>
                          {testIconMap[test.id] ?? <BarChart2 size={22} />}
                        </div>
                        <div className={styles.passportInfo}>
                          <div className={styles.passportTestName}>{test.title}</div>
                          {result ? (
                            <div className={styles.passportResult}>
                              {test.showPercent && (
                                <span className={styles.passportScore}>{result.score}%</span>
                              )}
                              <span className={styles.passportLevel}>{result.level}</span>
                            </div>
                          ) : (
                            <Link href={`/test/${test.id}`} className={styles.passportTake}>
                              Пройти тест <ChevronRight size={14} />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={styles.rightCol}>

              {/* Actions */}
              <div className={styles.actionsGrid}>
                <Link href="/course" className={styles.actionCard}>
                  <BookOpen size={28} className={styles.actionIcon} />
                  <h3>Курс</h3>
                  <p>Продолжить</p>
                </Link>
                <Link href="/test" className={styles.actionCard}>
                  <BarChart2 size={28} className={styles.actionIcon} />
                  <h3>Тесты</h3>
                  <p>Диагностика</p>
                </Link>
                <Link href="/certificate" className={styles.actionCard}>
                  <Award size={28} className={styles.actionIcon} />
                  <h3>Сертификат</h3>
                  <p>Скачать PDF</p>
                </Link>
              </div>

              {canGetCertificate ? (
                <div className={styles.certificateCard}>
                  <Award size={32} className={styles.certIcon} />
                  <h3>Сертификат доступен!</h3>
                  <p>Вы выполнили условия получения</p>
                  <Link href="/certificate" className={styles.btnCertificate}>
                    Получить сертификат <ArrowRight size={18} />
                  </Link>
                </div>
              ) : (
                <div className={styles.certificateCardLocked}>
                  <div className={styles.certLockedHeader}>
                    <Lock size={20} className={styles.certLockIcon} />
                    <h3>Сертификат</h3>
                  </div>
                  <p>Пройдите все уроки или 3 теста</p>
                  <div className={styles.certProgress}>
                    <div className={styles.certProgressItem}>
                      <div className={styles.certProgressCircle}>
                        <svg viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#a78bfa" strokeWidth="3"
                            strokeDasharray={`${progressPercent} 100`} strokeLinecap="round"
                            transform="rotate(-90 18 18)" />
                        </svg>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className={styles.certProgressLabel}>Уроки</div>
                    </div>
                    <div className={styles.certProgressItem}>
                      <div className={styles.certProgressCircle}>
                        <svg viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ec4899" strokeWidth="3"
                            strokeDasharray={`${Math.round((completedTestsCount / 3) * 100)} 100`} strokeLinecap="round"
                            transform="rotate(-90 18 18)" />
                        </svg>
                        <span>{completedTestsCount}/3</span>
                      </div>
                      <div className={styles.certProgressLabel}>Тесты</div>
                    </div>
                  </div>
                  <Link href="/certificate" className={styles.btnCertificateLocked}>
                    Подробнее <ChevronRight size={16} />
                  </Link>
                </div>
              )}

              {/* Lessons */}
              <div className={styles.lessonsCard}>
                <h3>Уроки курса</h3>
                <div className={styles.lessonsList}>
                  {lessons.map((lesson) => {
                    const done = completedSet.has(lesson.id);
                    return (
                      <div key={lesson.id} className={styles.lessonItem}>
                        <div className={styles.lessonInfo}>
                          <p className={styles.lessonModule}>{lesson.module}</p>
                          <p className={styles.lessonTitle}>{lesson.title}</p>
                        </div>
                        {done ? (
                          <CheckCircle size={20} className={styles.completed} />
                        ) : (
                          <Link href={`/lesson/${lesson.id}`} className={styles.btnLesson}>
                            <ArrowRight size={16} />
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
