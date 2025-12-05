import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';

// Rate Limiter Configuration
const rateLimit = new LRUCache<string, number>({
    max: 500, // Max 500 unique IPs tracked
    ttl: 60 * 1000, // 1 minute window
});

const RATE_LIMIT_LIMIT = 300; // 300 requests per minute (approx 5 req/sec)

export function middleware(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const { pathname } = request.nextUrl;

    // 1. Logging
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] ${request.method} ${pathname} - IP: ${ip}`);

    if (pathname.startsWith('/api')) {
        const currentUsage = rateLimit.get(ip) || 0;
        if (currentUsage >= RATE_LIMIT_LIMIT) {
            return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        rateLimit.set(ip, currentUsage + 1);
    }

    // 3. CSP & Security Headers
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

    const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', cspHeader);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Completed ${pathname} in ${duration}ms`);

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
