ALTER TABLE public.triage_cases
  ADD COLUMN IF NOT EXISTS original_clinic text,
  ADD COLUMN IF NOT EXISTS reroute_reason text,
  ADD COLUMN IF NOT EXISTS reroute_note text;