import { put } from '@vercel/blob';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const kv = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "",
});

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
        return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    try {
        const blob = await put(filename, request.body!, {
            access: 'public',
        });

        const id = crypto.randomUUID();
        const metadata = {
            id,
            url: blob.url,
            name: filename.split('.')[0],
            createdAt: new Date().toISOString(),
        };

        await kv.hset('gallery', { [id]: JSON.stringify(metadata) });

        return NextResponse.json(metadata);
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const data = await kv.hgetall('gallery');
        if (!data) return NextResponse.json([]);

        const gallery = Object.values(data).map((item: any) => JSON.parse(item));
        return NextResponse.json(gallery.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    try {
        await kv.hdel('gallery', id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { name } = await request.json();

    if (!id || !name) return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });

    try {
        const itemStr = await kv.hget('gallery', id) as string;
        if (!itemStr) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

        const item = JSON.parse(itemStr);
        item.name = name;
        await kv.hset('gallery', { [id]: JSON.stringify(item) });

        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
