# Woofskis Centralized Design System & Brand Identity

Welcome to the **Woofskis Design System & Visual Foundation**. This document specifies the single source of truth for centralized brand tokens, semantic states, Poppins typography scale, spacing, radii, shadows, and light/dark theme rules for the entire Woofskis frontend application.

---

## 1. Brand Identity & Source of Truth

The visual identity is derived directly from the official **Woofskis** logo asset (`public/logo/woofskis_logo.png`).

### Core Brand Colors

- **Primary Brand Color (Vibrant Woofskis Orange)**: `#fa4616` (`hsl(14, 96%, 52%)`)
  - Sampled from the "SKIS" wordmark, the paw emblem, and the dynamic energy swoosh.
  - Used for: Primary buttons, primary CTAs, active navigation indicators, rating stars, selected tabs, important links, brand badges, and header brand treatment.
- **Secondary Brand Color (Warm Chocolate Espresso Brown)**: `#3e2717` (`hsl(24, 45%, 18%)`)
  - Sampled from the "WOOF" wordmark.
  - Used for: Secondary actions, warm contrast badges, dark mode surface accents, border accents, and brand framing.

### Centralized Brand Tokens

| Brand Token                     | Light Value                   | Dark Value              | Purpose / Usage                              |
| :------------------------------ | :---------------------------- | :---------------------- | :------------------------------------------- |
| `--primary` / `--brand-primary` | `14 96% 52%` (`#fa4616`)      | `14 96% 54%`            | Woofskis Vibrant Orange primary brand color  |
| `--primary-hover`               | `14 96% 45%`                  | `14 96% 60%`            | Primary interactive hover state              |
| `--primary-active`              | `14 96% 38%`                  | `14 96% 66%`            | Primary active / pressed state               |
| `--primary-soft`                | `14 90% 96%`                  | `14 80% 12%`            | Soft tinted brand backgrounds & chips        |
| `--primary-foreground`          | `0 0% 100%` (`#ffffff`)       | `0 0% 100%` (`#ffffff`) | High-contrast text on primary                |
| `--secondary` / `--brand-secondary` | `24 45% 18%` (`#3e2717`) | `24 40% 25%`            | Woofskis Warm Chocolate Brown brand color    |
| `--secondary-foreground`        | `0 0% 100%` (`#ffffff`)       | `0 0% 100%` (`#ffffff`) | High-contrast text on secondary              |
| `--accent`                      | `14 96% 52%` (`#fa4616`)      | `14 96% 54%`            | Woofskis Vibrant Orange accent color         |
| `--accent-hover`                | `14 96% 45%`                  | `14 96% 60%`            | Accent interactive hover state               |
| `--accent-soft`                 | `14 90% 95%`                  | `14 80% 12%`            | Soft tinted orange accent background         |
| `--brand-subtle`                | `14 60% 97%`                  | `24 35% 8%`             | Subtle brand background surfaces             |
| `--brand-muted`                 | `14 45% 92%`                  | `24 30% 14%`            | Muted brand container surfaces               |
| `--brand-border`                | `14 55% 85%`                  | `24 35% 22%`            | Brand-tinted container borders               |
| `--ring`                        | `14 96% 52%`                  | `14 96% 54%`            | Focus ring brand accent                      |

---

## 2. Semantic Surfaces & Layout

Both light and dark modes share identical semantic variable names with tailored lightness values for maximum legibility and contrast.

| Token                                 | Light Value                | Dark Value (Midnight)      | Usage                                |
| :------------------------------------ | :------------------------- | :------------------------- | :----------------------------------- |
| `--background`                        | `hsl(0, 0%, 100%)`         | `hsl(224, 71%, 4%)`        | Main app background canvas           |
| `--surface` / `--card`                | `hsl(0, 0%, 100%)`         | `hsl(224, 71%, 6%)`        | Primary content cards and containers |
| `--surface-elevated` / `--popover`    | `hsl(0, 0%, 98%)`          | `hsl(224, 71%, 8.5%)`      | Dropdowns, modals, floating panels   |
| `--border`                            | `hsl(214.3, 31.8%, 91.4%)` | `hsl(215, 27.9%, 16.9%)`   | Standard container borders           |
| `--border-subtle`                     | `hsl(214.3, 31.8%, 95%)`   | `hsl(215, 27.9%, 12%)`     | Dividers and faint separating lines  |
| `--border-hover`                      | `hsl(214.3, 31.8%, 80%)`   | `hsl(215, 27.9%, 24%)`     | Interactive border hover             |
| `--text-primary` / `--foreground`     | `hsl(222.2, 84%, 4.9%)`    | `hsl(213, 31%, 91%)`       | High-emphasis body and headings      |
| `--text-secondary`                    | `hsl(215.4, 16.3%, 36.9%)` | `hsl(217.9, 10.6%, 74.9%)` | Medium-emphasis descriptive copy     |
| `--text-muted` / `--muted-foreground` | `hsl(215.4, 16.3%, 46.9%)` | `hsl(217.9, 10.6%, 64.9%)` | Low-emphasis metadata and captions   |

