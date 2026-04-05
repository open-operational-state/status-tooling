/**
 * Content Negotiation
 *
 * Parses the Accept header and selects the best serialization format.
 * Exact media type matching with wildcard fallback (Accept: any) -- no
 * q-value parsing. Sufficient for the two OOS media types.
 */

import { Serialization } from './constants.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Serialization format identifiers. */
export type SerializationFormat = 'health-response' | 'service-status';

// ---------------------------------------------------------------------------
// Media type → format mapping
// ---------------------------------------------------------------------------

const MEDIA_MAP: Record<string, SerializationFormat> = {
    'application/health+json': 'health-response',
    'application/status+json': 'service-status',
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Select the best serialization format based on the Accept header.
 *
 * @param accept - The raw Accept header value (may be undefined/empty).
 * @param available - Formats the handler supports, in preference order.
 * @returns The selected format -- always one of the available formats.
 *
 * @example
 * negotiateFormat( 'application/status+json', [ 'health-response', 'service-status' ] );
 * // => 'service-status'
 *
 * negotiateFormat( undefined, [ 'health-response' ] );
 * // => 'health-response'
 */
export function negotiateFormat(
    accept: string | undefined,
    available: SerializationFormat[],
): SerializationFormat {
    if ( available.length === 0 ) {
        throw new Error(
            '[oos] negotiateFormat: available formats array must not be empty.',
        );
    }

    // No Accept header or wildcard → default (first available)
    if ( !accept || accept === '*/*' ) {
        return available[0];
    }

    // Split on comma, trim, check each media type against available formats
    const types = accept.split( ',' ).map( ( t ) => t.trim().split( ';' )[0].trim().toLowerCase() );

    for ( const type of types ) {
        if ( type === '*/*' ) {
            return available[0];
        }
        const format = MEDIA_MAP[type];
        if ( format && available.includes( format ) ) {
            return format;
        }
    }

    // No match — return default
    return available[0];
}

/**
 * Get the media type string for a serialization format.
 */
export function mediaTypeFor( format: SerializationFormat ): 'application/health+json' | 'application/status+json' {
    return format === 'service-status'
        ? Serialization.SERVICE_STATUS_MEDIA_TYPE as 'application/status+json'
        : Serialization.HEALTH_RESPONSE_MEDIA_TYPE as 'application/health+json';
}
