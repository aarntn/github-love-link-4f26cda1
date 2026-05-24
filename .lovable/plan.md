# Make WhatsApp Work — End-to-End

The code is ready. We just need to deploy the backend, give Twilio its webhook URL, and confirm the round-trip writes into `triage_cases`.

## What's already done

- `jagakl/backend/` — full FastAPI app: Twilio webhook, red-flag check, triage flows (dengue / TB / NCD / pharmacy / MyMinda), referrals, Whisper voice notes, Qwen + Llama via Groq.
- `services/supabase_writer.py` — already wired in `routers/triage.py` at 5 completion points. Uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS, so the existing "no INSERT" policy doesn't block it).
- `railway.toml` exists in the repo root.
- Frontend dashboard already reads `triage_cases` live via Supabase realtime.

## Step 1 — Collect secrets you'll need

From your Twilio Console:
- `TWILIO_ACCOUNT_SID` (starts with `AC…`)
- `TWILIO_AUTH_TOKEN`

From Groq (https://console.groq.com — free tier is fine):
- `GROQ_API_KEY`

From Lovable Cloud (already set in this project, copy the values):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Step 2 — Deploy `jagakl/backend/` to Railway

1. Push the repo to GitHub (if not already).
2. railway.com → **New Project → Deploy from GitHub repo** → pick this repo.
3. Settings → **Root Directory** = `jagakl/backend`.
4. Start command (Railway auto-detects from `railway.toml`; if not):
   `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Variables tab — paste all five secrets above, plus:
   - `LANGUAGE_MODEL=qwen/qwen3-32b` (optional; default is Llama 3.3)
   - `WHISPER_MODEL=base`
6. Deploy. Note the public URL: `https://<something>.up.railway.app`.
7. Test: `curl https://<url>/` should return `{"status":"ok",...}`.

Note on Whisper: `faster-whisper` downloads the model on first cold-start (~150 MB). First voice note will be slow; subsequent ones are fast.

## Step 3 — Configure Twilio WhatsApp Sandbox

1. Twilio Console → **Messaging → Try it out → Send a WhatsApp message**.
2. From your phone, send the join code (e.g. `join orange-tiger`) to the sandbox number `+1 415 523 8886`.
3. Same page → **Sandbox settings**:
   - **When a message comes in:** `https://<your-railway-url>/webhook` — `HTTP POST`
   - Save.
4. Send a test message ("hi") from your phone to the sandbox number. You should get the language picker reply.

## Step 4 — Verify the round-trip

1. Run through a full triage on WhatsApp (e.g. pick English → with-IC → "fever" → postcode `52100` → day `3`).
2. Open `/dashboard` in this Lovable preview — the completed case should appear in the Triage Feed within ~1 second (realtime subscription).
3. If it doesn't appear: check Railway logs for `Supabase write_triage_case failed` lines.

## Step 5 (later) — Production WhatsApp sender

The sandbox is fine for demo, but each user must send the `join …` code first and the number is shared. For real users you need:
- A Meta Business Manager account
- A WhatsApp Business sender approved through Twilio (1–2 weeks)
- Pre-approved message templates for outbound notifications

Not needed for the hackathon / pilot.

## Technical notes

- Frontend stays on Lovable Cloud, no changes needed.
- Backend secrets live in Railway, **not** in Lovable — `add_secret` is for the TanStack app's runtime, which doesn't talk to Twilio.
- `triage_cases` RLS currently blocks INSERT for `public`, but `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS, so writes will succeed. No migration needed.
- Voice notes work out of the box once the model downloads.
- The two existing `jagakl/lovable/` files (older standalone chat UI) are unused on Railway — only `jagakl/backend/` is deployed.

## What I'll do if you approve

There's nothing to code — this is a deployment + configuration task you drive on Railway and Twilio. After you've completed Step 2, share the Railway URL and I can:
- curl the `/webhook` endpoint to confirm it's reachable
- tail Railway logs through your next test message
- fix any issues that come up (e.g. missing env var, Twilio signature, Supabase write failures)
