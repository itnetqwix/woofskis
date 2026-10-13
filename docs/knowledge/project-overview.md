# Project Overview & System Vision

> **Canonical Path**: `/docs/knowledge/project-overview.md`  
> **Source Documents**: [Ch 1 Project Overview & Vision](file:///D:/woofskis/docs/source/1%20Project%20Overview%20&%20Vision%20390ca8c5bdf780cc934af56defc721a1.md), [Ch 2 Business Background & Market Context](file:///D:/woofskis/docs/source/2%20Business%20Background%20&%20Market%20Context%20390ca8c5bdf780ad8e0cfe20dfe63d95.md), [Ch 5 Business Objectives](file:///D:/woofskis/docs/source/5%20Business%20Objectives%20390ca8c5bdf78091aa60d841255272af.md), [Ch 6 Product Vision](file:///D:/woofskis/docs/source/6%20Product%20Vision%20390ca8c5bdf780e9810ac7d28a2ae7fd.md), [Ch 7 Project Scope](file:///D:/woofskis/docs/source/7%20Project%20Scope%20390ca8c5bdf780cfa0b0ed54178fc27e.md), [Ch 8 Target Audience](file:///D:/woofskis/docs/source/8%20Target%20Audience%20390ca8c5bdf7808d9a64f679d23d5075.md), [Ch 17 Conclusion & Recommendations](file:///D:/woofskis/docs/source/17%20Conclusion%20&%20Recommendations%20395ca8c5bdf78086aeb8f4e4eba01c46.md)  
> **Last Updated**: 2026-09-22

---

## 1. Executive Summary

The **Contest Operating System (COS)** is a scalable, modular, multi-tenant digital infrastructure engineered to power video-based competitions. Unlike traditional social media platforms where content visibility is dictated by follower size, algorithmic feeds, or vanity engagement metrics, COS is fundamentally designed around **fair, merit-driven competition and community-driven evaluation**.

### Foundational Distinction
- **Social Media Platforms**: Optimize for infinite scrolling, follower retention, influencer visibility, and passive attention capture.
- **Contest Operating System**: Optimizes for structured competition lifecycles, focused one-at-a-time video evaluation, immediate consensus scoring, and transparent leaderboards.

---

## 2. Platform Architecture Evolution

The Contest Operating System follows a phased evolution from a single consumer application to a full Contest Platform as a Service (CPaaS):

```
Level 1: Woofskis MVP (Dog & Pet Video Competitions)
      │
      ▼
Level 2: Multi-Organization Platform (Configurable Multi-Brand Tenancy)
      │
      ▼
Level 3: White-Label SaaS Platform (Self-Service & Subscription Model)
      │
      ▼
Level 4: Enterprise Contest Operating System (APIs, Governance, Security)
      │
      ▼
Level 5: Global Contest Operating System (Worldwide Localization & Ecosystem)
```

### Initial Implementation: Woofskis
- **Brand / Theme**: Comedy & Entertainment short-form video competitions.
- **Role in Ecosystem**: The initial production deployment and validation sandbox for core contest mechanics, video ingestion, real-time community scoring, and leaderboard dynamics.
- **Future Reusable Brands** *(Planned)*: Woofskis (Pets), TalentSkis (Talent competitions), SportsSkis (Athletics), MusicSkis (Music), and enterprise brand-sponsored campaigns.

---

## 3. Core Business Principles

1. **Fair Competition**: Equal opportunity for all participants; rankings are completely decoupled from follower counts or historical popularity *(Source: [Ch 1.7](file:///D:/woofskis/docs/source/1%20Project%20Overview%20&%20Vision%20390ca8c5bdf780cc934af56defc721a1.md))*.
2. **Community-Driven Evaluation**: Contest outcomes reflect aggregated community rating scores rather than opaque recommendation algorithms *(Source: [Ch 1.7](file:///D:/woofskis/docs/source/1%20Project%20Overview%20&%20Vision%20390ca8c5bdf780cc934af56defc721a1.md))*.
3. **Focused User Experience (The Continuous Loop)**: Visitors watch one video at a time, submit a numerical rating, receive instant feedback through a real-time community score consensus reveal, and automatically advance to the next candidate entry *(Source: [Ch 4.2](file:///D:/woofskis/docs/source/4%20Proposed%20Solution%20390ca8c5bdf780a0b489efeb96dafd91.md), [Ch 6.2](file:///D:/woofskis/docs/source/6%20Product%20Vision%20390ca8c5bdf780e9810ac7d28a2ae7fd.md))*.
4. **Platform Reusability**: All core engines (Contest, Video, Rating, Leaderboard, Moderation, Tenant) are built as reusable services that operate across multiple tenants without custom code redevelopment *(Source: [Ch 1.5](file:///D:/woofskis/docs/source/1%20Project%20Overview%20&%20Vision%20390ca8c5bdf780cc934af56defc721a1.md), [Ch 11.9](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md))*.

---

## 4. Target Stakeholder Personas

| Persona | Role & Objectives | Key Interactions | Source Ref |
|---|---|---|---|
| **Visitor / Voter** | Evaluates competing video submissions; drives community consensus without requiring creator registration. | Continuous video loop playback, numeric rating (1–10), score reveal countdown. | [Ch 8.2.2](file:///D:/woofskis/docs/source/8%20Target%20Audience%20390ca8c5bdf7808d9a64f679d23d5075.md) |
| **Content Creator** | Submits original video content into active category-scoped contests; tracks real-time performance. | Account onboarding, video submission modal, creator dashboard, submission status table, rank tracking. | [Ch 8.2.1](file:///D:/woofskis/docs/source/8%20Target%20Audience%20390ca8c5bdf7808d9a64f679d23d5075.md) |
| **Moderator / Admin** | Enforces content safety guidelines, manages contest schedules, and audits submission compliance. | Moderation split viewer, approve/reject workflows, audit logging, contest lifecycle scheduling. | [Ch 8.3.3](file:///D:/woofskis/docs/source/8%20Target%20Audience%20390ca8c5bdf7808d9a64f679d23d5075.md), [Ch 10.4](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md) |
| **Organization / Brand** | Deploys customized, branded contest instances using pre-built templates and custom theming. | Organization registration, theme customizer (colors, logos, fonts, banners), contest rule configuration. | [Ch 8.3.2](file:///D:/woofskis/docs/source/8%20Target%20Audience%20390ca8c5bdf7808d9a64f679d23d5075.md), [Ch 10.5](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md) |

---

## 5. Scope Boundaries (MVP vs Excluded)

### In-Scope for Initial MVP *(Source: [Ch 7.2](file:///D:/woofskis/docs/source/7%20Project%20Scope%20390ca8c5bdf780cfa0b0ed54178fc27e.md))*
- Email/Password authentication and RBAC roles (`SUPER_ADMIN`, `BRAND_ADMIN`, `CREATOR`, `VIEWER`).
- Single-video judging viewer with instant feedback and auto-advance.
- Creator video submission with client validation and preview.
- Admin content moderation queue with split-screen inspection.
- Real-time dynamic leaderboard with podium and category filtering.
- Multi-brand theme engine (Woofskis default + tenant theming).

### Explicitly Excluded from MVP *(Source: [Ch 7.3](file:///D:/woofskis/docs/source/7%20Project%20Scope%20390ca8c5bdf780cfa0b0ed54178fc27e.md))*
- Social feeds, infinite scroll feeds, direct messaging, follower lists, friends lists.
- Live streaming and real-time chat overlays.
- Payment gateway, credit card billing, paid contest entry fees (deferred to Phase 3).
- AI automated moderation and recommendation engines (deferred to Phase 4/5).
- Native mobile apps (iOS/Android) (deferred to Phase 3).

---

## 6. Project Knowledge Map Navigation
- For technical and architecture diagrams, see [architecture.md](file:///D:/woofskis/docs/knowledge/architecture.md).
- For entity definitions and relationships, see [domain-model.md](file:///D:/woofskis/docs/knowledge/domain-model.md).
- For status of frontend vs backend components, see [implementation-status.md](file:///D:/woofskis/docs/knowledge/implementation-status.md).
- For machine-readable relationship graphs, query `/docs/graphify/cos-project-graph.json` via [graph-cli.js](file:///D:/woofskis/docs/graphify/graph-cli.js).
