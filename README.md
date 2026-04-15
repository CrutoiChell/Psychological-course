# Психологический курс - Дипломный проект

Интерактивная платформа для прохождения курса по психологии кризиса с системой прогресса и тестированием.

## Стек технологий

- Next.js 16.2.3 (App Router)
- React 19
- TypeScript
- Supabase (Auth + PostgreSQL)
- SCSS Modules
- Server Actions

## Структура проекта

```
/src
  /app
    /page.tsx                    # Главная с Hero Slider
    /sign_in                     # Авторизация
    /sign_up                     # Регистрация
    /dashboard                   # Личный кабинет
    /course                      # Список уроков
    /lesson/[id]                 # Страница урока
    /test                        # Тест на выгорание
    /actions                     # Server Actions
  /data                          # Моковые данные
  /lib/supabase                  # Supabase клиенты
```

## Установка и запуск

1. Установи зависимости:
```bash
npm install
```

2. Настрой Supabase (см. SUPABASE_SETUP.md)

3. Создай `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=твой_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=твой_ключ
```

4. Запусти dev сервер:
```bash
npm run dev
```

## Функционал

- ✅ Главная страница с динамической сменой темы
- ✅ Регистрация и авторизация через Supabase
- ✅ Личный кабинет с прогрессом
- ✅ Курс из 5 уроков по 3 модулям
- ✅ Отметка пройденных уроков
- ✅ Тест на эмоциональное выгорание (12 вопросов)
- ✅ Сохранение результатов в БД

## Решение проблем

### Email rate limit exceeded
В Supabase Dashboard:
1. Authentication → Settings
2. Отключи "Enable email confirmations" для разработки

### Ошибка supabaseKey is required
Проверь что `.env.local` создан и содержит правильные ключи

## Дальнейшее развитие

- [ ] Генерация PDF сертификата
- [ ] Больше уроков и модулей
- [ ] Видео в уроках
- [ ] Middleware для защиты роутов
- [ ] Админ панель
