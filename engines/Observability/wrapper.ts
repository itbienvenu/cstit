
import { NextRequest, NextResponse } from 'next/server';
import { ObservabilityEngine } from './logger';
import { LogLevel, LogType } from './types';
import { getUserFromHeader } from '@/lib/auth';

type RouteHandler = (req: NextRequest, context?: any) => Promise<NextResponse> | NextResponse;

export function withObservability(handler: RouteHandler, handlerName?: string) {
    return async (req: NextRequest, context?: any) => {
        const start = Date.now();
        let userId: string | undefined;

        // Attempt to extract user context, but don't fail if it breaks
        try {
            const user = await getUserFromHeader();
            userId = typeof user === 'object' ? (user as any)?.userId || (user as any)?.id : undefined;
        } catch (e) {
            // silent auth check fail
        }

        const path = req.nextUrl ? req.nextUrl.pathname : req.url; // Fallback

        try {
            // Execute the handler
            const response = await handler(req, context);

            const duration = Date.now() - start;

            // Determine logging level
            let level = LogLevel.INFO;
            if (response.status >= 500) level = LogLevel.ERROR;
            else if (response.status >= 400) level = LogLevel.WARN;

            // Asynchronous logging to not block response
            ObservabilityEngine.log({
                level,
                type: LogType.API_REQUEST,
                message: `${req.method} ${path} - ${response.status}`,
                endpoint: path,
                method: req.method,
                userId,
                metadata: {
                    status: response.status,
                    duration: `${duration}ms`,
                    handler: handlerName,
                    query: Object.fromEntries(req.nextUrl.searchParams),
                    userAgent: req.headers.get('user-agent'),
                }
            }).catch(err => console.error('Observability logging failed:', err));

            return response;

        } catch (error) {
            const duration = Date.now() - start;

            // Log connection critical failure
            await ObservabilityEngine.log({
                level: LogLevel.CRITICAL,
                type: LogType.API_REQUEST,
                message: `Unhandled API Error: ${error instanceof Error ? error.message : 'Unknown Error'}`,
                endpoint: path,
                method: req.method,
                userId,
                metadata: {
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    duration: `${duration}ms`,
                    handler: handlerName
                }
            });

            // Return 500 response
            return NextResponse.json(
                { error: 'Internal Server Error', referenceId: Date.now().toString() },
                { status: 500 }
            );
        }
    };
}
