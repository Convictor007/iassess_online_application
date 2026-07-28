# Compact Frontend Design Skill

## Purpose
Enforce viewport-fitting, compact UI layout for all generated frontends. Prevent oversized components that cause unnecessary scrolling on standard screens (1080p / 1920x1080).

## Core Principle
**Every screen should fit within the viewport without page scrolling.** Content that exceeds viewport height should use internal scroll on a specific container, not the page body.

---

## Rules

### 1. Container Layout
```
- Use `h-screen flex flex-col overflow-hidden` on the root container
- Header: `shrink-0` (never scrolls)
- Main content area: `flex-1 overflow-y-auto` (internal scroll only)
- Footer (if any): `shrink-0`
```

### 2. Spacing Scale (Tailwind)
| Element       | Bad (too big)      | Good (compact)    |
|---------------|--------------------|--------------------|
| Page padding  | `py-8 px-4`        | `py-3 px-4`        |
| Card padding  | `p-6 sm:p-8`       | `p-4 sm:p-5`       |
| Section gap   | `space-y-4`        | `space-y-2`        |
| Margin bottom | `mb-6`             | `mb-2` or `mb-3`   |
| Nav buttons   | `mt-8 pt-4`        | `mt-4 pt-3`        |

### 3. Typography Scale
| Element        | Bad            | Good               |
|----------------|----------------|---------------------|
| Page heading   | `text-2xl`     | `text-base`         |
| Section title  | `text-lg`      | `text-sm`           |
| Body text      | `text-sm`      | `text-xs`           |
| Helper/label   | `text-xs`      | `text-[11px]`       |
| Fine print     | `text-sm`      | `text-[10px]`       |

### 4. Form Elements
```
- Input fields: `px-2 py-1 text-xs` (not `px-3 py-2 text-sm`)
- Labels: `text-[11px] font-medium` (not `text-sm`)
- Selects: same as inputs
- Checkboxes/radios: `w-3.5 h-3.5` (not `w-4 h-4`)
- Buttons: `px-4 py-1.5 text-sm` (not `px-6 py-2.5`)
```

### 5. Scrollable Sections
For long content (requirements lists, form groups):
```
- Wrap in a container with `max-h-[45vh] overflow-y-auto` or `max-h-[55vh] overflow-y-auto`
- Add `pr-1` for scrollbar padding
- Never let the entire page scroll
```

### 6. Grid Density
```
- Use `grid-cols-2 sm:grid-cols-3` for option grids (not `grid-cols-1 sm:grid-cols-2`)
- Tighter gaps: `gap-2` (not `gap-3` or `gap-4`)
```

### 7. Tables
```
- Font: `text-xs` on table
- Cell padding: `p-2` (not `p-3`)
- Header: `bg-gray-100` with `font-semibold text-gray-600`
```

### 8. Header
```
- Logo: `w-10 h-10` (not `w-16 h-16`)
- Title: `text-sm font-bold` (not `text-xl`)
- Subtitle: `text-[10px]` (not `text-sm`)
- Overall padding: `py-2` (not `py-6`)
```

---

## Quick Checklist
Before finalizing any frontend:
- [ ] Root uses `h-screen flex flex-col overflow-hidden`
- [ ] Header is `shrink-0`
- [ ] Main content has `flex-1 overflow-y-auto`
- [ ] All headings are `text-base` or smaller
- [ ] All body text is `text-xs` or `text-[11px]`
- [ ] Form inputs use `px-2 py-1 text-xs`
- [ ] Long lists have `max-h-[45vh] overflow-y-auto`
- [ ] No section has padding bigger than `p-4`
- [ ] Grids use `gap-2` and `grid-cols-2+` on desktop

---

## Anti-patterns to Avoid
- `min-h-screen` on root (causes page scroll)
- `text-2xl` on form headings (too large)
- `py-8` on sections (wastes vertical space)
- `p-6 sm:p-8` on cards (too much internal padding)
- `space-y-4` on form fields (too much gap)
- Fixed-height content that exceeds 100vh without scroll container
