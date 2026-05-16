'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, BarChart2 } from 'lucide-react';
import userStyles from './users.module.scss';

type User = {
  id: string;
  email?: string;
  created_at: string;
  user_metadata?: { name?: string };
};

type ProgressRow = { user_id: string; lesson_id: string; completed_at?: string };
type TestRow = { user_id: string; test_type: string; score: number; result_text?: string; created_at: string };

interface Props {
  users: User[];
  progress: ProgressRow[];
  testResults: TestRow[];
  lessonTitles: Record<string, string>;
  testTitles: Record<string, string>;
}

export default function UsersAdminClient({ users, progress, testResults, lessonTitles, testTitles }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const progressByUser = progress.reduce((acc, p) => {
    if (!acc[p.user_id]) acc[p.user_id] = [];
    acc[p.user_id].push(p);
    return acc;
  }, {} as Record<string, ProgressRow[]>);

  const testsByUser = testResults.reduce((acc, t) => {
    if (!acc[t.user_id]) acc[t.user_id] = [];
    acc[t.user_id].push(t);
    return acc;
  }, {} as Record<string, TestRow[]>);

  return (
    <div className={userStyles.table}>
      <div className={userStyles.tableHead}>
        <span>Пользователь</span>
        <span>Email</span>
        <span><BookOpen size={14} /> Уроков</span>
        <span><BarChart2 size={14} /> Тестов</span>
        <span>Дата регистрации</span>
      </div>
      {users.map(user => {
        const userProgress = progressByUser[user.id] ?? [];
        const userTests = testsByUser[user.id] ?? [];
        const isOpen = expanded === user.id;

        return (
          <div key={user.id} className={userStyles.userBlock}>
            <div
              className={userStyles.tableRow}
              onClick={() => setExpanded(isOpen ? null : user.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setExpanded(isOpen ? null : user.id)}
            >
              <div className={userStyles.userCell}>
                <div className={userStyles.avatar}>
                  {(user.user_metadata?.name || user.email || '?')[0].toUpperCase()}
                </div>
                <span className={userStyles.userName}>{user.user_metadata?.name || '—'}</span>
              </div>
              <span className={userStyles.email}>{user.email}</span>
              <span className={userStyles.count}>{userProgress.length}</span>
              <span className={userStyles.count}>{userTests.length}</span>
              <span className={userStyles.dateRow}>
                {new Date(user.created_at).toLocaleDateString('ru-RU')}
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </div>

            {isOpen && (
              <div className={userStyles.details}>
                <div className={userStyles.detailCol}>
                  <h4><BookOpen size={14} /> Пройденные уроки</h4>
                  {userProgress.length === 0 ? (
                    <p className={userStyles.emptyDetail}>Пока нет</p>
                  ) : (
                    <ul>
                      {userProgress.map(p => (
                        <li key={p.lesson_id}>
                          <strong>#{p.lesson_id}</strong> {lessonTitles[p.lesson_id] || 'Урок'}
                          {p.completed_at && (
                            <span> — {new Date(p.completed_at).toLocaleDateString('ru-RU')}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className={userStyles.detailCol}>
                  <h4><BarChart2 size={14} /> Тесты</h4>
                  {userTests.length === 0 ? (
                    <p className={userStyles.emptyDetail}>Пока нет</p>
                  ) : (
                    <ul>
                      {userTests.map((t, i) => (
                        <li key={`${t.test_type}-${i}`}>
                          <strong>{testTitles[t.test_type] || t.test_type}</strong>
                          {' — '}{t.score}%{t.result_text ? ` (${t.result_text})` : ''}
                          <span> · {new Date(t.created_at).toLocaleDateString('ru-RU')}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
