-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can view triage cases" ON public.triage_cases;
DROP POLICY IF EXISTS "Anyone can update triage cases" ON public.triage_cases;

-- Restrict SELECT to authenticated users only
CREATE POLICY "Authenticated users can view triage cases"
ON public.triage_cases
FOR SELECT
TO authenticated
USING (true);

-- Restrict UPDATE to authenticated users only
CREATE POLICY "Authenticated users can update triage cases"
ON public.triage_cases
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Restrict Realtime broadcasts to authenticated subscribers
CREATE POLICY "Authenticated users can receive triage realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);
