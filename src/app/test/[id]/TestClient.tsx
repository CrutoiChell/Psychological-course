'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flame, Brain, Zap, LayoutDashboard, ListChecks, Shield, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { calculateResult, type Test } from '@/data/tests';
import StarRating from '@/components/StarRating/StarRating';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import styles from './page.module.scss';

const testIcons: Record<string, React.ReactNode> = {
  burnout: <Flame size={22} />,
  personality: <Brain size={22} />,
  stress: <Zap size={22} />,
  stress2: <Zap size={22} />,
  energy: <Zap size={22} />,
  boundaries: <Shield size={22} />,
  perfectionism: <Target size={22} />,
};

export default function TestClient({ test }: { test: Test }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<any>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const handleAnswer = async (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const testResult = calculateResult(test, newAnswers);
      setResult(testResult);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('test_results').insert({
          user_id: user.id,
          test_type: test.id,
          score: testResult.percentage,
          result_text: testResult.level,
        });
      }
    }
  };

  const handleRate = async (stars: number) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('ratings').upsert({
        user_id: user.id,
        source_type: 'test',
        source_id: test.id,
        rating: stars,
      }, { onConflict: 'user_id,source_type,source_id' });
    }
    setRatingSubmitted(true);
  };

  if (result) {
    return (
      <>
        <Header />
        <div className={styles.page}>
          <div className={styles.resultContainer}>
            <div className={styles.resultCard}>
              <div className={styles.resultIconWrap} style={{ borderColor: result.color, boxShadow: `0 0 30px ${result.color}40` }}>
                {testIcons[test.id] ?? <Brain size={36} />}
              </div>
              <h1>Результат</h1>
              <p className={styles.testSubtitle}>{test.title}</p>

              {test.showPercent ? (
                <div className={styles.scoreCircle} style={{ '--level-color': result.color } as any}>
                  <div className={styles.scoreNumber}>{result.percentage}%</div>
                  <div className={styles.scoreLabel}>результат</div>
                </div>
              ) : (
                <div className={styles.resultBadge} style={{ borderColor: result.color, color: result.color }}>
                  {result.level}
                </div>
              )}

              {test.showPercent && (
                <div className={styles.resultLevel} style={{ color: result.color }}>{result.level}</div>
              )}
              <p className={styles.resultDescription}>{result.description}</p>

              <div className={styles.ratingSection}>
                <p className={styles.ratingLabel}>
                  {ratingSubmitted ? 'Спасибо за оценку!' : 'Оцените тест — нажмите на звёзды (от 1 до 5):'}
                </p>
                <StarRating onRate={handleRate} disabled={ratingSubmitted} />
              </div>

              <div className={styles.resultActions}>
                <Link href="/dashboard" className={styles.btnPrimary}>
                  <LayoutDashboard size={18} /> Посмотреть профиль
                </Link>
                <Link href="/test" className={styles.btnSecondary}>
                  <ListChecks size={18} /> Другие тесты
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const question = test.questions[currentQuestion];
  const progress = (currentQuestion / test.questions.length) * 100;

  return (
    <>
      <Header />
      <div className={styles.page}>
        <div className={styles.testContainer}>
          <div className={styles.testHeader}>
            <div className={styles.testMeta}>
              <span className={styles.testIconWrap}>{testIcons[test.id] ?? <Brain size={22} />}</span>
              <span className={styles.testTitle}>{test.title}</span>
            </div>
            <p className={styles.questionCounter}>{currentQuestion + 1} / {test.questions.length}</p>
          </div>

          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>

          <div className={styles.testCard}>
            <h2 className={styles.questionText}>{question.question}</h2>
            <div className={styles.options}>
              {question.options.map((option, index) => (
                <button key={index} onClick={() => handleAnswer(index)} className={styles.optionButton}>
                  <span className={styles.optionIndex}>{index + 1}</span>
                  <span>{option}</span>
                </button>
              ))}
            </div>
          </div>

          <p className={styles.hint}>Отвечайте честно — это поможет получить точный результат</p>
        </div>
      </div>
      <Footer />
    </>
  );
}
