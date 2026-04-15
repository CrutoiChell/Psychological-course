'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, X, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { lessons } from '@/data/lessons';
import StarRating from '@/components/StarRating/StarRating';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import styles from './page.module.scss';

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const lesson = lessons.find(l => l.id === id);

  useEffect(() => {
    checkAuthAndProgress();
  }, [id]);

  const checkAuthAndProgress = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/sign_in'); return; }

    const { data } = await supabase
      .from('user_progress')
      .select('completed')
      .eq('user_id', user.id)
      .eq('lesson_id', id)
      .single();

    setIsCompleted(data?.completed || false);
    setLoading(false);
  };

  const handleComplete = async () => {
    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('user_progress').upsert({
      user_id: user.id,
      lesson_id: id,
      completed: true,
      completed_at: new Date().toISOString(),
    });

    if (!error) {
      setIsCompleted(true);
      setShowModal(true);
    }
    setSubmitting(false);
  };

  const handleRate = async (stars: number) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('ratings').upsert({
        user_id: user.id,
        source_type: 'lesson',
        source_id: id,
        rating: stars,
      }, { onConflict: 'user_id,source_type,source_id' });
    }
    setRatingSubmitted(true);
  };

  if (loading) return null;
  if (!lesson) { router.push('/course'); return null; }

  const currentIndex = lessons.findIndex(l => l.id === id);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <>
      <Header />
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.breadcrumb}>
            <Link href="/course">Курс</Link>
            <span>/</span>
            <span>{lesson.module}</span>
          </div>

          <div className={styles.lessonCard}>
            <div className={styles.lessonHeader}>
              <div className={styles.lessonMeta}>
                <span className={styles.moduleTag}>{lesson.module}</span>
                {isCompleted && <span className={styles.completedTag}><CheckCircle size={14} /> Пройдено</span>}
              </div>
              <h1>{lesson.title}</h1>
            </div>

            {lesson.image && !lesson.videoUrl && (
              <div className={styles.lessonImage}>
                <img src={lesson.image} alt={lesson.title} />
              </div>
            )}

            {lesson.videoUrl && (
              <div className={styles.videoContainer}>
                <iframe
                  src={lesson.videoUrl}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <div className={styles.lessonContent}>
              {lesson.content.split('\n').map((paragraph, i) => (
                paragraph.trim() ? <p key={i}>{paragraph}</p> : null
              ))}
            </div>

            <div className={styles.lessonFooter}>
              <div className={styles.navigation}>
                {prevLesson ? (
                  <Link href={`/lesson/${prevLesson.id}`} className={styles.navBtn}>
                    <ChevronLeft size={16} /> {prevLesson.title}
                  </Link>
                ) : <div />}
                {nextLesson && (
                  <Link href={`/lesson/${nextLesson.id}`} className={styles.navBtn}>
                    {nextLesson.title} <ChevronRight size={16} />
                  </Link>
                )}
              </div>

              {!isCompleted ? (
                <button onClick={handleComplete} disabled={submitting} className={styles.btnComplete}>
                  {submitting ? (
                    <><Loader2 size={18} className={styles.spinIcon} /> Сохранение...</>
                  ) : (
                    <><CheckCircle size={18} /> Отметить как пройденный</>
                  )}
                </button>
              ) : (
                <Link href={nextLesson ? `/lesson/${nextLesson.id}` : '/course'} className={styles.btnNext}>
                  {nextLesson ? <>Следующий урок <ChevronRight size={18} /></> : <>Завершить курс <ChevronRight size={18} /></>}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom bar */}
      <div className={styles.mobileBar}>
        {prevLesson ? (
          <Link href={`/lesson/${prevLesson.id}`} className={styles.mobileBarPrev}>
            <ChevronLeft size={20} />
          </Link>
        ) : <div style={{ width: '2.75rem' }} />}

        {!isCompleted ? (
          <button onClick={handleComplete} disabled={submitting} className={styles.mobileBarComplete}>
            {submitting ? <Loader2 size={18} className={styles.spinIcon} /> : <CheckCircle size={18} />}
            {submitting ? 'Сохранение...' : 'Пройдено'}
          </button>
        ) : (
          <Link
            href={nextLesson ? `/lesson/${nextLesson.id}` : '/course'}
            className={styles.mobileBarComplete}
            style={{ textDecoration: 'none' }}
          >
            <CheckCircle size={18} />
            {nextLesson ? 'Следующий' : 'Завершить'}
          </Link>
        )}

        {nextLesson ? (
          <Link href={`/lesson/${nextLesson.id}`} className={styles.mobileBarNext}>
            <ChevronRight size={20} />
          </Link>
        ) : <div style={{ width: '2.75rem' }} />}
      </div>

      {/* Модалка после завершения урока */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>

            <div className={styles.modalIcon}>
              <CheckCircle size={48} />
            </div>
            <h2>Урок пройден!</h2>
            <p>Отличная работа! Как вам этот урок?</p>

            <StarRating onRate={handleRate} disabled={ratingSubmitted} />

            {ratingSubmitted && (
              <p className={styles.modalThanks}>Спасибо за оценку!</p>
            )}

            <div className={styles.modalActions}>
              {nextLesson ? (
                <Link href={`/lesson/${nextLesson.id}`} className={styles.modalBtnPrimary} onClick={() => setShowModal(false)}>
                  Следующий урок <ArrowRight size={18} />
                </Link>
              ) : (
                <Link href="/course" className={styles.modalBtnPrimary} onClick={() => setShowModal(false)}>
                  Завершить курс <ArrowRight size={18} />
                </Link>
              )}
              <button className={styles.modalBtnSecondary} onClick={() => setShowModal(false)}>
                Остаться на уроке
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
