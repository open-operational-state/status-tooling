/**
 * Discovery handler + middleware tests
 */

import { describe, expect, test } from 'bun:test';
import { createDiscoveryHandler } from '../discovery-handler.js';
import { discoveryLinkHeader } from '../discovery-middleware.js';
import type { ResourceEntry } from '@open-operational-state/types';

// ---------------------------------------------------------------------------
// discoveryLinkHeader
// ---------------------------------------------------------------------------

describe( 'discoveryLinkHeader', () => {
    test( 'returns default well-known path', () => {
        expect( discoveryLinkHeader() ).toBe(
            '</.well-known/operational-state>; rel="operational-state"',
        );
    } );

    test( 'accepts a custom path', () => {
        expect( discoveryLinkHeader( '/custom/discovery' ) ).toBe(
            '</custom/discovery>; rel="operational-state"',
        );
    } );
} );

// ---------------------------------------------------------------------------
// createDiscoveryHandler — configuration
// ---------------------------------------------------------------------------

describe( 'createDiscoveryHandler configuration', () => {
    test( 'throws if subject.id is missing', () => {
        expect( () => createDiscoveryHandler( {
            subject: { id: '' },
            resources: [ { href: '/health', profiles: [ 'health' ], serialization: 'application/health+json' } ],
        } ) ).toThrow( 'subject.id is required' );
    } );

    test( 'throws if resources is empty', () => {
        expect( () => createDiscoveryHandler( {
            subject: { id: 'test' },
            resources: [],
        } ) ).toThrow( 'at least one resource' );
    } );
} );

// ---------------------------------------------------------------------------
// createDiscoveryHandler — response
// ---------------------------------------------------------------------------

const RESOURCES: ResourceEntry[] = [
    {
        href: '/health',
        profiles: [ 'health' ],
        serialization: 'application/health+json',
    },
    {
        href: '/status',
        profiles: [ 'health' ],
        serialization: 'application/status+json',
        auth: 'required',
    },
];

describe( 'createDiscoveryHandler response', () => {
    test( 'returns a valid discovery document', async () => {
        const handler = createDiscoveryHandler( {
            subject: { id: 'my-api', description: 'My API' },
            resources: RESOURCES,
        } );

        const result = await handler( { headers: {} } );

        expect( result.status ).toBe( 200 );
        expect( result.headers['Content-Type'] ).toBe( 'application/json' );

        const doc = result.body as Record<string, unknown>;
        expect( doc.version ).toBe( '1.0' );
        expect( ( doc.subject as Record<string, unknown> ).id ).toBe( 'my-api' );
        expect( ( doc.subject as Record<string, unknown> ).description ).toBe( 'My API' );
        expect( doc.resources ).toHaveLength( 2 );
    } );

    test( 'includes Link header', async () => {
        const handler = createDiscoveryHandler( {
            subject: { id: 'my-api' },
            resources: RESOURCES.slice( 0, 1 ),
        } );

        const result = await handler( { headers: {} } );
        expect( result.headers['Link'] ).toBe(
            '</.well-known/operational-state>; rel="operational-state"',
        );
    } );

    test( 'uses custom version', async () => {
        const handler = createDiscoveryHandler( {
            subject: { id: 'my-api' },
            resources: RESOURCES.slice( 0, 1 ),
            version: '2.0',
        } );

        const result = await handler( { headers: {} } );
        expect( ( result.body as Record<string, unknown> ).version ).toBe( '2.0' );
    } );

    test( 'includes cache-control header', async () => {
        const handler = createDiscoveryHandler( {
            subject: { id: 'my-api' },
            resources: RESOURCES.slice( 0, 1 ),
        } );

        const result = await handler( { headers: {} } );
        expect( result.headers['Cache-Control'] ).toBe( 'public, max-age=3600' );
    } );

    test( 'is idempotent — returns frozen result', async () => {
        const handler = createDiscoveryHandler( {
            subject: { id: 'my-api' },
            resources: RESOURCES.slice( 0, 1 ),
        } );

        const a = await handler( { headers: {} } );
        const b = await handler( { headers: {} } );
        expect( a ).toBe( b ); // same frozen object
    } );
} );
