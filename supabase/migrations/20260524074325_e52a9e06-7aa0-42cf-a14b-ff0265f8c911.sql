DROP POLICY IF EXISTS "Authenticated users can update triage cases" ON public.triage_cases;

CREATE POLICY "Authenticated users can update triage cases"
ON public.triage_cases
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
