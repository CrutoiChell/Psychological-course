'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Download, ArrowLeft, Lock, CheckCircle, BookOpen, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import styles from './page.module.scss';

type CertTheme = 'dark' | 'purple' | 'light';

const REQUIRED_TESTS = 3;

const certThemes: Record<CertTheme, { bg: string; border: string; text: string; sub: string; accent: string; label: string }> = {
  dark: { bg: '#0f172a', border: '#a78bfa', text: '#f1f5f9', sub: '#94a3b8', accent: '#a78bfa', label: 'Тёмная' },
  purple: { bg: '#2d1b69', border: '#ec4899', text: '#fdf4ff', sub: '#d8b4fe', accent: '#ec4899', label: 'Фиолетовая' },
  light: { bg: '#fdf2f8', border: '#db2777', text: '#111827', sub: '#6b7280', accent: '#db2777', label: 'Светлая' },
};

interface Props {
  userName: string;
  totalLessons: number;
  completedLessons: number;
  completedTests: number;
}

export default function CertificateClient({ userName, totalLessons, completedLessons, completedTests }: Props) {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState<CertTheme>('dark');
  const certRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const CERT_W = 900;
  const CERT_H = 636;

  const dateStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const theme = certThemes[selectedTheme];

  const lessonPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const testPercent = Math.round((completedTests / REQUIRED_TESTS) * 100);
  const canGetByCourse = totalLessons > 0 && completedLessons >= totalLessons;
  const canGetByTests = completedTests >= REQUIRED_TESTS;
  const canGet = canGetByCourse || canGetByTests;

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
  }, [canGet]);

  const handleDownload = async () => {
    if (!certRef.current || !canGet) return;

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    certRef.current.style.zoom = '1';

    const canvas = await html2canvas(certRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: theme.bg,
      width: CERT_W,
      height: CERT_H,
    });

    if (wrapperRef.current) {
      const s = wrapperRef.current.offsetWidth / CERT_W;
      certRef.current.style.zoom = String(s);
    }

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
    pdf.save(`Сертификат_${userName}.pdf`);
  };

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

            <div className={styles.conditions}>
              <div className={`${styles.condition} ${canGetByCourse ? styles.conditionDone : ''}`}>
                <div className={styles.conditionHeader}>
                  <div className={styles.conditionIcon}>
                    {canGetByCourse ? <CheckCircle size={22} /> : <BookOpen size={22} />}
                  </div>
                  <div className={styles.conditionInfo}>
                    <div className={styles.conditionTitle}>Пройдите все уроки курса</div>
                    <div className={styles.conditionSub}>{completedLessons} / {totalLessons} уроков</div>
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
