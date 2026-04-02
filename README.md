# Status Tooling

Vendor-neutral reference tooling for the [Open Operational State](https://github.com/open-operational-state) standard.

## Overview

This monorepo contains shared packages for parsing, emitting, validating, and discovering operational-state resources. All packages are written in TypeScript, use ESM, and are managed with Bun workspaces.

## Packages

| Package | Purpose | Version |
|---|---|---|
| [`@open-operational-state/types`](packages/types/) | Canonical TypeScript types for the core model | 0.1.0 |
| [`@open-operational-state/core`](packages/core/) | Core model logic, normalization, validation | 0.1.0 |
| [`@open-operational-state/parser`](packages/parser/) | Response parsers and format adapters | 0.1.0 |
| [`@open-operational-state/emitter`](packages/emitter/) | Wire format emitters | 0.1.0 |
| [`@open-operational-state/validator`](packages/validator/) | Conformance validation and `oos` CLI | 0.1.0 |
| [`@open-operational-state/discovery`](packages/discovery/) | Discovery client (Link headers, well-known) | 0.1.0 |

## Quick Start

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run all tests
bun run test

# Probe a live endpoint
node packages/validator/dist/cli.js probe https://api.example.com/health

# Run conformance fixtures
node packages/validator/dist/cli.js fixtures ../status-conformance/fixtures/core --format=table
```

## CLI

The `oos` CLI is included in the validator package:

```bash
oos validate <file>       # Validate a JSON file against conformance levels
oos probe <url>           # Fetch a URL, auto-detect format, parse to core model
oos fixtures <dir>        # Run all conformance fixtures in a directory
oos inspect <file>        # Parse a JSON file, pretty-print core model
```

See the [validator README](packages/validator/README.md) for full CLI documentation.

## Supported Formats

| Format | Content-Type | Adapter |
|---|---|---|
| OOS Native (health) | `application/health+json` | `parseHealthResponse` |
| OOS Native (status) | `application/status+json` | `parseHealthResponse` |
| Health Check Draft | `application/json` | `parseHealthCheckDraft` |
| Spring Boot Actuator | `application/json` | `parseSpringBoot` |
| Plain HTTP | any | `parsePlainHttp` |

Format detection is automatic — the `parse()` function inspects content-type and body structure to select the correct adapter.

## Architecture

This tooling implements the six-layer architecture defined in the [status-spec](https://github.com/open-operational-state/status-spec/blob/main/ARCHITECTURE.md):

- **`types`** — TypeScript interfaces for the core model (Layer 1)
- **`core`** — normalization and manipulation of core model instances
- **`parser`** — deserialization from wire formats to core model (Layers 3–4)
- **`emitter`** — serialization from core model to wire formats (Layer 3)
- **`validator`** — conformance validation against profiles and serializations (cross-cutting)
- **`discovery`** — discovery client for locating operational-state resources (Layer 5)

## Dependency Graph

```
types ← core ← parser
              ← emitter
              ← validator ← parser
discovery ← types (only)
```

- `core` depends **only** on `types`
- `parser` and `emitter` depend on `core` + `types`
- `validator` depends on `types` + `core` + `parser`
- `discovery` depends **only** on `types`

## Testing

Tests are fixture-driven where applicable. Conformance fixtures are read directly from the sibling `status-conformance` repository:

```bash
# Run all tests
bun run test

# Run tests for a specific package
bun run --filter '@open-operational-state/parser' test
```

### Round-Trip Invariants

The emitter package includes golden round-trip tests that enforce:

```
parse → normalize → emit → parse → normalize
```

No semantic drift, no loss of required data, no illegal state introduced.

## Related Repositories

| Repository | Purpose |
|---|---|
| [status-spec](https://github.com/open-operational-state/status-spec) | Technical specification (what tooling implements) |
| [status-conformance](https://github.com/open-operational-state/status-conformance) | Conformance fixtures and test taxonomy |
| [governance](https://github.com/open-operational-state/governance) | Charter, terminology, roadmap |

## Project Rules

See [PROJECT_RULES.md](PROJECT_RULES.md) for repo-specific constraints. Key points:

- **ESM only** — no CommonJS
- **Bun** package manager and test runner
- **Node.js + TypeScript** — compiled output targets ES2022
- All behavior must be represented in fixtures or spec

## License

Licensed under [Apache 2.0](LICENSE).
