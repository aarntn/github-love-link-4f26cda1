# JagaKL

> *"Tiada IC tak apa. Boleh cakap apa-apa bahasa. Kami tak akan beritahu sesiapa."*
> *"No IC, no problem. Speak any language. We won't tell anyone."*

A WhatsApp-first, multilingual AI triage copilot built for Kuala Lumpur's most underserved populations — migrants, refugees, foreign domestic workers, elderly NCD patients, and B40 urban poor.

**We are not building an AI doctor. We are building the multilingual nurse-and-pharmacist that 661M ASEAN patients don't have.**

---

## The Problem

Malaysia's public healthcare system is at a breaking point:

- **1:406** national doctor-to-population ratio (masks a worse public-sector shortage)
- **91** Klinik Kesihatan clinics operating beyond designed capacity, some seeing **>800 patients/day**
- **70%** of ER visits are non-critical — preventable with earlier triage
- **~3 million** migrant workers, 1.2–1.5 million in irregular status, largely excluded from digital health tools
- **122,423** dengue cases in 2024; KL/Putrajaya is consistently the second-worst region nationally
- **15.6%** adult diabetes prevalence; 84% of 18–29-year-olds with diabetes don't know they have it

Existing Malaysian healthtech (MySejahtera, DoctorOnCall, BookDoc) is built for citizens with smartphones, IC numbers, and Klang Valley addresses — none of which the highest-need users have.

---

## What JagaKL Builds

Three KL-specific wedges that no shipped product currently covers together:

| Wedge | What it does | Why it's unbuilt |
|---|---|---|
| **Anonymous migrant channel** | No IC, no app download, no data retention — routes to NGO clinics | Immigration Act fear keeps refugees from MOH facilities |
| **Dengue-aware fever triage** | Pulls live iDengue hotspot data and adjusts escalation thresholds by postcode | iDengue exists as a map only; no chatbot integrates it into per-user decisions |
| **KK/pharmacy NCD companion** | Photo-of-prescription OCR → multilingual medication counselling + refill reminders | Government pharmacy slips have no digital companion |

---

## Architecture

```
WhatsApp (Twilio)
      │
      ▼
  webhook.py  ──────────────────────────────►  redflag.py (ALWAYS RUNS FIRST)
      │                                              │
      │                                    chest pain / stroke / breathing
      │                                    difficulty → "Call 999" immediately
      │                                    (bypasses LLM entirely)
      ▼
  session.py (in-memory state, no DB)
      │
      ├── lang_detect.py  (Mesolitica lang-id: Manglish/BM/Tamil/Bangla/BI)
      │
      ├── Citizen mode ──────────────────► MySejahtera deep-link
      │
      └── Anonymous mode ─────────────► NGO clinic list (no MOH reporting)
                │
                ▼
           triage.py
          /    |    \
    Dengue    TB    NCD
      │        │      │
   idengue   7-Q    OCR
    API     screen  scan
      │        │      │
      └────────┴──────┘
                │
           llm.py (Malaysian-Mistral + BioMistral via Ollama)
                │
           referral.py
                │
           WhatsApp reply
```

---

## Five Clinical Flows

### 1. Demam → Dengue Smart-Triage
User provides postcode → `idengue.py` fetches live hotspot status → adaptive thresholds:
- **Day 1–2:** symptomatic care advice
- **Day 3–5 in hotspot OR warning signs** (vomiting, abdo pain, mucosal bleed, lethargy): mandatory FBC/NS1 referral
- Generates a one-tap WhatsApp message the user can show at the clinic

### 2. Batuk Lama → TB Screen
7-question WHO chronic-cough screen (>2 weeks, night sweats, weight loss, hemoptysis). If positive in Anonymous mode → routes to MSF, MERCY KL, Tzu Chi, PT Foundation. **Never auto-reports to MOH.**

### 3. Kencing Manis / HTN Companion
Daily glucometer/BP log via voice, weekly trend PDF for next Klinik Kesihatan visit. Photo-of-prescription OCR explains each medication in the user's mother tongue with timing reminders.

### 4. MyMinda+
PHQ-2 → PHQ-9 in Bahasa Melayu / Tamil / Mandarin / Bahasa Indonesia. Crisis escalation to Befrienders KL, Talian Kasih 15999, MIASA. Fills the gap MyMinda leaves (Bahasa/English only, IC-gated).

### 5. Pharmacy Queue Beat
User photographs Klinik Kesihatan SMART card → bot reads next refill date, provides UMP (Ubat Melalui Pos) instructions, pre-fills Value-Added Services request.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Channel | WhatsApp Business API via Twilio sandbox |
| Backend | Python + FastAPI |
| LLM | Malaysian-Mistral-7B-32K (Mesolitica) + BioMistral-7B via Ollama (4-bit, single 16GB GPU) |
| Symptom logic | Infermedica API (`/diagnosis`, `/triage`, `/parse`) |
| Language detection | Mesolitica lang-id |
| Dengue data | `idengue.mysa.gov.my` + `data.gov.my` CKAN API (no key required) |
| RAG embeddings | Mesolitica Malaysian Embedding Llama2-2B + LlamaIndex |
| OCR | Tesseract + regex post-processor for KKM medication patterns |
| Voice (stretch) | Whisper-large-v3 fine-tuned for code-switch / Mesolitica STT |
| Hosting | Hugging Face Spaces (free CPU) or Cloudflare Workers AI free tier |

