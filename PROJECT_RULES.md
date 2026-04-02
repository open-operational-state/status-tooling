# Status Tooling — Project Rules

This document supplements the [canonical org-wide PROJECT_RULES.md](https://github.com/open-operational-state/.github/blob/main/PROJECT_RULES.md).

---

## Repo-Specific Constraints

- This is a monorepo managed with **Bun** workspaces.
- Runtime: **Node.js + TypeScript** only.
- **ESM only** — no CommonJS.
- All code is licensed under **Apache 2.0**.
- Do not add Go, Rust, or other runtime implementations in v1. A second runtime may be considered after adoption materializes.
- Package stubs should not contain substantive implementation until the architecture and terminology in `status-spec` are stabilized.
- Tooling must remain vendor-neutral. No dependencies on commercial product APIs, no phone-home behavior, no commercial onboarding assumptions.
- Do not create packages beyond the established set (`types`, `core`, `parser`, `emitter`, `validator`, `discovery`) without explicit approval.
