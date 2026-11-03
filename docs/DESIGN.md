# Detso Design System

> Minimal, trustworthy, and field-ready design system for ISP operations.
>
> **Canonical source:** `docs/DESIGN.md`  
> **Applies to:** `frontend/`, `detso-mobile/`, Google Stitch prompts, and product design reviews.

## 1. Product Character

Detso is a professional infrastructure operations platform for regional Internet Service Providers. It helps owners, operations staff, and field technicians manage customers, service connections, tickets, schedules, network topology, and MikroTik monitoring.

The interface must feel:

- Calm
- Precise
- Trustworthy
- Technical
- Operational
- Easy to scan under pressure

Avoid a playful consumer-app style, decorative gradients, excessive glassmorphism, oversized hero sections, and animation that does not clarify state or hierarchy.

## 2. Design Principles

1. **Information before decoration.** Users should understand the next action and current status before noticing visual polish.
2. **One primary action per surface.** Do not compete with multiple filled buttons.
3. **Status is explicit.** Use a status label and icon in addition to color. Never communicate critical status through color alone.
4. **Field-ready interaction.** Every mobile touch target is at least 44 × 44 dp, including icon-only controls.
5. **Same product, two themes.** Light and dark themes share the same layout, component hierarchy, spacing, and interaction model.
6. **Color has meaning.** Brand and network accents are limited; semantic colors are reserved for operational states.
7. **Every data surface has complete states.** Design loading, empty, error, retry, success, and offline/degraded states—not only the populated state.
8. **Progressive disclosure.** Show the most important operational facts first; place secondary details in a detail screen, bottom sheet, or expandable section.
9. **Readable under pressure.** Prefer clear hierarchy and high contrast over compactness that makes field work difficult.
10. **Reuse tokens and components.** Do not introduce one-off colors, radii, typography, or interaction patterns without updating this document.

## 3. Theme Modes

Supported modes:

- `system`: follow the device or browser preference; default.
- `light`: always use the light theme.
- `dark`: always use the dark theme.

Theme switching must not change content order, navigation structure, component semantics, or action placement. Only color, contrast, and elevation treatment may change.

### 3.1 Light Theme Tokens

The light theme is the default for customer operations, ticketing, scheduling, maps, and field work.

| Token | Value | Usage |
|---|---|---|
| `background` | `#F8FAFC` | App and page background |
| `surface` | `#FFFFFF` | Cards, sheets, input fields |
| `surfaceElevated` | `#FFFFFF` | Dialogs and raised content; distinguish with border, not a heavy shadow |
| `text` | `#0F172A` | Primary text and headings |
| `textSecondary` | `#475569` | Descriptions and secondary values |
| `textMuted` | `#64748B` | Captions and helper text; not for essential content |
| `textDisabled` | `#94A3B8` | Disabled content |
| `border` | `#E2E8F0` | Dividers, card borders, input borders |
| `borderStrong` | `#CBD5E1` | Focus-adjacent or emphasized boundaries |
| `primary` | `#0F766E` | Primary action and brand identity |
| `primaryPressed` | `#115E59` | Pressed/active primary control |
| `primarySoft` | `#F0FDFA` | Subtle primary background |
| `network` | `#06B6D4` | Network/topology accent |
| `networkSoft` | `#ECFEFF` | Network background tint |

### 3.2 Dark Theme Tokens

The dark theme is optimized for low-light work, owner analytics, and router monitoring. It must maintain readable contrast and avoid pure-black surfaces.

| Token | Value | Usage |
|---|---|---|
| `background` | `#0B1220` | App and page background |
| `surface` | `#111827` | Cards, sheets, input fields |
| `surfaceElevated` | `#172033` | Dialogs, selected cards, raised content |
| `text` | `#F8FAFC` | Primary text and headings |
| `textSecondary` | `#CBD5E1` | Descriptions and secondary values |
| `textMuted` | `#94A3B8` | Captions and helper text |
| `textDisabled` | `#64748B` | Disabled content |
| `border` | `#263449` | Dividers, card borders, input borders |
| `borderStrong` | `#3B4A63` | Emphasized boundaries and focus-adjacent borders |
| `primary` | `#2DD4BF` | Primary action and brand identity |
| `primaryPressed` | `#5EEAD4` | Pressed/active primary control |
| `primarySoft` | `#123A3A` | Subtle primary background |
| `network` | `#22D3EE` | Network/topology accent |
| `networkSoft` | `#12343D` | Network background tint |

### 3.3 Semantic Status Tokens

Use these semantic states consistently across tickets, services, schedules, router monitoring, and network maps.

