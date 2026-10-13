# Graphify Persistent Relationship System

> **Canonical Path**: `/docs/graphify/README.md`  
> **Schema Definition**: [`/docs/graphify/graph-schema.json`](file:///D:/woofskis/docs/graphify/graph-schema.json)  
> **Graph Database**: [`/docs/graphify/cos-project-graph.json`](file:///D:/woofskis/docs/graphify/cos-project-graph.json)  
> **CLI Tool**: [`/docs/graphify/graph-cli.js`](file:///D:/woofskis/docs/graphify/graph-cli.js)  
> **Last Updated**: 2026-09-22

---

## 1. Overview

Graphify is a mandatory, persistent relationship system that models all business domains, user roles, permissions, features, workflows, frontend components, API endpoints, backend services, and database models across the Contest Operating System (COS).

Every node and edge is traceable to:
- **Source Documentation**: `/docs/source/` chapter and section citation.
- **Code Repository**: File path and code symbol.

---

## 2. CLI Tooling & Commands

The CLI is executable directly via Node.js:

```bash
# 1. Print overall graph statistics & counts
node docs/graphify/graph-cli.js stats

# 2. Validate schema compliance and edge reference integrity
node docs/graphify/graph-cli.js validate

# 3. Query metadata and connections for a specific node
node docs/graphify/graph-cli.js query --node "feat:continuous_queue"
node docs/graphify/graph-cli.js query --node "api:POST /auth/login"

# 4. Trace full-stack paths from User/Role down to Database
node docs/graphify/graph-cli.js trace-path --start "role:viewer" --end "db:Rating"
node docs/graphify/graph-cli.js trace-path --start "role:creator" --end "db:Submission"
node docs/graphify/graph-cli.js trace-path --start "role:brand_admin" --end "db:AuditLog"

# 5. List all nodes matching a taxonomy type
node docs/graphify/graph-cli.js list-by-type --type "APIEndpoint"
node docs/graphify/graph-cli.js list-by-type --type "FrontendComponent"
node docs/graphify/graph-cli.js list-by-type --type "DatabaseModel"

# 6. Export Mermaid diagram
node docs/graphify/graph-cli.js export-mermaid
```

---

## 3. Visual Graph Diagrams

The `/docs/graphify/visual-graphs/` directory contains pre-rendered Mermaid diagrams:
- [full-stack-trace.mmd](file:///D:/woofskis/docs/graphify/visual-graphs/full-stack-trace.mmd): Full-stack vertical trace from Persona &rarr; Permission &rarr; Feature &rarr; Workflow &rarr; Frontend &rarr; API &rarr; Backend &rarr; Database.
- [domain-relationships.mmd](file:///D:/woofskis/docs/graphify/visual-graphs/domain-relationships.mmd): Entity-relationship diagram for core database tables.
- [contest-lifecycle.mmd](file:///D:/woofskis/docs/graphify/visual-graphs/contest-lifecycle.mmd): State machine transitions for contests and submissions.
- [multi-tenant-architecture.mmd](file:///D:/woofskis/docs/graphify/visual-graphs/multi-tenant-architecture.mmd): Multi-tenant brand scoping and dynamic theming model.
