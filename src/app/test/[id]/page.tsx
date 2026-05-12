import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTests } from '@/app/actions/admin';
import TestClient from './TestClient';

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign_in');

  const tests = await getTests();
  const test = tests.find(t => t.id === id);
  if (!test) redirect('/test');

  return <TestClient test={test} />;
}
