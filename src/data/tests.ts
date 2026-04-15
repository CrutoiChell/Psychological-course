import testsData from './content/tests.json';

export interface TestQuestion {
  id: number;
  question: string;
  options: string[];
}

export interface TestResult {
  minPercent: number;
  maxPercent: number;
  level: string;
  color: string;
  emoji: string;
  description: string;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  icon: string;
  showPercent?: boolean;
  questions: TestQuestion[];
  results: TestResult[];
}

export const tests: Test[] = testsData as Test[];

export function getTest(id: string): Test | undefined {
  return tests.find(t => t.id === id);
}

export function calculateResult(test: Test, answers: number[]): TestResult & { percentage: number; score: number } {
  const score = answers.reduce((sum, val) => sum + val, 0);
  const maxScore = test.questions.length * 4;
  const percentage = Math.round((score / maxScore) * 100);

  const result = test.results.find(
    r => percentage >= r.minPercent && percentage <= r.maxPercent
  ) || test.results[test.results.length - 1];

  return { ...result, percentage, score };
}
