---
description: Frontend development rules, Next.js 14 conventions, Tailwind design tokens, and UI state management
globs: frontend/**/*.{ts,tsx,css,json}
alwaysApply: false
---

# 03 - Frontend Development Rules (frontend)

## 1. Frontend Architecture Reference
Consult [docs/knowledge/frontend-map.md](file:///D:/woofskis/docs/knowledge/frontend-map.md) when relevant; avoid rereading everything.

## 2. Next.js 14 App Router Standards
- Place pages under `src/app/` grouped by persona:
  - `src/app/(auth)/...`
  - `src/app/(dashboard)/creator/...`, `src/app/(dashboard)/admin/...`
  - `src/app/(viewer)/leaderboard/...`
  - `src/app/page.tsx` (Continuous judging viewer)
- Keep page files lean; delegate UI rendering to components in `src/features/<domain>/components/`.
- Mark interactive components explicitly with `'use client';`.

## 3. Styling & Design Aesthetics
- **Design Tokens**: Use TailwindCSS with custom CSS variables (`--primary`, `--background`, `--accent`, `--card`) configured in `tailwind.config.ts`.
- **Theme**: Woofskis branding is static deployment branding. Do not load it from an organization API.
- **Rich Aesthetics**: Premium dark glassmorphism, smooth animations (`tailwindcss-animate`), and clear hover states.
- **Icons**: Use `lucide-react` exclusively.
- **UI Primitives**: Use Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-slot`).

## 4. State Management & Hooks
- **Domain State**: Keep feature state machines inside `src/features/<domain>/hooks/` (e.g., `useContestQueue`, `useCreatorSubmissions`, `useLeaderboard`).
- **Global Session**: Use Redux Toolkit (`src/store/slices/auth-slice.ts`) for JWT tokens and authenticated user metadata.
- **Async API State**: Use TanStack React Query (`@tanstack/react-query`) for backend data fetching, mutations, and cache invalidation.
- **Forms**: Use Formik + Yup / Zod for form state and validation.

## 5. Keyboard Navigation & Hotkeys
- Support keyboard shortcuts in viewing/judging workflows (`1-9` for ratings, `0` for 10, `Space` for play/pause, `M` for mute, `N`/Right Arrow for next, `P`/Left Arrow for prev, `R` for restart).
- **Rule**: ALWAYS verify that keyboard event targets are NOT `<input>`, `<textarea>`, or content-editable elements before triggering hotkeys.

## 6. Type Safety & Validation
- Reference centralized TypeScript interfaces from `src/types/` (`contest.ts`, `creator.ts`, `leaderboard.ts`, `tenant.ts`, `user.ts`).
- Do not run builds, typechecks, or linters unless explicitly requested or genuinely necessary.
