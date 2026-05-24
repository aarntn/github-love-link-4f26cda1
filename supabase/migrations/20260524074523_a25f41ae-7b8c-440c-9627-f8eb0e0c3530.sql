DROP POLICY IF EXISTS "Authenticated users can view triage cases" ON public.triage_cases;

CREATE POLICY "Anyone can view triage cases"
ON public.triage_cases
FOR SELECT
TO public
USING (true);
