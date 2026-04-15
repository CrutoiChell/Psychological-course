'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { Users, BookOpen, Star, GraduationCap, Target, BarChart2, Award, Clock, Lightbulb, TrendingUp, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { slides } from '@/data/slides';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import ConsultationForm from '@/components/ConsultationForm/ConsultationForm';
import styles from './page.module.scss';

interface Stats {
  students: number;
  certificates: number;
  satisfaction: number;
  modules: number;
}

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState<Stats>({ students: 0, certificates: 0, satisfaction: 98, modules: 3 });
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const countersAnimated = useRef(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const supabase = createClient();
      const [{ count: certificates }, { data: ratingsData }, { data: progressData }] = await Promise.all([
        supabase.from('test_results').select('*', { count: 'exact', head: true }),
        supabase.from('ratings').select('rating'),
        supabase.from('user_progress').select('user_id'),
      ]);

      // Уникальные пользователи из user_progress
      const uniqueUsers = new Set(progressData?.map((p: any) => p.user_id) ?? []).size;

      let avgRating = 98;
      if (ratingsData && ratingsData.length > 0) {
        const sum = ratingsData.reduce((acc: number, r: any) => acc + r.rating, 0);
        avgRating = Math.round((sum / ratingsData.length / 5) * 100);
      }

      setStats(prev => ({
        ...prev,
        students: uniqueUsers,
        certificates: Math.max(certificates || 0, 0),
        satisfaction: avgRating,
      }));
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', slides[currentIndex].theme);
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.querySelectorAll('.animate-in'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' }
      );
    }
  }, [currentIndex]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting && !countersAnimated.current) {
            countersAnimated.current = true;
            animateCounters();
          }
        });
      },
      { threshold: 0.5 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [stats]);

  const animateCounters = () => {
    document.querySelectorAll('.counter').forEach((counter) => {
      const target = parseInt(counter.getAttribute('data-target') || '0');
      gsap.to(counter, { innerHTML: target, duration: 2, ease: 'power2.out', snap: { innerHTML: 1 } });
    });
  };

  const goToSlide = (i: number) => setCurrentIndex(i);
  const nextSlide = () => setCurrentIndex(p => (p + 1) % slides.length);
  const prevSlide = () => setCurrentIndex(p => (p - 1 + slides.length) % slides.length);

  return (
    <>
      <Header />
      <main className={styles.main}>

        {/* Hero */}
        <section className={styles.hero} ref={heroRef}>
          <div className={styles.heroBackground} style={{ backgroundImage: `url(${slides[currentIndex].image})` }}>
            <div className={styles.heroOverlay} />
            <div className={styles.gradientOrb} />
            <div className={styles.gradientOrb2} />
          </div>

          <div className={styles.heroContent}>
            <div className={`${styles.badge} animate-in`}>
              <span className={styles.badgeDot} />
              Онлайн-курс 2026
            </div>
            <h1 className="animate-in">{slides[currentIndex].title}</h1>
            <h2 className="animate-in">{slides[currentIndex].subtitle}</h2>
            <p className="animate-in">{slides[currentIndex].description}</p>

            <div className={`${styles.ctaButtons} animate-in`}>
              <Link href="/sign_up" className={styles.btnLarge}>
                <span>Начать обучение</span>
                <ArrowRight size={22} className={styles.btnIcon} />
              </Link>
              <Link href="/course" className={styles.btnOutline}>
                <span>Смотреть курс</span>
              </Link>
            </div>

            <div className={styles.sliderControls}>
              <button onClick={prevSlide} className={styles.sliderBtn} aria-label="Предыдущий слайд">
                <ChevronLeft size={26} />
              </button>
              <div className={styles.sliderDots}>
                {slides.map((_, i) => (
                  <button key={i} onClick={() => goToSlide(i)}
                    className={`${styles.dot} ${i === currentIndex ? styles.active : ''}`}
                    aria-label={`Слайд ${i + 1}`} />
                ))}
              </div>
              <button onClick={nextSlide} className={styles.sliderBtn} aria-label="Следующий слайд">
                <ChevronRight size={26} />
              </button>
            </div>
          </div>

          <div className={styles.scrollIndicator}>
            <div className={styles.mouse}><div className={styles.wheel} /></div>
            <span className={styles.scrollLabel}>Скролл</span>
          </div>

          <div className={styles.swipeIndicator}>
            <div className={styles.swipePhone} />
            <span className={styles.swipeLabel}>Свайп</span>
          </div>
        </section>

        {/* Stats */}
        <section className={styles.stats} ref={statsRef}>
          <div className={styles.container}>
            <div className={styles.statsGrid}>
              {[
                { icon: <Users size={44} />, target: stats.students, suffix: '+', label: 'Участников' },
                { icon: <BookOpen size={44} />, target: stats.modules, suffix: '', label: 'Модулей курса' },
                { icon: <Star size={44} />, target: stats.satisfaction, suffix: '%', label: 'Довольных' },
                { icon: <GraduationCap size={44} />, target: stats.certificates, suffix: '+', label: 'Тестов пройдено' },
              ].map((stat, i) => (
                <div key={i} className={styles.statCard}>
                  <div className={styles.statIcon}>{stat.icon}</div>
                  <div className={styles.statNumber}>
                    <span className="counter" data-target={stat.target}>0</span>{stat.suffix}
                  </div>
                  <div className={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className={styles.features}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>Что вы получите</h2>
              <p>Комплексный подход к преодолению выгорания</p>
            </div>
            <div className={styles.featuresGrid}>
              {[
                { icon: <Target size={48} />, title: 'Структурированный курс', text: '5 модулей с практическими заданиями и техниками восстановления' },
                { icon: <BarChart2 size={48} />, title: 'Диагностика', text: 'Тест на определение уровня выгорания с персональными рекомендациями' },
                { icon: <Award size={48} />, title: 'Сертификат', text: 'Официальный сертификат о прохождении курса в формате PDF' },
                { icon: <Clock size={48} />, title: 'Доступ 24/7', text: 'Учитесь в удобное время с любого устройства' },
                { icon: <Lightbulb size={48} />, title: 'Практические техники', text: 'Инструменты для ежедневного применения и профилактики' },
                { icon: <TrendingUp size={48} />, title: 'Отслеживание прогресса', text: 'Личный кабинет с визуализацией вашего прогресса' },
              ].map((f, i) => (
                <div key={i} className={styles.featureCard}>
                  <div className={styles.featureIcon}>{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <div className={styles.container}>
            <div className={styles.ctaCard}>
              <h2>Готовы начать путь к восстановлению?</h2>
              <p>Присоединяйтесь к 1200+ участникам, которые уже изменили свою жизнь</p>
              <Link href="/sign_up" className={styles.ctaButton}>
                Начать бесплатно
              </Link>
            </div>
          </div>
        </section>

        <ConsultationForm />
      </main>
      <Footer />
    </>
  );
}
