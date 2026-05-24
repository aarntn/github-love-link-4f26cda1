Restyle every card surface in the dashboard to match the reference: airy white cards with extra-rounded corners, a thin hairline border, a small header strip (status dot + uppercase tracked label on the left, muted meta on the right) separated by a divider, generous padding, uppercase tiny labels above large numbers, and a soft pill footer where applicable.

## Scope (all card surfaces)

1. **`CaseCard.tsx`** (Live Cases + Clinician queue)
   - Container: `rounded-3xl border border-border/70 bg-card p-5` with no hover shadow — only border darken on hover.
   - Header row: small status dot (green / amber / red driven by urgency) + `LIVE · TRIAGE` style uppercase `text-[11px] tracking-[0.18em] text-muted-foreground font-semibold` label on the left; case ID / short code on the right in the same muted uppercase style.
   - Hairline divider (`border-t border-border/60`) under the header.
   - Three-column grid of metrics: **LANGUAGE**, **FLOW**, **CLINIC** — uppercase tiny labels, value in `text-base font-medium` (clinic truncates to 1 line). For red-flag cases, swap one cell to show `RED FLAG` in destructive color instead of a top banner.
   - Replace chief complaint block: render as quoted single-line under the metrics in normal weight.
   - Footer: soft rounded-full pill (`bg-primary/10 text-primary`) showing urgency + flow status (e.g. `● ROUTINE · DENGUE`), with `timeAgo` muted on the right. Action buttons (Clinician tab) move into this footer row, right-aligned, as ghost icon-only buttons.

2. **`ImpactTab` StatCard**
   - Same `rounded-3xl` shell, hairline divider header with uppercase label + tiny status dot, value rendered large (`text-4xl font-semibold tracking-tight`) with unit/suffix small next to it, optional sparkline bar row below using muted bars.

3. **Impact chart panels & table panel**
   - Apply the same shell (`rounded-3xl`, header strip with uppercase label + divider, p-6). Charts keep current data but inherit the new container.

4. **Badges (`badges.tsx`)**
   - Add a new `TelemetryPill` variant (rounded-full, dot + uppercase tracked text) used by the card footer. Existing `UrgencyBadge`/`FlowBadge` stay available for the detail sheet.

## Tokens / utilities
- No new colors needed — reuse `--primary` (teal) for the "on route" pill, `--warning` for urgent, `--destructive` for emergency/red-flag.
- Introduce a small reusable `<CardShell>` (header label + optional meta + divider + children) inside `src/components/klinika/` so all three tabs share one component and stay consistent.

## Out of scope
- Sidebar, detail sheet, filters, and data/business logic remain unchanged.
- No font swap; keep Inter.

## Files touched
- `src/components/klinika/CaseCard.tsx` (rewrite layout)
- `src/components/klinika/ImpactTab.tsx` (StatCard + chart/table panels use new shell)
- `src/components/klinika/badges.tsx` (add `TelemetryPill`)
- `src/components/klinika/CardShell.tsx` (new)
