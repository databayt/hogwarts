/**
 * Lambda@Edge function for authentication at CloudFront edge locations
 * Validates JWT tokens and enforces school-based access control
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Cache for JWT secret (fetched from environment)
let jwtSecret = null;

exports.handler = async (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    try {
        // Get JWT secret (cached for performance)
        if (!jwtSecret) {
            jwtSecret = process.env.JWT_SECRET;
        }

        // Check if request requires authentication
        if (shouldRequireAuth(request.uri)) {
            // Extract authorization header
            const authHeader = headers.authorization?.[0]?.value;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return unauthorizedResponse('Missing or invalid authorization header');
            }

            const token = authHeader.substring(7);

            try {
                // Verify JWT token
                const decoded = jwt.verify(token, jwtSecret, {
                    algorithms: ['HS256'],
                    maxAge: '24h'
                });

                // Extract school ID from token
                const schoolId = decoded.schoolId;

                if (!schoolId) {
                    return unauthorizedResponse('Missing school ID in token');
                }

                // Validate path access for school
                if (!validateSchoolAccess(request.uri, schoolId)) {
                    return forbiddenResponse('Access denied for this school');
                }

                // Add school ID to request headers for origin
                request.headers['x-school-id'] = [{ key: 'X-School-Id', value: schoolId }];
                request.headers['x-user-id'] = [{ key: 'X-User-Id', value: decoded.userId }];
                request.headers['x-user-role'] = [{ key: 'X-User-Role', value: decoded.role }];

            } catch (error) {
                console.error('JWT verification failed:', error.message);
                return unauthorizedResponse('Invalid or expired token');
            }
        }

        // Add security headers
        request.headers['x-request-id'] = [{
            key: 'X-Request-Id',
            value: generateRequestId()
        }];

        // Continue to origin
        callback(null, request);

    } catch (error) {
        console.error('Auth handler error:', error);
        callback(null, errorResponse('Internal server error'));
    }
};

/**
 * Check if the path requires authentication
 */
function shouldRequireAuth(uri) {
    // Public paths that don't require auth
    const publicPaths = [
        '/public/',
        '/health',
        '/robots.txt',
        '/favicon.ico',
        '/.well-known/'
    ];

    // Check if path is public
    for (const publicPath of publicPaths) {
        if (uri.startsWith(publicPath)) {
            return false;
        }
    }

    // All school-specific paths require auth
    if (uri.includes('/schools/')) {
        return true;
    }

    // Default to no auth for static assets
    const staticExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.css', '.js', '.woff2'];
    const hasStaticExtension = staticExtensions.some(ext => uri.endsWith(ext));

    return !hasStaticExtension;
}

/**
 * Validate that the school ID has access to the requested path
 */
function validateSchoolAccess(uri, schoolId) {
    // Extract school ID from path if present
    const pathMatch = uri.match(/\/schools\/([^\/]+)\//);

    if (pathMatch) {
        const pathSchoolId = pathMatch[1];

        // Platform admins (no schoolId) can access any school
        if (!schoolId) {
            return true;
        }

        // Regular users can only access their own school
        return pathSchoolId === schoolId;
    }

    // Non-school paths are accessible
    return true;
}

/**
 * Generate a unique request ID for tracing
 */
function generateRequestId() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Create 401 Unauthorized response
 */
function unauthorizedResponse(message) {
    return {
        status: '401',
        statusDescription: 'Unauthorized',
        headers: {
            'content-type': [{
                key: 'Content-Type',
                value: 'application/json'
            }],
            'cache-control': [{
                key: 'Cache-Control',
                value: 'no-cache, no-store, must-revalidate'
            }],
            'www-authenticate': [{
                key: 'WWW-Authenticate',
                value: 'Bearer realm="Hogwarts File Upload"'
            }]
        },
        body: JSON.stringify({
            error: 'Unauthorized',
            message: message,
            timestamp: new Date().toISOString()
        })
    };
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