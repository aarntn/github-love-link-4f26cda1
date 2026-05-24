
create table public.triage_cases (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  channel text not null check (channel in ('web','whatsapp')),
  mode text not null check (mode in ('citizen','anonymous')),
  language text not null,
  chief_complaint text not null,
  flow text not null check (flow in ('dengue','tb','ncd','general')),
  urgency text not null check (urgency in ('emergency','urgent','routine')),
  red_flag boolean not null default false,
  postcode text,
  is_dengue_hotspot boolean,
  recommended_clinic text not null,
  triage_summary text not null,
  status text not null default 'new' check (status in ('new','reviewed','escalated'))
);

alter table public.triage_cases enable row level security;

create policy "Anyone can view triage cases"
  on public.triage_cases for select using (true);

create policy "Anyone can update triage cases"
  on public.triage_cases for update using (true) with check (true);

alter publication supabase_realtime add table public.triage_cases;
alter table public.triage_cases replica identity full;

insert into public.triage_cases
  (created_at, channel, mode, language, chief_complaint, flow, urgency, red_flag, postcode, is_dengue_hotspot, recommended_clinic, triage_summary, status)
values
  (now() - interval '3 minutes', 'web', 'citizen', 'English', 'Crushing chest pain radiating to left arm, sweating', 'general', 'emergency', true, '50480', false, 'HKL Emergency Department', 'Male patient reports sudden onset crushing substernal chest pain radiating to left arm with diaphoresis for 20 minutes. High suspicion of acute coronary syndrome. Immediate emergency referral.', 'new'),
  (now() - interval '11 minutes', 'whatsapp', 'citizen', 'Malay', 'Muka senget, tangan kanan lemah tiba-tiba', 'general', 'emergency', true, '52100', false, 'HKL Stroke Unit', 'Patient (family-reported) with sudden facial droop and right-arm weakness onset ~40 min ago. FAST positive. Stroke protocol — window for thrombolysis still open. Refer immediately.', 'escalated'),
  (now() - interval '24 minutes', 'whatsapp', 'citizen', 'Malay', 'Demam hari ke-3, sakit kepala, badan lenguh', 'dengue', 'urgent', false, '52100', true, 'Klinik Kesihatan Setapak', 'Day 3 fever in dengue hotspot (Setapak, 12 active cases). Headache and myalgia, no warning signs yet. Needs NS1/FBC today; warn about platelet drop on day 4-6.', 'new'),
  (now() - interval '38 minutes', 'web', 'anonymous', 'English', 'Fever 4 days, rash on arms, gum bleeding when brushing', 'dengue', 'urgent', false, '50480', true, 'MERCY Malaysia Chow Kit', 'Day 4 fever with petechial rash and minor mucosal bleeding in dengue hotspot. Warning signs present — needs same-day FBC + dengue serology. Anonymous mode: do not share with MOH.', 'new'),
  (now() - interval '52 minutes', 'whatsapp', 'citizen', 'Tamil', 'காய்ச்சல் இரண்டு நாட்களாக, தலைவலி', 'dengue', 'routine', false, '51000', false, 'Klinik Kesihatan Jinjang', 'Day 2 fever with headache, area not currently flagged as hotspot. Advise hydration, paracetamol, return if fever persists past day 3 or warning signs develop.', 'reviewed'),
  (now() - interval '1 hour 18 minutes', 'web', 'citizen', 'English', 'Mild fever and body ache since yesterday', 'dengue', 'routine', false, '53100', false, 'Klinik Kesihatan Gombak', 'Early non-specific febrile illness, low pretest probability for dengue based on duration and area. Symptomatic care and re-evaluate in 48h.', 'reviewed'),
  (now() - interval '1 hour 45 minutes', 'whatsapp', 'anonymous', 'Bangla', 'কাশি ৩ সপ্তাহ ধরে, রাতে ঘাম, ওজন কমছে', 'tb', 'urgent', false, '50300', false, 'MERCY Malaysia Chow Kit', 'Cough >3 weeks with night sweats and weight loss — classic TB triad. Anonymous mode (migrant). NGO clinic referral for free sputum smear, no IC required.', 'new'),
  (now() - interval '2 hours 10 minutes', 'whatsapp', 'anonymous', 'Tamil', 'மூன்று வாரங்களாக இருமல், சில நேரம் ரத்தம்', 'tb', 'urgent', false, '50300', false, 'MERCY Malaysia Chow Kit', 'Chronic cough with intermittent haemoptysis. High TB suspicion. Anonymous-mode referral to NGO clinic for sputum AFB; advise mask use until evaluated.', 'escalated'),
  (now() - interval '2 hours 40 minutes', 'web', 'citizen', 'English', 'Need refill for metformin and amlodipine', 'ncd', 'routine', false, '50000', false, 'Klinik Kesihatan Tanglin', 'Stable T2DM + hypertension patient seeking medication refill. Last HbA1c 7.1. Route to nearest KK for repeat prescription; no acute concerns.', 'reviewed'),
  (now() - interval '3 hours 5 minutes', 'whatsapp', 'citizen', 'Malay', 'Gula darah 14.2 mmol selepas makan, rasa pening', 'ncd', 'urgent', false, '53000', false, 'Klinik Kesihatan Kepong', 'Post-prandial hyperglycaemia 14.2 mmol/L with dizziness in known diabetic. Needs same-day review for medication adjustment and to exclude DKA symptoms.', 'new'),
  (now() - interval '3 hours 50 minutes', 'web', 'citizen', 'English', 'Blood pressure reading 168/102, mild headache', 'ncd', 'urgent', false, '50100', false, 'Klinik Kesihatan Tanglin', 'Stage 2 hypertension with headache. Not hypertensive emergency (no end-organ symptoms) but needs same-day review to titrate therapy.', 'escalated'),
  (now() - interval '4 hours 30 minutes', 'whatsapp', 'anonymous', 'English', 'Where can I get free health check without IC?', 'general', 'routine', false, null, null, 'MERCY Malaysia Chow Kit', 'Information request from anonymous user about access to care without IC. Provided NGO clinic details and hours; no clinical complaint.', 'reviewed');