| State | Meaning | Light foreground | Light background | Dark foreground | Dark background |
|---|---|---|---|---|---|
| `success` | Active, online, completed, resolved | `#047857` | `#ECFDF5` | `#6EE7B7` | `#064E3B` |
| `info` | Scheduled, in progress, informational | `#0369A1` | `#F0F9FF` | `#7DD3FC` | `#0C4A6E` |
| `warning` | Warning, suspended, high attention | `#B45309` | `#FFFBEB` | `#FCD34D` | `#78350F` |
| `error` | Urgent, offline, failed, destructive | `#B91C1C` | `#FEF2F2` | `#FCA5A5` | `#7F1D1D` |
| `neutral` | Inactive, cancelled, unknown | `#475569` | `#F1F5F9` | `#CBD5E1` | `#334155` |

Status components must include at least two of the following: text label, icon, color, supporting description. Critical states should use all four when space permits.

## 4. Typography

Use one primary sans-serif family across the product. Prefer **Inter** or the existing platform/system sans fallback. Do not mix multiple decorative fonts in operational screens.

### 4.1 Type Scale

| Name | Mobile size | Web size | Weight | Line height | Usage |
|---|---:|---:|---:|---:|---|
| `display` | 32 px | 48 px | 600 | 1.1 | Login/product headline; use sparingly |
| `h1` | 28 px | 32 px | 600 | 1.15 | Screen or page title |
| `h2` | 22 px | 24 px | 600 | 1.2 | Section heading |
| `h3` | 18 px | 20 px | 600 | 1.25 | Card or group heading |
| `body` | 16 px | 15–16 px | 400 | 1.45 | Main content and descriptions |
| `bodySmall` | 14 px | 14 px | 400 | 1.4 | Secondary content and list metadata |
| `label` | 13 px | 12–13 px | 500 | 1.3 | Form labels, badges, navigation labels |
| `caption` | 12 px | 12 px | 400 | 1.35 | Timestamps and non-critical helper text |
| `metric` | 24–28 px | 28–36 px | 600 | 1.1 | KPI values, counts, bandwidth |

Rules:

- Use sentence case for headings and actions.
- Avoid all-caps except short technical labels such as `ONLINE`, `RX`, and `TX`.
- Use tabular numerals for KPI values, currency, bandwidth, timestamps, and monitoring data where supported.
- Do not use muted text for a value the user must act on.
- Do not encode hierarchy through font weight alone; use size, spacing, and placement as well.

## 5. Spacing, Shape, and Elevation

### 5.1 Spacing

Use a 4 px base unit and an 8 px primary rhythm.

| Token | Value | Typical usage |
|---|---:|---|
| `space-1` | 4 px | Icon/text micro-gap |
| `space-2` | 8 px | Inline gap, compact list padding |
| `space-3` | 12 px | Input content gap, list row gap |
| `space-4` | 16 px | Card padding, standard component gap |
| `space-5` | 20 px | Group separation |
| `space-6` | 24 px | Screen horizontal padding, major card padding |
| `space-8` | 32 px | Form group and section separation |
| `space-10` | 40 px | Large screen section gap |
| `space-12` | 48 px | Login hero/form separation or web section gap |

Default mobile screen horizontal padding: **16–20 px**.  
Default web content padding: **24–32 px**, with a maximum readable content width of approximately **1280 px**.

### 5.2 Radius

| Component | Radius |
|---|---:|
| Input, button, compact badge | 8 px |
| Card, list container, bottom sheet content | 12 px |
| Dialog | 16 px |
| Avatar and icon circle | 9999 px |
| Full-width control | Do not use pill radius unless it is a filter or compact status control |

Keep the visual language restrained. Do not mix sharp 0 px, medium 12 px, and oversized 32 px radii randomly on one screen.

### 5.3 Elevation

Prefer surface contrast and borders over large shadows.

- Light theme: 1 px border plus a subtle shadow only for dialogs, sheets, and floating controls.
- Dark theme: use `surfaceElevated` and a border; avoid a black shadow that disappears into the background.
- Maps: floating controls may use a moderate shadow/elevation for separation from map content.
- Never use elevation as the only indication of focus, selection, or status.

## 6. Component Rules

### 6.1 Buttons

Button hierarchy:

1. **Primary:** one filled button for the main action, using `primary`.
2. **Secondary:** outlined or surface button for a supporting action.
3. **Tertiary:** text/icon action for low-risk navigation or dismissal.
4. **Destructive:** explicit red action with confirmation for irreversible operations.

Rules:

- Minimum height: **44 dp mobile**, **40 px web**.
- Horizontal padding: at least 16 px.
- Use a verb that describes the result: `Save customer`, `Start ticket`, `Retry`, `Log in`.
- Loading buttons retain their width and show a spinner plus disabled interaction.
- Do not put two filled primary buttons next to each other.
- Destructive actions must not be visually identical to normal actions.

### 6.2 Inputs

