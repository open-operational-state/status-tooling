/**
 * createHooks() tests
 */

import { describe, expect, test } from 'bun:test';
import { createHooks } from '../hooks.js';
import type { ConditionChangedEvent, CheckFailedEvent, RequestHandledEvent } from '../hooks.js';

// ---------------------------------------------------------------------------
// on / emit
// ---------------------------------------------------------------------------

describe( 'on + emit', () => {
    test( 'fires listener on matching event', () => {
        const hooks = createHooks();
        const events: ConditionChangedEvent[] = [];

        hooks.on( 'conditionChanged', ( e ) => events.push( e ) );

        hooks.emit( 'conditionChanged', {
            previous: 'operational',
            current: 'degraded',
            timestamp: '2026-01-01T00:00:00Z',
        } );

        expect( events ).toHaveLength( 1 );
        expect( events[0].previous ).toBe( 'operational' );
        expect( events[0].current ).toBe( 'degraded' );
    } );

    test( 'supports multiple listeners on the same event', () => {
        const hooks = createHooks();
        let count = 0;

        hooks.on( 'conditionChanged', () => count++ );
        hooks.on( 'conditionChanged', () => count++ );

        hooks.emit( 'conditionChanged', {
            previous: 'operational',
            current: 'down',
            timestamp: '2026-01-01T00:00:00Z',
        } );

        expect( count ).toBe( 2 );
    } );

    test( 'does not fire listeners for other events', () => {
        const hooks = createHooks();
        let called = false;

        hooks.on( 'checkFailed', () => { called = true; } );

        hooks.emit( 'conditionChanged', {
            previous: 'operational',
            current: 'degraded',
            timestamp: '2026-01-01T00:00:00Z',
        } );

        expect( called ).toBe( false );
    } );

    test( 'emit with no listeners does not throw', () => {
        const hooks = createHooks();

        expect( () => hooks.emit( 'conditionChanged', {
            previous: 'operational',
            current: 'degraded',
            timestamp: '2026-01-01T00:00:00Z',
        } ) ).not.toThrow();
    } );
} );

// ---------------------------------------------------------------------------
// off
// ---------------------------------------------------------------------------

describe( 'off', () => {
    test( 'removes a specific listener', () => {
        const hooks = createHooks();
        let count = 0;
        const listener = () => count++;

        hooks.on( 'conditionChanged', listener );
        hooks.emit( 'conditionChanged', {
            previous: 'operational',
            current: 'degraded',
            timestamp: '2026-01-01T00:00:00Z',
        } );
        expect( count ).toBe( 1 );

        hooks.off( 'conditionChanged', listener );
        hooks.emit( 'conditionChanged', {
            previous: 'degraded',
            current: 'down',
            timestamp: '2026-01-01T00:00:00Z',
        } );
        expect( count ).toBe( 1 ); // not incremented
    } );

    test( 'unsubscribe function from on() works', () => {
        const hooks = createHooks();
        let count = 0;

        const unsub = hooks.on( 'conditionChanged', () => count++ );
        hooks.emit( 'conditionChanged', {
            previous: 'operational',
            current: 'degraded',
            timestamp: '2026-01-01T00:00:00Z',
        } );
        expect( count ).toBe( 1 );

        unsub();
        hooks.emit( 'conditionChanged', {
            previous: 'degraded',
            current: 'down',
            timestamp: '2026-01-01T00:00:00Z',
        } );
        expect( count ).toBe( 1 );
    } );
} );

// ---------------------------------------------------------------------------
// once
// ---------------------------------------------------------------------------

describe( 'once', () => {
    test( 'fires only once then auto-removes', () => {
        const hooks = createHooks();
        let count = 0;

        hooks.once( 'conditionChanged', () => count++ );

        hooks.emit( 'conditionChanged', {
            previous: 'operational',
            current: 'degraded',
            timestamp: '2026-01-01T00:00:00Z',
        } );
        hooks.emit( 'conditionChanged', {
            previous: 'degraded',
            current: 'down',
            timestamp: '2026-01-01T00:00:00Z',
        } );

        expect( count ).toBe( 1 );
    } );

    test( 'unsubscribe from once() prevents first fire', () => {
        const hooks = createHooks();
        let count = 0;

        const unsub = hooks.once( 'conditionChanged', () => count++ );
        unsub();

        hooks.emit( 'conditionChanged', {
            previous: 'operational',
            current: 'degraded',
            timestamp: '2026-01-01T00:00:00Z',
        } );

        expect( count ).toBe( 0 );
    } );
} );

// ---------------------------------------------------------------------------
// Error isolation
// ---------------------------------------------------------------------------

describe( 'error isolation', () => {
    test( 'listener errors do not propagate', () => {
        const hooks = createHooks();

        hooks.on( 'conditionChanged', () => { throw new Error( 'boom' ); } );

        expect( () => hooks.emit( 'conditionChanged', {
            previous: 'operational',
            current: 'degraded',
            timestamp: '2026-01-01T00:00:00Z',
        } ) ).not.toThrow();
    } );

    test( 'listener errors do not prevent other listeners from firing', () => {
        const hooks = createHooks();
        let secondCalled = false;

        hooks.on( 'conditionChanged', () => { throw new Error( 'boom' ); } );
        hooks.on( 'conditionChanged', () => { secondCalled = true; } );

        hooks.emit( 'conditionChanged', {
            previous: 'operational',
            current: 'degraded',
            timestamp: '2026-01-01T00:00:00Z',
        } );

        expect( secondCalled ).toBe( true );
    } );
} );

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

describe( 'event types', () => {
    test( 'checkFailed event carries correct payload', () => {
        const hooks = createHooks();
        const events: CheckFailedEvent[] = [];

        hooks.on( 'checkFailed', ( e ) => events.push( e ) );

        hooks.emit( 'checkFailed', {
            name: 'database',
            entry: {
                condition: 'unknown',
                role: 'dependency',
                evidence: { type: 'timeout', detail: 'Timed out after 5000ms' },
            },
            timedOut: true,
        } );

        expect( events[0].name ).toBe( 'database' );
        expect( events[0].timedOut ).toBe( true );
        expect( events[0].entry.evidence?.type ).toBe( 'timeout' );
    } );

    test( 'requestHandled event carries correct payload', () => {
        const hooks = createHooks();
        const events: RequestHandledEvent[] = [];

        hooks.on( 'requestHandled', ( e ) => events.push( e ) );

        hooks.emit( 'requestHandled', {
            condition: 'operational',
            status: 200,
            durationMs: 3,
            timestamp: '2026-01-01T00:00:00Z',
        } );

        expect( events[0].condition ).toBe( 'operational' );
        expect( events[0].status ).toBe( 200 );
        expect( events[0].durationMs ).toBe( 3 );
    } );
} );
