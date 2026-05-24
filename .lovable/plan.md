## Context

The backend is ready: `triage_cases` table exists with 12 seeded rows, RLS enabled, and realtime is active. The frontend still shows the old JagaKL landing page. We need to replace it entirely with the Klinika clinician copilot dashboard.

## Design System

Update `src/styles.css` with medical-professional tokens:
- Primary: teal `#0D9E75`
- Destructive: coral `#D85A30` (emergencies)
- Warning: amber `#BA7517` (urgent)
- Clean white background, generous spacing
- Inter font (already linked in previous setup)

## 1. Sidebar Navigation Component

Create `src/components/klinika/AppSidebar.tsx`:

- Fixed left sidebar, `w-[220px]`, full viewport height (`h-screen`), `position: fixed`
- Klinika wordmark at top (text logo, no image)
- Three nav items vertically stacked with Lucide icons:
  - Live Cases (`Activity` icon)
  - Clinician View (`Stethoscope` icon)
  - Impact (`BarChart3` icon)
- Active item: teal `#0D9E75` background pill (`rounded-lg`), white text, subtle shadow
- Inactive: muted gray text (`text-muted-foreground`), hover `bg-muted/50`
- Each item is a button that sets local active-tab state (not route navigation — single-page dashboard)

Mobile (< 768px):
- Sidebar hidden by default
- Hamburger menu button (`Menu` icon) in a floating top-left header bar
- Click opens a Sheet/drawer overlay from the left with the same nav items
- Drawer closes on item selection or outside click

## 2. Main Dashboard Layout

Replace `src/routes/index.tsx` with the Klinika dashboard:

```
<div className="flex min-h-screen bg-background">
  <AppSidebar activeTab={tab} onTabChange={setTab} />
  <main className="flex-1 ml-[220px] p-6 overflow-auto">
    {tab === 'live' && <LiveCasesTab />}
    {tab === 'clinician' && <ClinicianTab />}
    {tab === 'impact' && <ImpactTab />}
  </main>
</div>
```

On mobile: `ml-0` (no left margin), add top padding for the hamburger header.

## 3. Data Hook

Create `src/hooks/useTriageCases.ts`:
- Fetches all rows from `triage_cases` via Supabase browser client
- Subscribes to realtime `postgres_changes` on `triage_cases`
- Returns `{ cases, isLoading, error, updateStatus }`
- `updateStatus(id, status)` calls `.update().eq('id', id)` for marking reviewed/escalated
- Optimistic updates: update local state immediately, rollback on error

## 4. Live Cases Tab

Create `src/components/klinika/LiveCasesTab.tsx`:

- Filter bar: urgency dropdown (all/ emergency/ urgent/ routine), flow dropdown (all/ dengue/ tb/ ncd/ general)
- Sort: red_flag=true first, then created_at desc
- Case cards in a responsive grid (1 col mobile, 2 col tablet, 3 col desktop):
  - Channel icon + language pill
  - Flow tag (colored badge)
  - Urgency badge (coral/amber/teal dot + text)
  - Chief complaint (truncated)
  - Time-ago (date-fns `formatDistanceToNow`)
  - Recommended clinic
  - Red flag banner if true (coral background strip)
- Click card → Sheet slides in from right with full case details
- Sheet content: all fields displayed read-only, status badge, close button

## 5. Clinician View Tab

Create `src/components/klinika/ClinicianTab.tsx`:

- Header with counter chip: "X cases needing attention" (status = 'new' or 'escalated')
- Same card grid but filtered to `status IN ('new', 'escalated')`
- Sort: urgency desc (emergency > urgent > routine), then created_at desc
- Each card shows action buttons:
  - "Mark Reviewed" → sets status='reviewed', card exits with framer-motion slide-out
  - "Escalate" → sets status='escalated', card pulses amber briefly
- Optimistic UI: button disabled + spinner while pending, card removed on success
- Framer-motion `AnimatePresence` for smooth card exit animations

## 6. Impact Tab

Create `src/components/klinika/ImpactTab.tsx`:

- Four stat cards in a row (2x2 mobile, 4 col desktop):
  - Total cases (count all)
  - Red flags (count red_flag=true)
  - Dengue hotspots (count flow='dengue' AND is_dengue_hotspot=true)
  - Anonymous TB screens (count flow='tb' AND mode='anonymous')
- Recharts bar chart: cases by flow category (dengue, tb, ncd, general)
- Recharts donut chart: cases by channel (web, whatsapp)
- Recharts horizontal bar: top 5 recommended clinics by referral count
- Table below charts: all clinics with referral counts, sorted desc
- All charts read live from the cases array (no separate queries)

## 7. Supporting Files

Create `src/lib/klinika.ts`:
- `TriageCase` interface matching the DB schema
- `Urgency` and `Status` union types
- `Flow` union type
- Helper: `urgencyRank(urgency)` for sorting
- Helper: `flowLabel(flow)` for display names
- Helper: `timeAgo(date)` wrapping date-fns

## 8. Shared UI Components

Create `src/components/klinika/CaseCard.tsx`:
- Reusable card component used by both LiveCasesTab and ClinicianTab
- Props: `case`, `onClick`, `actions?` (optional buttons for clinician view)
- Consistent styling with badges, icons, and truncation

Create `src/components/klinika/CaseDetailSheet.tsx`:
- Sheet with full case details
- Props: `case`, `open`, `onClose`

Create `src/components/klinika/badges.tsx`:
- `UrgencyBadge`, `FlowBadge`, `StatusBadge`, `LanguageBadge`
- Each returns a styled pill with appropriate color

## 9. Dependencies

Install:
- `framer-motion` (card exit animations, sheet transitions)

Already installed:
- `recharts`, `date-fns`, `lucide-react`, `@tanstack/react-query`, `vaul` (for Sheet/Drawer)

## 10. Cleanup

Remove or deprecate:
- Old JagaKL routes (`chat.tsx`, `dashboard.tsx`, `session.$phone.tsx`)
- Old JagaKL components (`src/components/jagakl/`)
- Old JagaKL hooks (`useChat.ts`, `useSession.ts`, `useSessions.ts`)
- Old navbar from `__root.tsx` (Klinika dashboard is now the single-page app at `/`)

Update `__root.tsx` head metadata to "Klinika — AI Triage Dashboard".

## Responsive Behavior

- Desktop (>= 768px): fixed sidebar visible, main content has left margin
- Tablet: sidebar visible, content grid adjusts to 2 columns
- Mobile (< 768px): hamburger menu, sidebar hidden, drawer overlay, content single column
