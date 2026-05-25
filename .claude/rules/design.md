# Design Rules — ATMOS

## The Prototype is Law

`atmos-launch.html` is the pixel-perfect reference. Every component you build must
match it. When in doubt, open the file and compare.

## What Must Never Change

- Color palette (all CSS variables — see CLAUDE.md)
- Typography: Syne (UI), Cormorant Garamond (display/numbers), Syne Mono (labels/tags)
- Card structure: dark background + gold top-border shimmer via `::before`
- Spacing rhythm: 4px base, 8px radius (`--r`), 12px radius (`--r2`)
- The gold/teal dual-tone system: gold = value/money, teal = status/live/tech

## Component Mapping

When building React components, map to these prototype CSS classes:

| React Component | Prototype Class |
|---|---|
| `<Card>` | `.card` + `.card::before` shimmer |
| `<StatBlock>` | `.stat` + `.stat::after` bottom teal line |
| `<Button variant="gold">` | `.btn.btn-gold` |
| `<Button variant="teal">` | `.btn.btn-teal` |
| `<Button variant="outline">` | `.btn.btn-outline` |
| `<Tag>` | `.tag` with variant props |
| `<JobCard>` | `.job-card` with hover lift |
| `<ReceiptCard>` | `.receipt-card` |
| `<Modal>` | `.overlay` + `.modal` |
| `<NavItem>` | `.nav-item` with active state |

## Tailwind Usage

Use Tailwind for layout/spacing utilities only. 
Do NOT use Tailwind for colors — use CSS variables.

```tsx
// ✅ Correct
<div className="flex items-center gap-2 p-4" style={{ color: 'var(--cream)' }}>

// ❌ Wrong — breaks the design system
<div className="text-yellow-400 bg-gray-900">
```

## Animations to Preserve

- `.sdot.live` — teal pulse animation on live status dots
- `.sig-dot.pending` — blink animation on pending signatures  
- `.orb::after` — spinning ring on the deploy hero orb
- Toast slide-in from right
- Job card hover: `translateY(-1px)` + border-color transition

## Responsive

The prototype is designed for desktop (min 1024px). 
Mobile is a V2 concern — do not break desktop layout trying to make it responsive.