- Label inputs explicitly; do not rely on placeholder-only labels.
- Keep labels visible while typing.
- Use leading icons only when they improve recognition; do not decorate every field.
- Password input has a show/hide control with at least a 44 dp hit area.
- Focus state: strong primary border or ring, not only a subtle color change.
- Error state: error border, error icon where useful, and specific recovery text below the field.
- Preserve typed input after validation errors.
- Disable fields during authentication requests to prevent duplicate submissions.

### 6.3 Cards and Lists

- Use cards to group related information, not every row.
- Keep card content aligned to a consistent baseline.
- Put the most important value first, then label, then supporting metadata.
- Make the whole row tappable when the row represents one object.
- Use a right-side chevron only when navigation exists.
- Provide a clear empty state with a next step or refresh instruction.

### 6.4 Badges and Status Indicators

- Use a short label: `ONLINE`, `OPEN`, `URGENT`, `SCHEDULED`.
- Pair the badge with an icon or text; color alone is insufficient.
- Do not use a badge for every piece of metadata.
- Keep status labels consistent across dashboard, detail, list, and map views.

### 6.5 Navigation

- Mobile bottom tabs contain only the highest-frequency destinations.
- Use a header title that identifies the current context.
- Keep back navigation consistent and predictable.
- Restricted routes should show a clear access explanation, not silently bounce users without feedback.
- Deep links must resolve to a valid authenticated destination or a clear sign-in screen.

### 6.6 Bottom Sheets and Dialogs

Use bottom sheets for mobile contextual actions, filters, map node details, schedule details, and ticket status updates.

- Include a visible title and close/dismiss affordance.
- Keep the primary action fixed or easy to reach when content scrolls.
- Do not hide destructive confirmation text below the fold.
- Preserve the underlying context; do not turn every action into a full-screen navigation.

## 7. Screen Patterns

### 7.1 Login

Structure:

1. Brand mark and concise product statement.
2. `Username or email` field.
3. `Password` field with show/hide control.
4. Primary `Log in` action.
5. Error or rate-limit feedback near the form.
6. Optional language/theme controls placed away from the primary action.

Login states required:

- Initial empty state
- Identifier focused
- Password focused
- Password visible
- Client validation error
- Submitting/loading
- Invalid credential error
- Rate limited with retry countdown
- Successful authentication and role-based redirect
- Network unavailable with retry

The login screen should be minimal. Avoid a large decorative hero that pushes the form below the keyboard on small screens.

### 7.2 Technician Dashboard

Order content by immediate field work:

1. Header with technician identity and notification access.
2. Today summary: scheduled tasks, active tickets, completed tasks.
3. Today's schedule list.
4. Active ticket list.
5. Pull-to-refresh and clear loading/empty/error states.

On narrow devices, use a two-column metric grid rather than forcing three dense metric cards into one row.

### 7.3 Owner/Admin Dashboard

Prioritize:

1. Active customer and service totals.
2. Ticket and schedule exceptions.
3. Router/network health.
4. Revenue or billing indicators when enabled.
5. Quick actions and recent activity.

Use dense but readable tables on web. On mobile, convert rows into stacked cards with the highest-value fields first.

### 7.4 Ticket Detail

Show, in order:

1. Ticket status, priority, and SLA/age.
2. Customer and service context.
3. Issue description.
4. Assigned technician and schedule.
5. Timeline/history.
6. Photos and resolution proof.
7. Contextual next action.

### 7.5 Network Map

- Map remains the primary surface; controls must not obscure the map.
- Use clear legends for node and link types.
- Recenter and filter controls use at least 44 dp hit areas.
- Node details open in a bottom sheet.
- Network colors must remain distinguishable in both themes.

### 7.6 MikroTik Monitoring

- Present router online state before detailed metrics.
- Group CPU, memory, disk, temperature, voltage, and active sessions by meaning.
- Use monospace only for technical values such as IP addresses, interface names, and router versions.
- Charts must include a time range, units, and empty/no-history explanation.
- Live PPPoE queries must show loading, unreachable-router error, empty sessions, and refresh state.

## 8. Accessibility and Field Usability

### Contrast

- Essential text must meet WCAG AA contrast targets where applicable.
- Do not use `textMuted` for warnings, errors, primary values, or actionable instructions.
- Test both themes on low-brightness and high-glare conditions.

### Touch and ergonomics

- Minimum touch target: 44 × 44 dp.
- Keep destructive and primary actions visually and spatially distinct.
- Avoid placing two high-risk actions beside one another.
- Place frequent technician actions within comfortable one-hand reach where possible.
- Support keyboard avoidance on forms and bottom sheets.

### Motion

Use motion to communicate:

- Screen transition
- Loading/progress
- Sheet presentation
- Success or error confirmation

