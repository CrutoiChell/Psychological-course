-- Run intentionally in the trusted Supabase SQL Editor after creating these tables.
-- Replaces the permissive policies from earlier versions of SUPABASE_SETUP.md.
-- Public content reads and public application submission remain unchanged.
BEGIN;

DROP POLICY IF EXISTS "Admin write lessons" ON public.lessons_content;
CREATE POLICY "Admin write lessons" ON public.lessons_content
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin write tests" ON public.tests_content;
CREATE POLICY "Admin write tests" ON public.tests_content
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin write tips" ON public.tips_content;
CREATE POLICY "Admin write tips" ON public.tips_content
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service write modules" ON public.modules_content;
CREATE POLICY "Service write modules" ON public.modules_content
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read applications" ON public.applications;
CREATE POLICY "Admins can read applications" ON public.applications
  FOR SELECT TO service_role USING (true);

COMMIT;
