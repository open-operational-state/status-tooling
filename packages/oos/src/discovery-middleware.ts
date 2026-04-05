/**
 * Discovery Link Header Middleware
 *
 * Returns the Link header value that advertises the OOS discovery
 * endpoint. Framework-agnostic — returns a string that adapters
 * or users apply to their framework's response.
 */

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the Link header value for OOS discovery.
 *
 * @param path - Well-known path.  Default: `/.well-known/operational-state`.
 * @returns The Link header value string.
 *
 * ```ts
 * const link = discoveryLinkHeader();
 * // → '</.well-known/operational-state>; rel="operational-state"'
 *
 * // Express middleware
 * app.use( ( req, res, next ) => {
 *     res.setHeader( 'Link', discoveryLinkHeader() );
 *     next();
 * } );
 * ```
 */
export function discoveryLinkHeader(
    path: string = '/.well-known/operational-state',
): string {
    return `<${path}>; rel="operational-state"`;
}
