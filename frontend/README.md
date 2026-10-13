# Contest Operating System (COS) - Frontend (Woofskis)

Production-grade, enterprise-ready frontend architecture for the **Contest Operating System (COS)**, built with Next.js App Router, TypeScript, Redux Toolkit, TanStack Query, Radix UI Primitives, and Tailwind CSS.

---

## 🏛️ Architecture Overview

```
.
├── .husky/                   # Git pre-commit & branch-validation hooks
├── .vscode/                  # Shared IDE settings & recommended extensions
├── public/                   # Static assets (fonts, icons, images)
├── src/
│   ├── app/                  # Next.js App Router (layouts, routes, providers)
│   ├── components/
│   │   ├── common/           # Generic reusable components (spinners, boundary)
│   │   ├── feedback/         # Modals, toasts, alerts
│   │   ├── forms/            # Form controls, inputs, validation wrappers
│   │   ├── layout/           # Header, Sidebar, Footer, Containers
│   │   └── ui/               # Radix UI primitives & CVA styled base tokens
│   ├── config/               # Environment validation (Zod), site, navigation
│   ├── constants/            # API endpoints, route mappings, storage/query keys
│   ├── features/             # Domain modules (analytics, auth, contests, etc.)
│   ├── hooks/                # Custom React hooks (debounce, disclosure, storage)
│   ├── lib/                  # Axios HTTP client, TanStack Query client, utils (cn)
│   ├── providers/            # Redux Provider, Query Provider, Theme Provider
│   ├── services/             # HTTP abstraction & API service layer
│   ├── store/                # Redux Toolkit store, root reducer, typed hooks, slices
│   ├── styles/               # CSS variables, color scales, animation keyframes
│   ├── types/                # Domain models, API contracts, TypeScript definitions
│   └── utils/                # Date, currency, string formatters & validation schemas
├── Dockerfile.dev            # Development container with hot-reloading
├── Dockerfile.prod           # Multi-stage standalone production build
├── docker-compose.dev.yml    # Development Docker Compose orchestration
├── docker-compose.yml        # Production Docker Compose orchestration
├── tailwind.config.ts        # Tailwind configuration with HSL CSS variable mapping
└── tsconfig.json             # TypeScript strict mode with @/* path aliases
```

---

## 🚀 Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **State Management:** [Redux Toolkit](https://redux-toolkit.js.org/) (`@reduxjs/toolkit` & `react-redux`)
- **Server Data Fetching & Caching:** [TanStack Query v5](https://tanstack.com/query)
- **HTTP Client:** [Axios](https://axios-http.com/) (Interceptors, Auth Bearer, Normalized Error Handling)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with HSL CSS variables for light/dark theming
- **Theming:** [next-themes](https://github.com/pacocoursey/next-themes)
- **UI Primitives & Icons:** [Radix UI](https://www.radix-ui.com/) Primitives, [Lucide React](https://lucide.dev/)
- **Code Quality:** ESLint, Prettier (with Tailwind plugin), Husky, Lint-Staged, Validate-Branch-Name
- **Containerization:** Docker & Docker Compose

---

## 🛠️ Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0 (or Docker)

### Installation

```bash
# Install all dependencies and initialize git hooks
npm install
```

### Local Development

```bash
npm run dev
# App will run at http://localhost:3000
```

### Local FE → BE ports

Two processes for local development (M01-P02-T05):

| App                                   | Default local URL     | Port source                                                                                                         |
| ------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Frontend (`content-operating-system`) | http://localhost:3000 | `npm run dev` → `next dev` (no `-p`; Next.js default). Docker Compose / Dockerfiles publish **3000**.               |
| Backend (`cos-backend`)               | http://localhost:5000 | `PORT` default **5000** (`SYSTEM_CONSTANTS.DEFAULT_PORT` in `cos-backend/src/config/env.ts`). API prefix `/api/v1`. |

Point the frontend HTTP client at the backend by copying `.env.example` to `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL="http://localhost:5000/api/v1"
```

Axios (`src/lib/axios.ts`) reads `process.env.NEXT_PUBLIC_API_BASE_URL` with **no fallback**. There is no Next.js rewrite/proxy in `next.config.mjs`.

Feature UI still uses LocalStorage/mocks. `http` in `src/services/api-client.ts` has no production consumers yet. Live API wiring is later (M02+). Canonical contracts: [`/docs/knowledge/api-map.md`](../docs/knowledge/api-map.md). Do not treat unused `src/constants/api-routes.ts` as the backend contract.

**NOT SPECIFIED:** production/hosted API URL; cookie vs localStorage session; CORS allowed-origin list (backend currently hardcodes `origin: '*'`).

### Type Checking & Linting

```bash
# Typecheck TypeScript
npm run typecheck

# Lint check and fix
npm run lint
npm run lint:fix

# Prettier format check and write
npm run format:check
npm run format:write
```

---

## 🐳 Docker Setup

### Development with Docker Compose

```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Production Build & Run

```bash
# Build production image
docker build -t cos-frontend:latest -f Dockerfile.prod .

# Run production container
docker run -p 3000:3000 cos-frontend:latest
```

---

## 🌿 Git Branch Conventions

Husky hooks enforce conventional branch naming:

- `feature/description` or `feat/description`
- `fix/description` or `hotfix/description`
- `chore/description`
- `docs/description`
- `refactor/description`
- `test/description`

# cos-frontend