---

## 3. Semantic State Colors

Semantic colors represent operational and status states. They must never be confused with or replaced by brand colors.

### Success (Approved submissions, verified states, positive confirmation)

- **CSS Token**: `--success` (`hsl(142.1, 76.2%, 36.3%)` light / `hsl(142.1, 70.6%, 45.3%)` dark)
- **Tailwind classes**: `bg-success`, `text-success`, `border-success`, `hover:bg-success-hover`, `bg-success-soft`, `bg-success/10`

### Danger / Destructive (Rejection, deletion, critical alerts, validation errors)

- **CSS Token**: `--destructive` / `--danger` (`hsl(0, 84.2%, 60.2%)` light / `hsl(0, 72.2%, 50.6%)` dark)
- **Tailwind classes**: `bg-destructive`, `text-destructive`, `border-destructive`, `hover:bg-destructive-hover`, `bg-destructive-soft`, `bg-destructive/10`

### Warning (Pending review, flagged moderation, nearing deadlines)

- **CSS Token**: `--warning` (`hsl(38, 92%, 50%)` light / `hsl(38, 92%, 55%)` dark)
- **Tailwind classes**: `bg-warning`, `text-warning`, `border-warning`, `hover:bg-warning-hover`, `bg-warning-soft`, `bg-warning/10`

### Info (Neutral announcements, system info, informational badges)

- **CSS Token**: `--info` (`hsl(217.2, 91.2%, 59.8%)` light / `hsl(217.2, 91.2%, 65%)` dark)
- **Tailwind classes**: `bg-info`, `text-info`, `border-info`, `hover:bg-info-hover`, `bg-info-soft`, `bg-info/10`

---

## 4. Typography Hierarchy (Poppins Everywhere)

The entire application uses **Poppins** via Next.js Google Fonts (`next/font/google`). It is configured globally at the root layout and inherited by all headings, buttons, body text, badges, tables, and overlays.

| Class           | Font Weight     | Mobile Size        | Tablet / Desktop Size                   | Line Height | Tracking |
| :-------------- | :-------------- | :----------------- | :-------------------------------------- | :---------- | :------- |
| `.text-display` | 900 (Black)     | `text-4xl` (36px)  | `sm:text-5xl md:text-6xl` (48px - 60px) | `1.1`       | `tight`  |
| `.text-h1`      | 800 (Extrabold) | `text-3xl` (30px)  | `sm:text-4xl` (36px)                    | `tight`     | `tight`  |
| `.text-h2`      | 700 (Bold)      | `text-2xl` (24px)  | `sm:text-3xl` (30px)                    | `snug`      | `tight`  |
| `.text-h3`      | 700 (Bold)      | `text-xl` (20px)   | `sm:text-2xl` (24px)                    | `snug`      | `tight`  |
| `.text-h4`      | 600 (Semibold)  | `text-lg` (18px)   | `sm:text-xl` (20px)                     | `normal`    | `normal` |
| `.text-body-lg` | 400 (Normal)    | `text-lg` (18px)   | `text-lg` (18px)                        | `relaxed`   | `normal` |
| `.text-body`    | 400 (Normal)    | `text-base` (16px) | `text-base` (16px)                      | `normal`    | `normal` |
| `.text-body-sm` | 400 (Normal)    | `text-sm` (14px)   | `text-sm` (14px)                        | `normal`    | `normal` |
| `.text-caption` | 400 (Normal)    | `text-xs` (12px)   | `text-xs` (12px)                        | `normal`    | `normal` |
| `.text-label`   | 600 (Semibold)  | `text-xs` (12px)   | `text-xs` (12px) uppercase              | `none`      | `wider`  |
| `.text-button`  | 600 (Semibold)  | `text-sm` (14px)   | `text-sm` (14px)                        | `none`      | `normal` |

---

## 5. Spacing Scale

Mapped directly onto Tailwind's 4px harmonic grid:

