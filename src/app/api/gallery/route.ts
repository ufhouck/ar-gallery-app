import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const kv = Redis.fromEnv();

// Client-side upload token handler
export async function POST(request: Request): Promise<Response> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                return {
                    allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                    addRandomSuffix: true,
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // Yükleme tamamlanınca metadata'yı Redis'e kaydet
                const id = crypto.randomUUID();
                const filename = blob.pathname.split('/').pop() || blob.pathname;
                const name = filename.replace(/\.[^.]+$/, '').replace(/-[a-z0-9]{21}$/, '');
                const metadata = {
                    id,
                    url: blob.url,
                    name,
                    createdAt: new Date().toISOString(),
                };
                await kv.hset('gallery', { [id]: JSON.stringify(metadata) });
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// Metadata endpoint — client upload tamamlanınca url ile çağrılır
export async function PUT(request: Request) {
    try {
        const { url, name } = await request.json();
        if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

        const id = crypto.randomUUID();
        const metadata = {
            id,
            url,
            name: name || url.split('/').pop()?.split('.')[0] || 'görsel',
            createdAt: new Date().toISOString(),
        };
        await kv.hset('gallery', { [id]: JSON.stringify(metadata) });
        return NextResponse.json(metadata);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const clear = searchParams.get('clear');

    if (clear === 'true') {
        try {
            await kv.del('gallery');
            return NextResponse.json({ success: true, message: 'Gallery cleared' });
        } catch (error: any) {
            return NextResponse.json({ error: 'Failed to clear gallery', details: error.message }, { status: 500 });
        }
    }

    try {
        const data = await kv.hgetall('gallery');
        if (!data) return NextResponse.json([]);

        const gallery = Object.values(data).map((item: any) => {
            if (!item) return null;
            try {
                if (typeof item === 'object' && !Array.isArray(item)) {
                    if (Object.keys(item).length === 0) return null;
                    return item;
                }
                if (typeof item === 'string') {
                    const trimmed = item.trim();
                    if (trimmed === "[object Object]" || trimmed === "undefined" || trimmed === "" || trimmed.startsWith('[object')) return null;
                    return JSON.parse(trimmed);
                }
            } catch { return null; }
            return null;
        }).filter((item): item is any => item !== null && typeof item === 'object' && (item.url || item.id));

        return NextResponse.json(gallery.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        }));
    } catch (error: any) {
        console.error('Fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch gallery', details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    try {
        await kv.hdel('gallery', id);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { name } = await request.json();
    if (!id || !name) return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });

    try {
        const itemVal = await kv.hget('gallery', id);
        if (!itemVal) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        let item: any;
        if (typeof itemVal === 'object') { item = itemVal; }
        else {
            try { item = JSON.parse(itemVal as string); }
            catch { return NextResponse.json({ error: 'Corrupted data' }, { status: 500 }); }
        }
        item.name = name;
        await kv.hset('gallery', { [id]: JSON.stringify(item) });
        return NextResponse.json(item);
    } catch {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
