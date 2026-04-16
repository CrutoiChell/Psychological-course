# Настройка Supabase

## 1. Создание проекта

1. Зайди на [supabase.com](https://supabase.com)
2. Создай новый проект
3. Скопируй `Project URL` и `anon public` ключ

## 2. Настройка переменных окружения

Открой `.env.local` и замени значения:

```env
NEXT_PUBLIC_SUPABASE_URL=твой_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=твой_anon_key
```

## 3. Создание таблиц в Supabase

Зайди в SQL Editor в Supabase и выполни:

```sql
-- Таблица профилей
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица прогресса по урокам
CREATE TABLE user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица результатов тестов
CREATE TABLE test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  test_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  result_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица заявок на консультацию
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Если таблица уже есть но без колонки status:
ALTER TABLE applications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert applications" ON applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read applications" ON applications
  FOR SELECT USING (true);

-- Таблица рейтингов (звёзды после уроков и тестов)
CREATE TABLE ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  source_type TEXT NOT NULL, -- 'lesson' или 'test'
  source_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, source_type, source_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ratings" ON ratings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Ratings are readable by all" ON ratings
  FOR SELECT USING (true);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Политики доступа для profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Политики для user_progress
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Политики для test_results
CREATE POLICY "Users can view own test results" ON test_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test results" ON test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 4. Настройка Email Auth

1. В Supabase Dashboard → Authentication → Providers
2. Включи Email provider
3. **Для разработки:** Отключи "Confirm email" чтобы избежать rate limit
   - Authentication → Settings → Email Auth
   - Сними галочку "Enable email confirmations"
4. Настрой Email Templates (опционально)

## 5. Запуск проекта

```bash
npm run dev
```

Открой http://localhost:3000

## Таблицы для контента (уроки, тесты, советы)

```sql
-- Уроки
CREATE TABLE IF NOT EXISTS lessons_content (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  module TEXT NOT NULL,
  module_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  image TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE lessons_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read lessons" ON lessons_content FOR SELECT USING (true);
CREATE POLICY "Admin write lessons" ON lessons_content FOR ALL USING (true);

-- Тесты
CREATE TABLE IF NOT EXISTS tests_content (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  show_percent BOOLEAN DEFAULT true,
  questions JSONB NOT NULL DEFAULT '[]',
  results JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tests_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tests" ON tests_content FOR SELECT USING (true);
CREATE POLICY "Admin write tests" ON tests_content FOR ALL USING (true);

-- Советы дня
CREATE TABLE IF NOT EXISTS tips_content (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  icon TEXT,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tips_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tips" ON tips_content FOR SELECT USING (true);
CREATE POLICY "Admin write tips" ON tips_content FOR ALL USING (true);
```

## Настройка email уведомлений (Resend)

1. Зарегистрируйся на https://resend.com
2. Получи API ключ в Dashboard → API Keys
3. Добавь в `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxx
   ADMIN_NOTIFY_EMAIL=твой@email.com
   ```
4. **Важно**: Пока домен не верифицирован, письма идут ТОЛЬКО на email с которого зарегистрировался в Resend
5. После деплоя на Vercel — добавь домен `твой-проект.vercel.app` в Resend → Domains
6. Обнови `from` в `applications.ts` на `noreply@твой-домен.vercel.app`

### Локальная разработка
Письма не будут приходить локально если RESEND_API_KEY не настроен.
Заявки всё равно сохраняются в БД и видны в /admin/applications.
