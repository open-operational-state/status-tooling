/**
 * Discovery Handler
 *
 * Factory that creates a handler serving the OOS discovery document
 * at /.well-known/operational-state.
 *
 * Returns the same OosHandler shape as serve() — framework-agnostic,
 * compose with the same adapters.
 */

import type { DiscoveryDocument, ResourceEntry, Subject } from '@open-operational-state/types';
import type { OosHandler, OosRequest, HandlerResult } from './serve.js';
import { discoveryLinkHeader } from './discovery-middleware.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Configuration for createDiscoveryHandler(). */
export interface DiscoveryConfig {
    /** Subject identity — same as serve(). */
    subject: {
        id: string;
        description?: string;
    };

    /** OOS resources this service exposes. */
    resources: ResourceEntry[];

    /** Discovery document version.  Default: '1.0'. */
    version?: string;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a handler that serves the OOS discovery document.
 *
 * ```ts
 * const discovery = createDiscoveryHandler( {
 *     subject: { id: 'my-api' },
 *     resources: [
 *         { href: '/health', profiles: [ 'health' ], serialization: 'application/health+json' },
 *     ],
 * } );
 * ```
 */
export function createDiscoveryHandler( config: DiscoveryConfig ): OosHandler {
    if ( !config.subject || !config.subject.id ) {
        throw new Error(
            '[oos] Configuration error: subject.id is required for discovery handler.\n' +
            'Fix: createDiscoveryHandler( { subject: { id: \'my-service\' }, resources: [...] } )',
        );
    }

    if ( !config.resources || config.resources.length === 0 ) {
        throw new Error(
            '[oos] Configuration error: at least one resource is required.\n' +
            'Fix: createDiscoveryHandler( { subject: { id: \'my-service\' }, resources: [ { href: \'/health\', profiles: [ \'health\' ], serialization: \'application/health+json\' } ] } )',
        );
    }

    // Pre-build the document (static, never changes per-request)
    const document: DiscoveryDocument = {
        version: config.version ?? '1.0',
        subject: {
            id: config.subject.id,
            ...( config.subject.description
                ? { description: config.subject.description }
                : {} ),
        },
        resources: config.resources,
    };

    const body = JSON.stringify( document );
    const linkHeader = discoveryLinkHeader();

    const result: HandlerResult = Object.freeze( {
        status: 200,
        headers: {
            'content-type': 'application/json',
            'cache-control': 'public, max-age=3600',
            'link': linkHeader,
        },
        body: document,
    } );

    const handler: OosHandler = async () => {
        return result;
    };

    return handler;
}
