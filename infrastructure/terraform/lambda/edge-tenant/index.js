/**
 * Lambda@Edge function for tenant isolation
 * Ensures multi-tenant data isolation at the edge
 */

exports.handler = async (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    try {
        // Extract school ID from headers (set by auth function)
        const schoolId = headers['x-school-id']?.[0]?.value;

        if (!schoolId) {
            // For public resources, allow access
            if (isPublicResource(request.uri)) {
                callback(null, request);
                return;
            }

            // Require school ID for protected resources
            return callback(null, forbiddenResponse('School context required'));
        }

        // Validate and rewrite S3 path for tenant isolation
        const originalUri = request.uri;

        // Rewrite path to include school ID prefix if accessing uploads
        if (originalUri.startsWith('/uploads/') || originalUri.startsWith('/files/')) {
            // Ensure path includes school ID
            const rewrittenUri = `/schools/${schoolId}${originalUri}`;
            request.uri = rewrittenUri;

            // Add custom header for logging
            request.headers['x-original-uri'] = [{
                key: 'X-Original-Uri',
                value: originalUri
            }];

            request.headers['x-rewritten-uri'] = [{
                key: 'X-Rewritten-Uri',
                value: rewrittenUri
            }];
        }

        // Validate school-specific paths
        if (originalUri.includes('/schools/')) {
            const pathSchoolId = extractSchoolIdFromPath(originalUri);

            if (pathSchoolId && pathSchoolId !== schoolId) {
                // Check if user is platform admin
                const userRole = headers['x-user-role']?.[0]?.value;

                if (userRole !== 'DEVELOPER' && userRole !== 'PLATFORM_ADMIN') {
                    return callback(null, forbiddenResponse('Access denied to other school resources'));
                }
            }
        }

        // Add tenant context headers for origin
        request.headers['x-tenant-context'] = [{
            key: 'X-Tenant-Context',
            value: JSON.stringify({
                schoolId: schoolId,
                timestamp: new Date().toISOString(),
                originalPath: originalUri
            })
        }];

        // Add cache key modifier for per-school caching
        if (request.headers['cache-control']) {
            const cacheKey = `school-${schoolId}`;
            request.headers['x-cache-key'] = [{
                key: 'X-Cache-Key',
                value: cacheKey
            }];
        }

        // Continue to origin with modified request
        callback(null, request);

    } catch (error) {
        console.error('Tenant isolation error:', error);
        callback(null, errorResponse('Tenant isolation failed'));
    }
};

/**
 * Check if the resource is public (no tenant isolation needed)
 */
function isPublicResource(uri) {
    const publicPaths = [
        '/public/',
        '/assets/',
        '/static/',
        '/health',
        '/robots.txt',
        '/favicon.ico',
        '/.well-known/',
        '/manifest.json'
    ];

    return publicPaths.some(path => uri.startsWith(path));
}

/**
 * Extract school ID from path
 */
function extractSchoolIdFromPath(uri) {
    const match = uri.match(/\/schools\/([^\/]+)/);
    return match ? match[1] : null;
}

/**
 * Create 403 Forbidden response
 */
function forbiddenResponse(message) {
    return {
        status: '403',
        statusDescription: 'Forbidden',
        headers: {
            'content-type': [{
                key: 'Content-Type',
                value: 'application/json'
            }],
            'cache-control': [{
                key: 'Cache-Control',
                value: 'no-cache, no-store, must-revalidate'
            }]
        },
        body: JSON.stringify({
            error: 'Forbidden',
            message: message,
            timestamp: new Date().toISOString()
        })
    };
}

/**
 * Create 500 Error response
 */
function errorResponse(message) {
    return {
        status: '500',
        statusDescription: 'Internal Server Error',
        headers: {
            'content-type': [{
                key: 'Content-Type',
                value: 'application/json'
            }],
            'cache-control': [{
                key: 'Cache-Control',
                value: 'no-cache, no-store, must-revalidate'
            }]
        },
        body: JSON.stringify({
            error: 'Internal Server Error',
            message: message,
            timestamp: new Date().toISOString()
        })
    };
}