---

## Project Structure

```
jagakl/
├── backend/
│   ├── main.py              # FastAPI app, route registration
│   ├── webhook.py           # Twilio WhatsApp webhook handler
│   ├── session.py           # In-memory conversation state (keyed by phone number)
│   ├── requirements.txt
│   ├── .env.example
│   ├── routers/
│   │   ├── triage.py        # Dengue · TB · NCD conversation flows
│   │   ├── redflag.py       # Hardcoded emergency rules (bypasses LLM)
│   │   └── referral.py      # NGO clinic routing logic
│   └── services/
│       ├── llm.py           # Ollama / BioMistral call wrapper
│       ├── lang_detect.py   # Mesolitica language identification
│       └── idengue.py       # iDengue hotspot API fetch
├── data/
│   ├── ngo_clinics.json     # MSF · MERCY · Tzu Chi · PT Foundation contacts
│   └── tb_questions.json    # WHO 7-question TB screen (multilingual)
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Privacy Architecture

This is the slide that wins judges.

- **Stateless Infermedica calls** — no PII stored on their side
- **LLM runs locally** via Ollama — no data leaves the server
- **Conversation history** encrypted with a key tied to the user's WhatsApp number, auto-deleted after 30 days
- **"Forget me" command** — wipes all session data on demand
- **Anonymous mode** — NEVER shares data with MOH, Immigration, or employer
- Mapped to **Malaysia PDPA 2010 (amended June 2025)**: mandatory DPO, 72-hour breach notification, data minimisation

---

## Safety Layer

Three-layer safety net — this is what separates JagaKL from 80% of hackathon submissions:

1. **Layer 1 — Deterministic red-flag engine** (`redflag.py`): string matching + regex on chief complaint. Runs before the LLM. Hard-coded patterns: chest pain + radiation/sweating, sudden focal neuro deficit (FAST), difficulty breathing/cyanosis, pregnancy bleeding, pediatric IMCI danger signs, suicidality. Output: "Call 999/991" — immediate, no LLM in the loop.

2. **Layer 2 — LLM differential** (`llm.py` + `triage.py`): Infermedica `/triage` returns MTS-aligned urgency level. LLM output is advisory only, never authoritative.

3. **Layer 3 — Human escape hatch**: every self-care recommendation includes a one-tap "talk to a doctor" option via DoctorOnCall or the nearest NGO clinic.

> LLMs under-triage 51.6% of true emergencies (Nature Medicine, 2026). Hard-coded red-flag detection is non-negotiable.

---

## Regulatory Positioning

Declared as a **"decision support tool, not a medical device"** — consistent with Infermedica API ToS and MDA Act 737 positioning guidance.

- **PDPA 2010 (amended June 2025)** — consent screen, data minimisation, 72-hour breach notification, DPO appointment
- **MDA Act 737** — no diagnosis returned; information about possible conditions and recommended care setting only
- **ASEAN Guide on AI Governance & Ethics (Feb 2024)** — transparency, human-in-loop, hallucination risk disclosed
- **MMC Confidentiality Guidelines** — no clinician relationship implied; always recommend registered practitioner

---

## Getting Started

### Prerequisites
- Python 3.11+
- [Ollama](https://ollama.com) with `biomistral` or `malaysian-mistral` pulled
- Twilio account (free sandbox)
- Infermedica developer API key (free tier)

### Setup

```bash
cd backend
cp .env.example .env
# Fill in TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, INFERMEDICA_APP_ID, INFERMEDICA_APP_KEY

pip install -r requirements.txt
uvicorn main:app --reload
```

### Expose locally for Twilio webhook
```bash
ngrok http 8000
# Set the ngrok URL as your Twilio WhatsApp sandbox webhook
```

---

## Demo Script (3 minutes for judges)

**Scene 1 — Migrant + Dengue + iDengue API:**
Bangladeshi worker in Kepong sends a Bangla voice note: *"3 days fever, headache."* Bot replies in Bangla, asks postcode. Postcode 52100 → iDengue confirms hotspot → Bot: *"Pergi NS1 test sekarang. MERCY mobile clinic — tak perlu IC. RM30."* With map link.

**Scene 2 — Elderly NCD + Prescription OCR:**
Auntie in Sentul PPR photos her Klinik Kesihatan slip. Bot reads it, explains Metformin dosing in Bahasa. Detects she spoke Tamil earlier — sends Tamil version too.

**Scene 3 — Domestic worker + Women's health:**
Filipino worker types in Tagalog-English: *"Madam not happy if I go clinic. I have lump in breast."* Bot triages, explains free FRHAM mammogram options, generates discreet appointment link.

---

## Team

Built at Vibeathon 2026.

---

## Disclaimer

This tool provides health information and care navigation. **It is not a substitute for diagnosis or treatment by a registered medical practitioner.** In an emergency, call **999**.
