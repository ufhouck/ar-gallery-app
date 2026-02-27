import { NextResponse } from 'next/server';
import JSZip from 'jszip';

function buildUsda(filename: string, aspectRatio: number): string {
    const width = 0.5; // metre cinsinden
    const height = width / aspectRatio;
    const hw = width / 2;
    const hh = height / 2;
    return `#usda 1.0
(
    defaultPrim = "Root"
    metersPerUnit = 1
    upAxis = "Y"
)
def Xform "Root"
{
    def Mesh "Plane" (
        prepend apiSchemas = ["MaterialBindingAPI"]
    )
    {
        float3[] extent = [(-${hw}, -${hh}, 0), (${hw}, ${hh}, 0)]
        int[] faceVertexCounts = [4]
        int[] faceVertexIndices = [0, 1, 2, 3]
        normal3f[] normals = [(0, 0, 1), (0, 0, 1), (0, 0, 1), (0, 0, 1)] (
            interpolation = "faceVarying"
        )
        point3f[] points = [(-${hw}, -${hh}, 0), (${hw}, -${hh}, 0), (${hw}, ${hh}, 0), (-${hw}, ${hh}, 0)]
        texCoord2f[] primvars:st = [(0, 0), (1, 0), (1, 1), (0, 1)] (
            interpolation = "faceVarying"
        )
        uniform token subdivisionScheme = "none"
        rel material:binding = </Root/Plane/Material>
        def Material "Material"
        {
            token outputs:surface.connect = </Root/Plane/Material/PBRShader.outputs:surface>
            def Shader "PBRShader"
            {
                uniform token info:id = "UsdPreviewSurface"
                color3f inputs:diffuseColor.connect = </Root/Plane/Material/diffuseTexture.outputs:rgb>
                float inputs:opacity.connect = </Root/Plane/Material/diffuseTexture.outputs:a>
                float inputs:opacityThreshold = 0.5
                float inputs:metallic = 0
                float inputs:roughness = 1
                token outputs:surface
            }
            def Shader "stReader"
            {
                uniform token info:id = "UsdPrimvarReader_float2"
                token inputs:varname = "st"
                float2 outputs:result
            }
            def Shader "diffuseTexture"
            {
                uniform token info:id = "UsdUVTexture"
                asset inputs:file = @${filename}@
                token inputs:wrapS = "clamp"
                token inputs:wrapT = "clamp"
                float2 inputs:st.connect = </Root/Plane/Material/stReader.outputs:result>
                float3 outputs:rgb
            }
        }
    }
}
`;
}

function getAspectRatioFromBuffer(buffer: ArrayBuffer, isPng: boolean): number {
    const u8 = new Uint8Array(buffer);
    if (isPng) {
        const w = (u8[16] << 24) | (u8[17] << 16) | (u8[18] << 8) | u8[19];
        const h = (u8[20] << 24) | (u8[21] << 16) | (u8[22] << 8) | u8[23];
        if (w > 0 && h > 0) return w / h;
    } else {
        for (let i = 0; i < u8.length - 8; i++) {
            if (u8[i] === 0xFF && (u8[i + 1] === 0xC0 || u8[i + 1] === 0xC2)) {
                const h = (u8[i + 5] << 8) | u8[i + 6];
                const w = (u8[i + 7] << 8) | u8[i + 8];
                if (w > 0 && h > 0) return w / h;
            }
        }
    }
    return 1.0;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const imgUrl = searchParams.get('img');

    if (!imgUrl) {
        return NextResponse.json({ error: 'img param is required' }, { status: 400 });
    }

    try {
        const imgRes = await fetch(imgUrl);
        if (!imgRes.ok) throw new Error(`Görsel indirilemedi: ${imgRes.status}`);

        const imgBuffer = await imgRes.arrayBuffer();
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
        const isPng = contentType.includes('png');
        const ext = isPng ? 'png' : 'jpg';
        const imgFilename = `texture.${ext}`;

        const aspectRatio = getAspectRatioFromBuffer(imgBuffer, isPng);
        const usdaContent = buildUsda(imgFilename, aspectRatio);

        const zip = new JSZip();
        zip.file('scene.usda', usdaContent, { compression: 'STORE' });
        zip.file(imgFilename, imgBuffer, { compression: 'STORE' });

        const usdzBuffer = await zip.generateAsync({ type: 'arraybuffer' });

        return new Response(usdzBuffer, {
            headers: {
                'Content-Type': 'model/vnd.usdz+zip',
                'Content-Disposition': 'attachment; filename="ar-scene.usdz"',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (err: any) {
        console.error('USDZ error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// HEAD request for preflight check in ar.html
export async function HEAD() {
    return new Response(null, { status: 200 });
}
