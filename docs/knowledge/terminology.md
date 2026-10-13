# Terminology & Domain Glossary

> **Canonical Path**: `/docs/knowledge/terminology.md`  
> **Source Documents**: [Ch 1 Project Overview & Vision](file:///D:/woofskis/docs/source/1%20Project%20Overview%20&%20Vision%20390ca8c5bdf780cc934af56defc721a1.md), [Ch 4 Proposed Solution](file:///D:/woofskis/docs/source/4%20Proposed%20Solution%20390ca8c5bdf780a0b489efeb96dafd91.md), [Ch 11 Key Features & Capabilities](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md), [Ch 16 Product Roadmap & Future Evolution](file:///D:/woofskis/docs/source/16%20Product%20Roadmap%20&%20Future%20Evolution%20395ca8c5bdf78063901dde129509e8e0.md)  
> **Last Updated**: 2026-09-22

---

## 1. Domain & Product Terminology

### Contest Operating System (COS)
The overarching software infrastructure, business logic, and reusable digital engine that enables communities, brands, and organizations to configure, deploy, and manage video competitions at scale without building custom software from scratch *(Source: [Ch 1.1](file:///D:/woofskis/docs/source/1%20Project%20Overview%20&%20Vision%20390ca8c5bdf780cc934af56defc721a1.md))*.

### Contest Platform as a Service (CPaaS)
The long-term multi-tenant SaaS business model and architectural evolution of COS, where organizations subscribe to launch white-label, customized competition platforms on shared infrastructure *(Source: [Ch 1.5](file:///D:/woofskis/docs/source/1%20Project%20Overview%20&%20Vision%20390ca8c5bdf780cc934af56defc721a1.md), [Ch 16.5](file:///D:/woofskis/docs/source/16%20Product%20Roadmap%20&%20Future%20Evolution%20395ca8c5bdf78063901dde129509e8e0.md))*.

### Woofskis
The production implementation of the Contest Operating System, tailored for dog and pet video competitions at `woofskis.com`.

### Continuous Judging Loop (Focused Viewer Experience)
The core frontend interaction pattern where visitors watch candidate videos one at a time, submit an evaluation score, immediately observe the updated community consensus, and automatically advance to the next entry *(Source: [Ch 4.2](file:///D:/woofskis/docs/source/4%20Proposed%20Solution%20390ca8c5bdf780a0b489efeb96dafd91.md), [Ch 6.2](file:///D:/woofskis/docs/source/6%20Product%20Vision%20390ca8c5bdf780e9810ac7d28a2ae7fd.md))*.

### Community Consensus Score
The aggregate numerical rating (ranging from $1.0$ to $5.0$) computed across all valid community votes cast for a specific submission entry *(Source: [Ch 4.3.3](file:///D:/woofskis/docs/source/4%20Proposed%20Solution%20390ca8c5bdf780a0b489efeb96dafd91.md), [Ch 12.5](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md))*.

### Score Delta ($\Delta$)
The instantaneous mathematical change in a submission's community score resulting from a newly submitted user rating, displayed during the score reveal animation *(Source: `use-contest-queue.ts`)*.

### Auto-Advance Delay
The configured temporal window (default: $1,800\text{ ms}$ / $1.8\text{ seconds}$) between score submission and automatic progression to the next video, allowing voters to perceive feedback without disrupting flow *(Source: `useContestQueue.ts:AUTO_ADVANCE_DELAY_MS`)*.

---

## 2. Architectural & Engineering Terminology

### Organization / Tenant Partitioning
The multi-tenant data architecture where each brand customer operates as an isolated `Organization` record while sharing the underlying authentication, scoring engine, and database infrastructure *(Source: [Ch 4.5](file:///D:/woofskis/docs/source/4%20Proposed%20Solution%20390ca8c5bdf780a0b489efeb96dafd91.md), [Ch 11.8](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md))*.

### Dynamic Brand Theming Engine
The frontend CSS custom property injector (`useTenantTheme`) that applies tenant-specific color palettes (primary, secondary, accent, background), typography, logos, and banners in real time *(Source: `features/admin/hooks/use-tenant-theme.ts`)*.

### Moderation Split Viewer
The specialized dual-pane administrative interface featuring synchronized video playback on the left pane and compliance criteria, metadata inspection, and action controls on the right pane *(Source: `features/admin/components/moderation-split-viewer.tsx`)*.

### Leaderboard Podium
The visual UI representation displaying the top 3 ranked contest entries (Gold 1st, Silver 2nd, Bronze 3rd) elevated above the tabular rankings *(Source: `features/leaderboard/components/leaderboard-podium.tsx`)*.

### Role-Based Access Control (RBAC)
The permission framework enforcing endpoint and UI route access across four standardized roles: `SUPER_ADMIN`, `BRAND_ADMIN`, `CREATOR`, and `VIEWER` *(Source: `cos-backend/src/middleware/auth.middleware.ts`)*.

### Moderation Audit Log
An append-only record tracking all administrative decisions (approvals, rejections, warnings, suspensions) with actor IDs, timestamps, and reason metadata *(Source: `features/admin/components/moderation-audit-log-modal.tsx`)*.