Avoid continuous decorative animation. Respect reduced-motion preferences when the platform supports them.

### Language and content

- Support Indonesian and English for all user-facing copy.
- Use concise action-oriented wording.
- Avoid exposing raw backend errors, stack traces, or technical secrets.
- Error messages must explain what happened and what the user can do next.

## 9. Data State Requirements

Every API-backed screen must define:

| State | Required behavior |
|---|---|
| Loading | Skeleton or purposeful progress indicator preserving layout shape |
| Success | Data hierarchy and primary next action |
| Empty | Explain why it is empty and provide refresh/create/navigation action |
| Error | Safe message, retry action, and preserved user context |
| Offline/degraded | Explain whether cached data is shown and when live data was last updated |
| Mutating | Disable duplicate submission and show progress |
| Success mutation | Confirm result and update/invalidate affected data |

## 10. Do / Don't

### Do

- Use the existing theme-aware token utilities: `useThemeColor()`, `COLORS`, and `COLORS_DARK`.
- Use semantic colors for operational meaning.
- Keep layouts calm and scan-friendly.
- Use 8 px rhythm and consistent card/list patterns.
- Make retry and recovery actions obvious.
- Use high-contrast labels for outdoor technicians.
- Validate new screens in both light and dark themes.

### Don't

- Do not hardcode one-off hex colors in screens when a semantic token exists.
- Do not use gradients as decoration on operational screens.
- Do not make a screen depend on color alone.
- Do not hide a primary action behind a tiny icon.
- Do not use full dark mode for every screen without testing outdoor readability.
- Do not create a new radius, font style, or status color without documenting it here.
- Do not silently redirect unauthorized users without an explanation.
- Do not show raw API, database, or authentication errors to users.

## 11. Google Stitch Prompt

Use the following preamble when asking Google Stitch to generate Detso screens:

```text
Create a minimal B2B ISP operations interface for Detso.

Support Light, Dark, and System themes. Use the same layout, spacing, component hierarchy, and interaction patterns across all themes; do not create two separate visual languages.

The visual language is calm, precise, technical, trustworthy, and operational. Use a cool-white/slate light canvas, deep navy text, thin borders, an 8px spacing rhythm, restrained 6–12px radii, and minimal shadows. Use one primary action per screen.

Light theme:
- background #F8FAFC
- surfaces #FFFFFF
- primary text #0F172A
- secondary text #475569
- borders #E2E8F0
- primary action #0F766E
- network accent #06B6D4

Dark theme:
- background #0B1220
- surfaces #111827
- elevated surfaces #172033
- primary text #F8FAFC
- secondary text #CBD5E1
- borders #263449
- primary action #2DD4BF
- network accent #22D3EE

Use semantic states consistently:
- emerald for active, online, completed, and resolved
- blue/cyan for scheduled, in-progress, and informational states
- amber for warning, suspended, and high-attention states
- red for urgent, offline, failed, and destructive states
- slate for inactive, cancelled, and unknown states

Always display status using text labels and icons as well as color.
For technician mobile screens, use minimum 44dp touch targets, high outdoor contrast, clear one-handed actions, readable labels, and complete loading, empty, error, retry, offline, and success states.

Do not use decorative gradients, excessive glassmorphism, oversized hero sections, playful consumer-app styling, low-contrast gray text, or unnecessary animation.
For MikroTik monitoring screens, use a restrained technical command-center density inspired by Raycast: compact telemetry panels, technical values in monospace, high-contrast charts, and clear online/offline state.
```

## 12. Refero References

These references informed the direction; they are inspiration, not a requirement to copy a brand:

- [Refero Styles directory](https://styles.refero.design/)
- [Stripe style reference](https://styles.refero.design/style/48e5de76-05d5-4c4e-a269-c7c245b291ec) — primary structural reference: ledger-like information hierarchy, cool-white surfaces, restrained accent, crisp borders.
- [Raycast style reference](https://styles.refero.design/style/3b6a17f0-3bdf-418c-a95e-0b89e5a8b2f8) — secondary monitoring reference: technical density and dark command-center treatment.
- [Mercury style reference](https://styles.refero.design/style/3172cd4d-118a-4a16-a259-6b634d32322e) — optional dark financial tone; do not use as the default field theme.
- [Vercel style reference](https://styles.refero.design/style/f24daf3a-d43f-4dec-85a9-8ac1d5148a03) — reference for restrained technical metadata and hairline borders.

## 13. Design Change Process

When a new UI pattern is proposed:

1. Check whether an existing token or component already solves it.
2. Validate the pattern in light and dark themes.
3. Validate touch targets and contrast on a small mobile viewport.
4. Define loading, empty, error, retry, and success states.
5. Update this document if the pattern becomes reusable.
6. Update the implementation tokens/components rather than adding screen-local exceptions.
