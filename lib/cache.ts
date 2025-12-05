import { LRUCache } from 'lru-cache';
import clientPromise from '@/lib/db';

const options = {
    max: 500, // Max 500 items
    ttl: 1000 * 60 * 60, // 1 hour TTL
};

const cache = new LRUCache(options);

export async function getOrganizationByCode(code: string) {
    const cacheKey = `org_code_${code}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    const client = await clientPromise;
    const db = client.db('blog_app');
    const org = await db.collection('organizations').findOne({ code });

    if (org) {
        cache.set(cacheKey, org);
    }

    return org;
}

export async function invalidateOrgCache(code: string) {
    cache.delete(`org_code_${code}`);
}
