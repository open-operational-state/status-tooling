/**
 * Observable Hooks
 *
 * Minimal event emitter for health handler lifecycle events.
 * Enables logging, alerting, and custom integrations without
 * external dependencies.
 *
 * Design:
 *   - Zero dependencies — uses a simple listener map
 *   - Type-safe event names and payloads
 *   - Listener errors are isolated — a bad listener never
 *     crashes the health handler
 *   - Synchronous dispatch — listeners run inline (keep them fast)
 */

import type { CheckEntry } from '@open-operational-state/types';

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

/** Payload for a condition transition. */
export interface ConditionChangedEvent {
    /** The previous condition value. */
    previous: string;
    /** The new condition value. */
    current: string;
    /** ISO 8601 timestamp of the transition. */
    timestamp: string;
}

/** Payload for a check failure or timeout. */
export interface CheckFailedEvent {
    /** Name of the check that failed. */
    name: string;
    /** The check entry with condition and evidence. */
    entry: CheckEntry;
    /** Whether the failure was a timeout. */
    timedOut: boolean;
}

/** Payload emitted after each handler invocation. */
export interface RequestHandledEvent {
    /** The condition returned in the response. */
    condition: string;
    /** HTTP status code returned. */
    status: number;
    /** Request duration in milliseconds. */
    durationMs: number;
    /** ISO 8601 timestamp. */
    timestamp: string;
}

/** Map of event names to their payload types. */
export interface HookEventMap {
    conditionChanged: ConditionChangedEvent;
    checkFailed: CheckFailedEvent;
    requestHandled: RequestHandledEvent;
}

/** Valid event names. */
export type HookEventName = keyof HookEventMap;

/** Listener function for a given event. */
export type HookListener<E extends HookEventName> = ( event: HookEventMap[E] ) => void;

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

/** Observable hooks instance. */
export interface Hooks {
    /** Subscribe to an event. Returns an unsubscribe function. */
    on<E extends HookEventName>( event: E, listener: HookListener<E> ): () => void;

    /** Subscribe to an event, auto-removing after first invocation. */
    once<E extends HookEventName>( event: E, listener: HookListener<E> ): () => void;

    /** Remove a specific listener. */
    off<E extends HookEventName>( event: E, listener: HookListener<E> ): void;

    /** Emit an event to all registered listeners. */
    emit<E extends HookEventName>( event: E, payload: HookEventMap[E] ): void;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create an observable hooks instance.
 *
 * ```ts
 * const hooks = createHooks();
 *
 * hooks.on( 'conditionChanged', ( { previous, current } ) => {
 *     console.log( `Health: ${previous} → ${current}` );
 * } );
 *
 * hooks.on( 'checkFailed', ( { name, entry } ) => {
 *     console.warn( `Check ${name} failed: ${entry.evidence?.detail}` );
 * } );
 * ```
 */
export function createHooks(): Hooks {
    const listeners = new Map<string, Set<Function>>();

    function getSet( event: string ): Set<Function> {
        let s = listeners.get( event );
        if ( !s ) {
            s = new Set();
            listeners.set( event, s );
        }
        return s;
    }

    function on<E extends HookEventName>( event: E, listener: HookListener<E> ): () => void {
        getSet( event ).add( listener );
        return () => off( event, listener );
    }

    function once<E extends HookEventName>( event: E, listener: HookListener<E> ): () => void {
        const wrapper = ( ( payload: HookEventMap[E] ) => {
            off( event, wrapper as unknown as HookListener<E> );
            listener( payload );
        } ) as unknown as HookListener<E>;
        return on( event, wrapper );
    }

    function off<E extends HookEventName>( event: E, listener: HookListener<E> ): void {
        const s = listeners.get( event );
        if ( s ) {
            s.delete( listener );
            if ( s.size === 0 ) {
                listeners.delete( event );
            }
        }
    }

    function emit<E extends HookEventName>( event: E, payload: HookEventMap[E] ): void {
        const s = listeners.get( event );
        if ( !s ) { return; }
        for ( const fn of s ) {
            try {
                const result = fn( payload );
                // Catch rejected promises from async listeners
                if ( result && typeof ( result as any ).catch === 'function' ) {
                    ( result as Promise<unknown> ).catch( () => {} );
                }
            } catch {
                // Listener errors are isolated — never propagate
            }
        }
    }

    return { on, once, off, emit };
}