| Semantic Token | Tailwind Equivalent | Value  | Typical Usage                                    |
| :------------- | :------------------ | :----- | :----------------------------------------------- |
| `space-xs`     | `1` / `0.25rem`     | `4px`  | Micro-gaps between icons and badges              |
| `space-sm`     | `2` / `0.5rem`      | `8px`  | Inner button padding, compact list item gaps     |
| `space-md`     | `4` / `1rem`        | `16px` | Standard card internal padding, form row spacing |
| `space-lg`     | `6` / `1.5rem`      | `24px` | Section gaps, modal padding                      |
| `space-xl`     | `8` / `2rem`        | `32px` | Grid gaps, header padding                        |
| `space-2xl`    | `12` / `3rem`       | `48px` | Hero section margins, page section spacing       |
| `space-3xl`    | `16` / `4rem`       | `64px` | Major page separation                            |

---

## 6. Border Radii & Elevations

### Radii Scale

- `rounded-none`: `0`
- `rounded-xs`: `0.125rem` (2px)
- `rounded-sm`: `0.25rem` (4px)
- `rounded-md`: `0.375rem` (6px)
- `rounded-lg`: `0.5rem` (8px - Default)
- `rounded-xl`: `0.75rem` (12px)
- `rounded-2xl`: `1rem` (16px)
- `rounded-3xl`: `1.5rem` (24px)
- `rounded-full`: `9999px`

### Shadows & Glows

- `shadow-sm`: Subtle separation for inputs and buttons
- `shadow-md`: Default card elevation
- `shadow-lg`: Floating modals and dropdowns
- `shadow-xl`: Prominent overlays and hero cards
- `shadow-glow-primary`: Woofskis Dark Green atmospheric glow (`rgba(19, 73, 30, 0.25)`)
- `shadow-glow-accent`: Woofskis Lime accent atmospheric glow (`rgba(127, 196, 28, 0.3)`)
- `shadow-glow-success`: Emerald success atmospheric glow
- `shadow-glow-danger`: Crimson alert atmospheric glow

---

## 7. Reusable Component Variants

### Button (`src/components/ui/button.tsx`)

```tsx
import { Button } from '@/components/ui/button';

// Primary Woofskis Dark Green action
<Button variant="primary">Submit Entry</Button>

// Neutral secondary action with Woofskis dark green text/border on hover
<Button variant="secondary">Cancel</Button>

// Semantic states
<Button variant="success">Approve Submission</Button>
<Button variant="danger">Reject Submission</Button>
<Button variant="warning">Issue Warning</Button>
<Button variant="info">View Details</Button>
<Button variant="outline">Learn More</Button>
<Button variant="ghost">Settings</Button>
<Button variant="link">Terms of Service</Button>
```

### Badge (`src/components/ui/badge.tsx`)

```tsx
import { Badge } from '@/components/ui/badge';

// Brand Badges
<Badge variant="primary">Woofskis Official</Badge>
<Badge variant="accent">Top Creator</Badge>

// Semantic Badges
<Badge variant="success">Live in Contest</Badge>
<Badge variant="warning">Pending Review</Badge>
<Badge variant="destructive">Action Required</Badge>
<Badge variant="info">Verified Judge</Badge>
<Badge variant="outline">Draft</Badge>
```

---

## 8. Header & Navbar Sizing Standards

- **Header Height**: `h-16` (64px)
- **Navbar Logo Dimensions**:
  - Mobile (< 640px): `h-10 w-10` (40px)
  - Tablet (640px - 768px): `sm:h-11 sm:w-11` (44px)
  - Desktop (>= 768px): `md:h-12 md:w-12` (48px)
- **Brand Typography**: `font-bold text-lg sm:text-xl tracking-tight text-foreground` with crisp rendering and prominent logo presence.
- **Surface**: Clean light mode default surface (`bg-card/95 backdrop-blur-md border-b border-border`).

---

## 9. Visual Hierarchy Rules

1. **Logo**: Strongest brand presence in header and public landing pages.
2. **Primary CTA**: Solid Woofskis Dark Green (`bg-primary text-white hover:bg-primary-hover`). No multi-color gradients.
3. **Secondary / Highlight**: Bright Lime (`bg-accent text-accent-foreground` / `text-accent`) for active indicators, status accents, scrubbers, and subtle highlight pills.
4. **Surfaces**: Clean neutral backgrounds in light mode; rich midnight dark backgrounds in dark mode.
5. **Semantic States**: Strict separation — never replace Warning (amber) or Error (red) with brand green.
