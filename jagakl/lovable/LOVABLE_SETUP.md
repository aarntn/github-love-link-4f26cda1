# JagaKL — Lovable Frontend Setup

## 1. Environment variable

In your Lovable project settings → Environment variables, add:

```
VITE_API_URL=https://<your-railway-or-render-url>
```

For local dev: `VITE_API_URL=http://localhost:8000`

## 2. Files to paste into Lovable

Copy these into your Lovable project's `src/` directory as-is:

```
src/
  App.tsx                         ← router (replaces Lovable's default)
  lib/
    types.ts                      ← all TypeScript types
    api.ts                        ← fetch wrapper for every backend endpoint
  hooks/
    useChat.ts                    ← chat state (send, messages, loading, flag)
    useSessions.ts                ← sessions list + delete + clear-all
    useSession.ts                 ← single session (auto-polls every 5 s)
  components/
    ChatWidget.tsx                ← drop-in WhatsApp-style chat UI
    Dashboard.tsx                 ← clinician dashboard with stats + search
    SessionCard.tsx               ← session row card
  pages/
    ChatPage.tsx                  ← /chat route
    DashboardPage.tsx             ← /dashboard route
    SessionDetailPage.tsx         ← /session/:phone route
```

## 3. Required npm packages

Lovable already bundles React, Tailwind, and react-router-dom.
No extra dependencies needed.

## 4. Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/chat` | ChatPage | Patient-facing chat |
| `/dashboard` | DashboardPage | Clinician session monitor |
| `/session/:phone` | SessionDetailPage | Per-patient vitals + history |

## 5. Backend API endpoints consumed

| Method | Path | Used by |
|--------|------|---------|
| POST | `/chat` | useChat |
| GET | `/sessions` | useSessions |
| GET | `/session/{phone}` | useSession |
| DELETE | `/session/{phone}` | useSessions.remove |
| POST | `/sessions/reset-all` | useSessions.clearAll |
| GET | `/` | health check (optional) |

## 6. Demo scenario for judges

1. Open `/chat` → type anything → onboarding starts in the detected language
2. Select language (1–5) and mode (1 or 2)
3. Type "fever" → dengue triage
4. Open `/dashboard` → see the session appear in real time
5. Click the session → see conversation history
