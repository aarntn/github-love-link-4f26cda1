ALTER TABLE public.triage_cases
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision,
  ADD COLUMN IF NOT EXISTS location_label text,
  ADD COLUMN IF NOT EXISTS clinic_distance_km double precision,
  ADD COLUMN IF NOT EXISTS clinic_lat double precision,
  ADD COLUMN IF NOT EXISTS clinic_lng double precision,
  ADD COLUMN IF NOT EXISTS clinic_maps_url text;
