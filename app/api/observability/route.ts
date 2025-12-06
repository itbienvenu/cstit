
import { NextRequest, NextResponse } from 'next/server';
import { ObservabilityEngine } from '@/engines/Observability/logger';
import { getUserFromHeader } from '@/lib/auth';
import { withObservability } from '@/engines/Observability/wrapper';

async function handler(req: NextRequest) {
    // Authentication Check
    const user = await getUserFromHeader();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add Role Check her

    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'stats') {
        const stats = await ObservabilityEngine.getStats();
        return NextResponse.json(stats);
    }

    // Default: Get logs
    const limit = parseInt(searchParams.get('limit') || '50');
    const level = searchParams.get('level');

    const filter: any = {};
    if (level) filter.level = level;

    const logs = await ObservabilityEngine.getLogs(limit, filter);

    return NextResponse.json({ logs });
}

export const GET = withObservability(handler, 'ObservabilityDashboardAPI');
