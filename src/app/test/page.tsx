'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flame, Brain, Zap, ChevronRight, RotateCcw, Shield, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { tests } from '@/data/tests';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import styles from './page.module.scss';

const testIcons: Record<string, React.ReactNode> = {
  burnout: <Flame size={36} />,
  personality: <Brain size={36} />,
  stress: <Zap size={36} />,
  stress2: <Zap size={36} />,
  energy: <Zap size={36} />,
  boundaries: <Shield size={36} />,
  perfectionism: <Target size={36} />,
};

export default function TestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [completedTests, setCompletedTests] = useState<Record<string, number>>({});

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/sign_in'); return; }

    const { data } = await supabase
      .from('test_results')
      .select('test_type, score')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const results: Record<string, number> = {};
    data?.forEach(r => { if (!(r.test_type in results)) results[r.test_type] = r.score; });
    setCompletedTests(results);
    setLoading(false);
  };

  if (loading) return null;

  return (
    <>
      <Header />
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.pageHeader}>
            <h1>Тесты и диагностика</h1>
            <p>Узнайте больше о себе с помощью психологических тестов</p>
          </div>

          <div className={styles.testsGrid}>
            {tests.map((test) => {
              const score = completedTests[test.id];
              const isDone = score !== undefined;
              return (
                <Link key={test.id} href={`/test/${test.id}`} className={styles.testCard}>
                  <div className={styles.testIcon}>{testIcons[test.id] ?? <Brain size={36} />}</div>
                  <div className={styles.testInfo}>
                    <h2>{test.title}</h2>
                    <p>{test.description}</p>
                    <div className={styles.testMeta}>
                      <span className={styles.questionCount}>{test.questions.length} вопросов</span>
                      {isDone && <span className={styles.scoreBadge}>Результат: {score}%</span>}
                    </div>
                  </div>
                  <div className={styles.testArrow}>
                    {isDone ? <RotateCcw size={18} /> : <ChevronRight size={18} />}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
