# Refero Styles Audit for Detso

**Date:** 2026-10-16  
**Source:** [Refero Styles](https://styles.refero.design/)  
**Scope:** Detso mobile technician app, owner/admin operations dashboard, login, tickets, schedules, topology, and MikroTik monitoring.

## Recommendation

Use **Stripe as the primary visual reference**, with selected interaction patterns from **Raycast**.

- **Stripe** fits Detso's operational data: light canvas, deep navy text, restrained single accent, crisp rules, compact 4px controls, tabular numerals, and no decorative shadows. It maps well to customer tables, ticket queues, schedules, KPI cards, and billing screens.
- **Raycast** is useful as a secondary reference for monitoring and command-center surfaces: dark mode, 8px spacing grid, high-contrast technical UI, keyboard/shortcut affordances, and dense panels.
- Do **not** copy either system literally. Preserve Detso's existing teal/cyan network semantics and accessibility states; Refero pages are style references, not a replacement for product-specific status colors.

## Candidates Reviewed

| Candidate | Refero source | Relevant traits | Detso fit |
|---|---|---|---|
| **Stripe** | [Stripe style](https://styles.refero.design/style/48e5de76-05d5-4c4e-a269-c7c245b291ec) | Cool-white canvas; deep navy `#061b31`; indigo `#533afd`; 8px base spacing; 4px cards/inputs/buttons; no shadows; tabular numerals; dense financial-instrument/ledger feel. | **Primary.** Excellent for owner/admin operations, login, customer/service tables, tickets, schedules, and billing. Needs adaptation for mobile touch targets and operational statuses. |
| **Raycast** | [Raycast style](https://styles.refero.design/style/3b6a17f0-3bdf-418c-a95e-0b89e5a8b2f8) | Near-black canvas `#040506`; Inter; 8px grid; 8px controls and 16–20px cards; hairline/inset elevation; technical command-center feel; neutral controls with limited accent. | **Secondary.** Strong for MikroTik monitoring, network topology, logs, and dark mode. Too dark and too desktop-command-center-oriented as the default field mobile theme. |
| **Mercury** | [Mercury style](https://styles.refero.design/style/3172cd4d-118a-4a16-a259-6b634d32322e) | Dark banking aesthetic; `#171721` canvas; graphite cards; cobalt `#5266eb`; 12px cards; 32px pill controls; spacious 72px rhythm. | Good for premium owner dashboard or dark financial views. Not ideal for field technicians: pills and low-light palette reduce dense operational scanability outdoors. |
| **Vercel** | [Vercel style](https://styles.refero.design/style/f24daf3a-d43f-4dec-85a9-8ac1d5148a03) | Near-monochrome `#fafafa`; black/charcoal type; Geist Sans + Geist Mono; 4px grid; 6px controls; hairline borders; compact engineering-notebook density. | Useful for technical metadata and router diagnostics. Too monochrome for Detso's ticket priority, service status, health, and network-type semantics. |
| **Figma** | [Figma style](https://styles.refero.design/style/5fd3b3b4-02ab-456a-87aa-e4395636b671) | Light creative-tool/gallery language, neutral workspace, visual canvas emphasis. | Useful only for topology-map editing concepts. Too design-tool-oriented for customer operations and field dispatch. |
| **Intercom** | [Intercom style](https://styles.refero.design/style/12255b63-e506-4bc1-a4cd-d05487de32f3) | Warm editorial/customer-communication language. | Useful for support/ticket copy patterns, but warmth and editorial surfaces conflict with Detso's telecom/infrastructure character. |

## Why Stripe Is the Best Base

Refero describes Stripe as a near-monochrome financial-instrument language with a cool-white canvas, deep navy text, a single indigo action color, crisp rules, and no shadows. These traits match Detso's highest-frequency tasks:

1. **Information density:** ISP operators need to compare customers, packages, service connections, ticket priority, schedules, and router metrics quickly.
2. **Trust:** Deep navy, white surfaces, restrained color, and clear hierarchy are appropriate for customer identity and payment-related workflows.
3. **Status clarity:** A restrained base palette leaves room for functional status colors—active/success, warning, error, suspended, and offline—without making the entire UI noisy.
4. **Existing code compatibility:** Detso already has centralized theme tokens, light/dark support, cards, badges, tables/lists, and semantic status colors. Stripe's spacing, border, and surface discipline can be adopted without replacing the component architecture.
5. **Google Stitch promptability:** The style is easy to specify as tokens: cool-white background, deep navy text, indigo primary action, 8px grid, crisp 4px/8px controls, no heavy shadows, dense but readable tables.

## Recommended Detso Adaptation

### Base tokens

| Token | Recommended Detso value | Source / reason |
|---|---|---|
| Light canvas | `#F8FAFC` or current light surface | Stripe's cool-white canvas, adapted to existing slate theme. |
| Primary text | `#0F172A` | Existing Detso slate-900; close to Stripe's midnight ink. |
| Secondary text | `#475569` / `#64748B` | Existing slate scale; maintain readable helper text. |
| Primary action | Existing Detso teal `#0F766E` or a dedicated blue/indigo action token | Keep brand continuity. Use one primary action per surface, as Stripe does. |
| Network accent | Existing cyan `#06B6D4` | Preserve network/topology identity. |
| Success | Existing emerald `#10B981` | Functional status only. |
| Warning | Existing amber `#F59E0B` | Functional status only. |
| Error/urgent | Existing red `#EF4444` | Functional status only. |
| Border | `#E2E8F0` | Existing slate-200; thin structural rules. |
| Card radius | 8px on mobile, 6–8px on web | Stripe's precision adapted for touch surfaces. |
| Touch controls | Minimum 44×44dp | Required for field use; overrides Stripe's compact visual controls. |
| Grid | 4px base, 8px primary rhythm | Combines Vercel/Stripe discipline with existing NativeWind conventions. |

### Status color policy

Do not use the Stripe/Raycast single-accent rule for operational states. Detso needs semantic colors:

- **ACTIVE / ONLINE / RESOLVED:** emerald, with icon/text and not color alone.
- **SCHEDULED / IN_PROGRESS / INFO:** teal or blue.
- **SUSPENDED / WARNING / HIGH:** amber.
- **URGENT / OFFLINE / ERROR:** red.
- **INACTIVE / CANCELLED / MUTED:** slate.

Every status badge should include a text label or icon, not color alone. This is essential for outdoor visibility and color-vision accessibility.

## Surface-by-Surface Choice

| Detso surface | Primary reference | Implementation direction |
|---|---|---|
| Login | Stripe | White/cool-white surface, deep navy heading, one teal/indigo CTA, compact 8px grid, clear error block, no decorative background overload. |
| Technician dashboard | Stripe + existing Detso tokens | Light high-contrast cards, 2-column metric layout on narrow devices, 44dp touch targets, strong status badges, pull-to-refresh. |
| Owner/admin dashboard | Stripe | Dense tables, crisp dividers, tabular metrics, restrained cards, filter/search hierarchy. |
| Ticket queue | Stripe | Priority/status columns, compact row rhythm, clear action buttons, no excessive rounded pills. |
| Work schedule | Stripe | Calendar/date strip with strong today state and clear time hierarchy. |
| Network map editor | Figma interaction ideas + Detso network tokens | Map is the canvas; use bottom sheets and toolbars, not a full Figma visual skin. |
| MikroTik monitoring | Raycast secondary | Dark optional monitoring mode, dense telemetry panels, monospace labels for interfaces/hosts, high-contrast charts. |
| Billing / Siklus Uang | Stripe + Mercury restraint | Ledger-like invoice/payment tables; use Mercury-like dark mode only as an optional financial theme, not the default. |

## Google Stitch Prompt Direction

Use this as the design-system preamble before asking Stitch to create Detso screens:

```text
Design a trustworthy B2B ISP operations product inspired primarily by Stripe's indigo-ink ledger system and secondarily by Raycast's technical command-center density. Use a cool-white/slate canvas, deep navy text, thin slate borders, an 8px spacing rhythm, compact 6–8px card/input radii, and no heavy drop shadows. Keep one primary action color per surface. Preserve Detso's semantic operational colors: teal/cyan for network and active work, emerald for success/online, amber for warning/suspended, red for urgent/offline/error, and slate for inactive/cancelled. Use tabular numerals for KPIs. For field mobile screens, keep contrast high, use minimum 44dp touch targets, large readable labels, explicit text status labels, and avoid low-contrast gray text. The visual tone should be precise, calm, technical, and operational—not playful, editorial, or overly decorative.
```

## What Not to Adopt

- Do not use Mercury's all-dark premium banking look as the entire Detso app: field technicians need outdoor readability.
- Do not use Raycast's coral accent: it conflicts with Detso's existing teal/cyan network language and status semantics.
- Do not copy Vercel's near-monochrome rule literally: Detso requires multiple semantic states for tickets, services, router health, and schedules.
- Do not use large editorial hero sections on operational screens: they consume vertical space needed for tickets, schedules, customer data, and metrics.
- Do not reduce controls to visual 4–6px compactness if it makes the hit area smaller than 44dp.

## Sources

- [Refero Styles directory](https://styles.refero.design/) — directory describes the library as AI-readable design systems with colors, typography, spacing, components, and DESIGN.md references.
- [Stripe style reference](https://styles.refero.design/style/48e5de76-05d5-4c4e-a269-c7c245b291ec)
- [Raycast style reference](https://styles.refero.design/style/3b6a17f0-3bdf-418c-a95e-0b89e5a8b2f8)
- [Mercury style reference](https://styles.refero.design/style/3172cd4d-118a-4a16-a259-6b634d32322e)
- [Vercel style reference](https://styles.refero.design/style/f24daf3a-d43f-4dec-85a9-8ac1d5148a03)
- [Figma style reference](https://styles.refero.design/style/5fd3b3b4-02ab-456a-87aa-e4395636b671)
- [Intercom style reference](https://styles.refero.design/style/12255b63-e506-4bc1-a4cd-d05487de32f3)
