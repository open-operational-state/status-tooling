/**
 * Probe — fetch, detect, parse, normalize an operational-state endpoint.
 *
 * This is the programmatic API.  The CLI probe command delegates here.
 */

import type { Snapshot, ValidationResult } from '@open-operational-state/types';
import { normalizeSnapshot, validateSnapshot } from '@open-operational-state/core';
import { parse } from '@open-operational-state/parser';
import type { AdapterType } from '@open-operational-state/parser';
import { discover } from '@open-operational-state/discovery';
import type { DiscoverResult } from '@open-operational-state/discovery';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProbeOptions {
    /** Follow OOS discovery (Link headers / well-known) before probing. */
    followDiscovery?: boolean;
    /** Custom headers to send with the probe request. */
    headers?: Record<string, string>;
    /** AbortSignal for cancellation. */
    signal?: AbortSignal;
}

export interface ProbeResult {
    /** The URL that was probed. */
    url: string;
    /** HTTP status code, or null if connection failed. */
    httpStatus: number | null;
    /** Content-Type header value. */
    contentType: string | null;
    /** True if the connection itself failed (DNS, timeout, etc.). */
    connectionError: boolean;
    /** Detected adapter format. */
    detectedFormat: AdapterType | null;
    /** The parsed and normalized Snapshot. */
    snapshot: Snapshot;
    /** Core-model validation result. */
    validation: ValidationResult;
    /** Discovery result, if followDiscovery was enabled. */
    discovery: DiscoverResult | null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Probe an operational-state endpoint.
 *
 * Fetches the URL, auto-detects the response format, parses to the canonical
 * core model, normalizes, and validates.
 *
 * @example
 * ```js
 * import { probe } from '@open-operational-state/probe';
 *
 * const result = await probe( 'https://api.example.com/health' );
 * console.log( result.snapshot.condition ); // 'operational'
 * ```
 */
export async function probe( url: string, options?: ProbeOptions ): Promise<ProbeResult> {
    // ── Optional discovery ─────────────────────────────────────────────
    let discoveryResult: DiscoverResult | null = null;
    let probeUrl = url;

    if ( options?.followDiscovery ) {
        discoveryResult = await discover( url, {
            headers: options?.headers,
        } );

        // If discovery found links, probe the first one instead
        if ( discoveryResult.method === 'link-header' && discoveryResult.links.length > 0 ) {
            probeUrl = discoveryResult.links[0].href;
        } else if ( discoveryResult.method === 'well-known' && discoveryResult.document?.resources ) {
            const resources = discoveryResult.document.resources;
            // Prefer health profile, fall back to first available
            const resource = resources.find( ( r: { profiles: string[] } ) => r.profiles.includes( 'health' ) ) || resources[0];
            if ( resource?.href ) {
                probeUrl = new URL( resource.href, url ).toString();
            }
        }
    }

    // ── Fetch ──────────────────────────────────────────────────────────
    try {
        const fetchOptions: RequestInit = {};
        if ( options?.headers ) { fetchOptions.headers = options.headers; }
        if ( options?.signal ) { fetchOptions.signal = options.signal; }

        const response = await fetch( probeUrl, fetchOptions );
        const contentType = response.headers.get( 'content-type' ) || '';

        let body: unknown;
        const rawText = await response.text();
        try {
            body = JSON.parse( rawText );
        } catch {
            body = rawText;
        }

        const headers: Record<string, string> = {};
        response.headers.forEach( ( value, key ) => {
            headers[key] = value;
        } );

        const parsed = parse( {
            contentType,
            body,
            url: probeUrl,
            httpStatus: response.status,
            headers,
        } );

        const snapshot = normalizeSnapshot( parsed as unknown as Record<string, unknown> );
        const validation = validateSnapshot( snapshot );

        return {
            url: probeUrl,
            httpStatus: response.status,
            contentType,
            connectionError: false,
            detectedFormat: null,
            snapshot,
            validation,
            discovery: discoveryResult,
        };
    } catch {
        // ── Connection failure ─────────────────────────────────────────
        const parsed = parse( {
            url: probeUrl,
            connectionError: true,
        } );

        const snapshot = normalizeSnapshot( parsed as unknown as Record<string, unknown> );
        const validation = validateSnapshot( snapshot );

        return {
            url: probeUrl,
            httpStatus: null,
            contentType: null,
            connectionError: true,
            detectedFormat: null,
            snapshot,
            validation,
            discovery: discoveryResult,
        };
    }
}
