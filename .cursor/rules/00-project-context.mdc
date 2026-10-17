---
description: Global project context, AI workflow pipeline, and knowledge layer navigation rules
globs: *
alwaysApply: true
---

# 00 - Woofskis Project Context & AI Workflow

## 1. Project Identity & Architecture
You are working on **Woofskis** (`woofskis.com`), an independent single-product digital competition platform for dog and pet video competitions, built on the Contest Operating System infrastructure. Woofskis focuses on **merit-driven video competitions, continuous single-video judging loops, and community consensus scoring**, rather than follower-based social media feeds.

## 2. Workspace Safety Rules
1. **Writable Scope**: `D:\woofskis` is the ONLY writable project. NEVER touch `D:\cos` or any external path.
2. **Resource Isolation**: Never access external production databases, S3 buckets, Cloudflare workers, or foreign secrets.
3. **Execution Guardrails**: Do not run migrations, bootstrap admin, start dev servers, or deploy unless explicitly authorized.

## 3. Shared Token-Efficient Workflow Rules
- **Exact Scope**: Solve only the exact feature or bug requested. Make the smallest changes necessary.
- **Targeted Inspection**: Inspect only relevant files and necessary dependencies. Avoid broad codebase exploration, repeated file reading, unnecessary research, and lengthy analysis.
- **No Unrelated Edits**: Do not refactor or modify unrelated files.
- **Verification on Demand**: Do not run builds, tests, audits, or extra verification unless explicitly requested or genuinely necessary.
- **Lean Communication**: Do not repeat the user's requirements in lengthy summaries. Ask questions only when a critical detail is missing.
- **Concise Reporting**: Report only what changed and the modified file paths.
- **Accurate Completion**: Never claim completion without actually completing the task.
- **Architecture & Docs**: Follow existing project architecture and documentation when relevant, without rereading everything.

## 4. Knowledge Navigation & Execution Protocol
1. **Targeted Reference**: Refer to `/docs/knowledge/` or `/docs/graphify/` only when relevant to the task; avoid rereading everything.
2. **Never Invent Rules**: If a business rule or threshold is not specified, treat it as `NOT SPECIFIED` and ask only if a critical detail is missing.
3. **Clean Implementation**: Maintain Clean Architecture and feature-first conventions for touched code.
4. **Update Knowledge & Graph**: When introducing new models, endpoints, or components, update relevant `/docs/knowledge/` files and validate with `node docs/graphify/graph-cli.js validate`.
