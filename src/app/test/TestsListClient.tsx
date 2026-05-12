'use client';

import Link from 'next/link';
import { Flame, Brain, Zap, ChevronRight, RotateCcw, Shield, Target } from 'lucide-react';
import type { Test } from '@/data/tests';
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

interface Props {
  tests: Test[];
  completedTests: Record<string, number>;
}

export default function TestsListClient({ tests, completedTests }: Props) {
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
