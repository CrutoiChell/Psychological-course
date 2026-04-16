'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Download, ArrowLeft, Lock, CheckCircle, BookOpen, ClipboardList } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { lessons } from '@/data/lessons';
import { tests } from '@/data/tests';
import Link from 'next/link';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import styles from './page.module.scss';

type CertTheme = 'dark' | 'purple' | 'light';

const REQUIRED_LESSONS = lessons.length;
const REQUIRED_TESTS = 3; // минимум 3 теста для получения сертификата

const certThemes: Record<CertTheme, { bg: string; border: string; text: string; sub: string; accent: string; label: string }> = {
  dark: {
    bg: '#0f172a',
    border: '#a78bfa',
    text: '#f1f5f9',
    sub: '#94a3b8',
    accent: '#a78bfa',
    label: 'Тёмная',
  },
  purple: {
    bg: '#2d1b69',
    border: '#ec4899',
    text: '#fdf4ff',
    sub: '#d8b4fe',
    accent: '#ec4899',
    label: 'Фиолетовая',
  },
  light: {
    bg: '#fdf2f8',
    border: '#db2777',
    text: '#111827',
    sub: '#6b7280',
    accent: '#db2777',
    label: 'Светлая',
  },
};

export default function CertificatePage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [completedTests, setCompletedTests] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<CertTheme>('dark');
  const certRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const CERT_W = 900;
  const CERT_H = 636;

  const dateStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const theme = certThemes[selectedTheme];

  const lessonPercent = Math.round((completedLessons / REQUIRED_LESSONS) * 100);
  const testPercent = Math.round((completedTests / REQUIRED_TESTS) * 100);
  const canGetByCourse = completedLessons >= REQUIRED_LESSONS;
  const canGetByTests = completedTests >= REQUIRED_TESTS;
  const canGet = canGetByCourse || canGetByTests;

  useEffect(() => { checkAuth(); }, []);

  // Масштабируем certCanvas под ширину wrapper через CSS zoom
  useEffect(() => {
    const scale = () => {
      if (!wrapperRef.current || !certRef.current) return;
      const w = wrapperRef.current.offsetWidth;
      const s = w / CERT_W;
      certRef.current.style.zoom = String(s);
    };
    scale();
    window.addEventListener('resize', scale);
    return () => window.removeEventListener('resize', scale);
  }, [loading]);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user) { router.push('/sign_in'); return; }
    setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'Участник курса');

    const [{ data: progressData }, { data: resultsData }] = await Promise.all([
      supabase.from('user_progress').select('lesson_id').eq('user_id', user.id),
      supabase.from('test_results').select('test_type').eq('user_id', user.id),
    ]);

    setCompletedLessons(progressData?.length || 0);
    const uniqueTests = new Set(resultsData?.map(r => r.test_type) || []);
    setCompletedTests(uniqueTests.size);
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!certRef.current || !canGet) return;

    // Рендерим через html2canvas → получаем PNG → вставляем в PDF
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    // Сбрасываем zoom
    certRef.current.style.zoom = '1';

    const canvas = await html2canvas(certRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: theme.bg,
      width: CERT_W,
      height: CERT_H,
    });

    // Восстанавливаем zoom
    if (wrapperRef.current) {
      const s = wrapperRef.current.offsetWidth / CERT_W;
      certRef.current.style.zoom = String(s);
    }

    const imgData = canvas.toDataURL('image/png');
    // A4 landscape: 297 x 210 mm
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
    pdf.save(`Сертификат_${userName}.pdf`);
  };

  if (loading) return null;

  return (
    <>
      <Header />
      <div className={styles.page}>
        <div className={styles.container}>

          <div className={styles.card}>
            <div className={styles.iconWrap}>
              <GraduationCap size={48} />
            </div>
            <h1>{canGet ? 'Ваш сертификат готов!' : 'Получите сертификат'}</h1>
            <p className={styles.subtitle}>
              {canGet
                ? 'Поздравляем! Вы выполнили условия для получения сертификата.'
                : 'Выполните одно из условий ниже, чтобы получить сертификат.'}
            </p>

            {/* Условия */}
            <div className={styles.conditions}>
              {/* Условие 1: уроки */}
              <div className={`${styles.condition} ${canGetByCourse ? styles.conditionDone : ''}`}>
                <div className={styles.conditionHeader}>
                  <div className={styles.conditionIcon}>
                    {canGetByCourse ? <CheckCircle size={22} /> : <BookOpen size={22} />}
                  </div>
                  <div className={styles.conditionInfo}>
                    <div className={styles.conditionTitle}>Пройдите все уроки курса</div>
                    <div className={styles.conditionSub}>{completedLessons} / {REQUIRED_LESSONS} уроков</div>
                  </div>
                  {!canGetByCourse && (
                    <div className={styles.conditionLock}><Lock size={16} /></div>
                  )}
                </div>
                <div className={styles.conditionProgress}>
                  <div className={styles.conditionBar}>
                    <div className={styles.conditionFill} style={{ width: `${Math.min(lessonPercent, 100)}%` }} />
                  </div>
                  <span className={styles.conditionPercent}>{lessonPercent}%</span>
                </div>
              </div>

              <div className={styles.orDivider}>или</div>

              {/* Условие 2: тесты */}
              <div className={`${styles.condition} ${canGetByTests ? styles.conditionDone : ''}`}>
                <div className={styles.conditionHeader}>
                  <div className={styles.conditionIcon}>
                    {canGetByTests ? <CheckCircle size={22} /> : <ClipboardList size={22} />}
                  </div>
                  <div className={styles.conditionInfo}>
                    <div className={styles.conditionTitle}>Пройдите {REQUIRED_TESTS} теста</div>
                    <div className={styles.conditionSub}>{completedTests} / {REQUIRED_TESTS} тестов</div>
                  </div>
                  {!canGetByTests && (
                    <div className={styles.conditionLock}><Lock size={16} /></div>
                  )}
                </div>
                <div className={styles.conditionProgress}>
                  <div className={styles.conditionBar}>
                    <div className={styles.conditionFill} style={{ width: `${Math.min(testPercent, 100)}%` }} />
                  </div>
                  <span className={styles.conditionPercent}>{testPercent}%</span>
                </div>
              </div>
            </div>

            {canGet && (
              <>
                {/* Выбор темы */}
                <div className={styles.themeSelector}>
                  <div className={styles.themeSelectorLabel}>Выберите тему сертификата:</div>
                  <div className={styles.themeOptions}>
                    {(Object.keys(certThemes) as CertTheme[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTheme(t)}
                        className={`${styles.themeOption} ${selectedTheme === t ? styles.themeOptionActive : ''}`}
                        style={{ background: certThemes[t].bg, borderColor: certThemes[t].border }}
                      >
                        <span style={{ color: certThemes[t].text }}>{certThemes[t].label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Превью */}
                <div className={styles.certWrapper} ref={wrapperRef}>
                  <div ref={certRef} className={styles.certCanvas} style={{ background: theme.bg }}>
                    <div className={styles.certBorder} style={{ borderColor: theme.border }} />
                    <div className={styles.certInner}>
                      <div className={styles.certHeader} style={{ color: theme.text }}>СЕРТИФИКАТ</div>
                      <div className={styles.certSubheader} style={{ color: theme.sub }}>о прохождении онлайн-курса</div>
                      <div className={styles.certCourse} style={{ color: theme.accent }}>
                        «Выход из эмоционального выгорания»
                      </div>
                      <div className={styles.certGiven} style={{ color: theme.sub }}>Настоящий сертификат выдан</div>
                      <div className={styles.certName} style={{ color: theme.text }}>{userName}</div>
                      <div className={styles.certLine} style={{ background: theme.border }} />
                      <div className={styles.certDate} style={{ color: theme.sub }}>Дата выдачи: {dateStr}</div>
                      <div className={styles.certSignature}>
                        <div className={styles.certSignLine} style={{ background: theme.sub }} />
                        <div className={styles.certSignLabel} style={{ color: theme.sub }}>Организатор курса</div>
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={handleDownload} className={styles.btnDownload}>
                  <Download size={20} /> Скачать PDF
                </button>
              </>
            )}

            {!canGet && (
              <div className={styles.actionsLocked}>
                <Link href="/course" className={styles.btnAction}>
                  <BookOpen size={18} /> Перейти к урокам
                </Link>
                <Link href="/test" className={styles.btnActionSecondary}>
                  <ClipboardList size={18} /> Пройти тесты
                </Link>
              </div>
            )}

            <button onClick={() => router.push('/dashboard')} className={styles.btnBack}>
              <ArrowLeft size={18} /> Вернуться в кабинет
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
