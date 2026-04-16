// Скрипт для первичной миграции данных из JSON в Supabase
// Запуск: npx tsx scripts/migrate-to-supabase.ts

import { createClient } from '@supabase/supabase-js';
import lessonsData from '../src/data/content/lessons.json';
import testsData from '../src/data/content/tests.json';
import tipsData from '../src/data/content/tips.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrate() {
  console.log('🚀 Начинаем миграцию данных в Supabase...\n');

  // Lessons
  console.log('📚 Миграция уроков...');
  const lessons = lessonsData.map((l: any) => ({
    id: l.id,
    title: l.title,
    module: l.module,
    module_number: l.moduleNumber,
    content: l.content,
    image: l.image || null,
    video_url: l.videoUrl || null,
  }));
  
  await supabase.from('lessons_content').delete().neq('id', '');
  const { error: lessonsError } = await supabase.from('lessons_content').insert(lessons);
  if (lessonsError) {
    console.error('❌ Ошибка уроков:', lessonsError.message);
  } else {
    console.log(`✅ Загружено ${lessons.length} уроков`);
  }

  // Tests
  console.log('\n📊 Миграция тестов...');
  const tests = testsData.map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    icon: t.icon,
    show_percent: t.showPercent ?? true,
    questions: t.questions,
    results: t.results,
  }));

  await supabase.from('tests_content').delete().neq('id', '');
  const { error: testsError } = await supabase.from('tests_content').insert(tests);
  if (testsError) {
    console.error('❌ Ошибка тестов:', testsError.message);
  } else {
    console.log(`✅ Загружено ${tests.length} тестов`);
  }

  // Tips
  console.log('\n💡 Миграция советов...');
  await supabase.from('tips_content').delete().neq('id', '');
  const { error: tipsError } = await supabase.from('tips_content').insert(tipsData);
  if (tipsError) {
    console.error('❌ Ошибка советов:', tipsError.message);
  } else {
    console.log(`✅ Загружено ${tipsData.length} советов`);
  }

  console.log('\n🎉 Миграция завершена!');
}

migrate().catch(console.error);
