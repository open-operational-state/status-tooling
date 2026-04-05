/**
 * @open-operational-state/oos
 *
 * The developer-facing package for Open Operational State.
 *
 * Curated re-exports — small, opinionated, stable.
 *   - serve(): producer API — serve your own operational state
 *   - probe(): consumer API — probe someone else's operational state
 */

// ── Serve (producer API) ──────────────────────────────────────────────
export { serve } from './serve.js';
export type {
    OosHandler,
    OosRequest,
    HandlerResult,
    ServeConfig,
    ConditionProvider,
    AuthPredicate,
} from './serve.js';

// ── Check registry (dynamic health checks) ───────────────────────────
export { createCheckRegistry } from './check-registry.js';
export type {
    CheckRegistry,
    CheckRegistryResult,
    CheckConfig,
    CheckResult,
} from './check-registry.js';

// ── Lifecycle (startup / shutdown) ────────────────────────────────────
export { createLifecycle } from './lifecycle.js';
export type {
    Lifecycle,
    LifecycleConfig,
    LifecyclePhase,
} from './lifecycle.js';

// ── Observable hooks ──────────────────────────────────────────────────
export { createHooks } from './hooks.js';
export type {
    Hooks,
    HookEventMap,
    HookEventName,
    HookListener,
    ConditionChangedEvent,
    CheckFailedEvent,
    RequestHandledEvent,
} from './hooks.js';

// ── Content negotiation ───────────────────────────────────────────────
export { negotiateFormat, mediaTypeFor } from './content-negotiation.js';
export type { SerializationFormat } from './content-negotiation.js';

// ── Discovery ─────────────────────────────────────────────────────────
export { createDiscoveryHandler } from './discovery-handler.js';
export type { DiscoveryConfig } from './discovery-handler.js';
export { discoveryLinkHeader } from './discovery-middleware.js';

// ── Exposure filtering ────────────────────────────────────────────────
export { filterByExposure } from './exposure.js';

// ── Named constants ───────────────────────────────────────────────────
export {
    Condition,
    Profile,
    Exposure,
    Serialization,
    ProvenanceType,
    Role,
} from './constants.js';
export type {
    ConditionValue,
    ProfileValue,
    ExposureValue,
    SerializationValue,
    ProvenanceTypeValue,
    RoleValue,
} from './constants.js';

// ── Probe (consumer API) ──────────────────────────────────────────────
export { probe } from '@open-operational-state/probe';
export type { ProbeResult, ProbeOptions } from '@open-operational-state/probe';

// ── Types (commonly needed by consumers) ──────────────────────────────
export type {
    Snapshot,
    Subject,
    Evidence,
    Timing,
    CheckEntry,
    ValidationResult,
    ValidationError,
    ValidationWarning,
    DiscoveryDocument,
} from '@open-operational-state/types';

// ── Condition vocabulary (severity ordering, type guards) ─────────────
export {
    conditionSeverity,
    isOrderableCondition,
    HEALTH_ORDERABLE_CONDITIONS,
    HEALTH_CATEGORICAL_CONDITIONS,
    LIVENESS_CONDITIONS,
    READINESS_CONDITIONS,
} from '@open-operational-state/types';
