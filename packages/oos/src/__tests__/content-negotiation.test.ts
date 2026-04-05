/**
 * Content negotiation tests
 */

import { describe, expect, test } from 'bun:test';
import { negotiateFormat, mediaTypeFor } from '../content-negotiation.js';
import type { SerializationFormat } from '../content-negotiation.js';

// ---------------------------------------------------------------------------
// negotiateFormat
// ---------------------------------------------------------------------------

describe( 'negotiateFormat', () => {
    const both: SerializationFormat[] = [ 'health-response', 'service-status' ];

    test( 'returns default when Accept is undefined', () => {
        expect( negotiateFormat( undefined, both ) ).toBe( 'health-response' );
    } );

    test( 'returns default when Accept is */*', () => {
        expect( negotiateFormat( '*/*', both ) ).toBe( 'health-response' );
    } );

    test( 'returns default when Accept is empty string', () => {
        expect( negotiateFormat( '', both ) ).toBe( 'health-response' );
    } );

    test( 'selects health-response for application/health+json', () => {
        expect( negotiateFormat( 'application/health+json', both ) ).toBe( 'health-response' );
    } );

    test( 'selects service-status for application/status+json', () => {
        expect( negotiateFormat( 'application/status+json', both ) ).toBe( 'service-status' );
    } );

    test( 'selects first match when Accept has multiple types', () => {
        expect( negotiateFormat( 'text/html, application/status+json, */*', both ) ).toBe( 'service-status' );
    } );

    test( 'falls back to default when no media type matches', () => {
        expect( negotiateFormat( 'text/html', both ) ).toBe( 'health-response' );
    } );

    test( 'ignores q-value parameters', () => {
        expect( negotiateFormat( 'application/status+json; q=0.9', both ) ).toBe( 'service-status' );
    } );

    test( 'is case-insensitive', () => {
        expect( negotiateFormat( 'APPLICATION/STATUS+JSON', both ) ).toBe( 'service-status' );
    } );

    test( 'respects available formats — single format', () => {
        const single: SerializationFormat[] = [ 'health-response' ];
        expect( negotiateFormat( 'application/status+json', single ) ).toBe( 'health-response' );
    } );

    test( 'respects available formats — service-status only', () => {
        const single: SerializationFormat[] = [ 'service-status' ];
        expect( negotiateFormat( undefined, single ) ).toBe( 'service-status' );
    } );
} );

// ---------------------------------------------------------------------------
// mediaTypeFor
// ---------------------------------------------------------------------------

describe( 'mediaTypeFor', () => {
    test( 'health-response returns application/health+json', () => {
        expect( mediaTypeFor( 'health-response' ) ).toBe( 'application/health+json' );
    } );

    test( 'service-status returns application/status+json', () => {
        expect( mediaTypeFor( 'service-status' ) ).toBe( 'application/status+json' );
    } );
} );
