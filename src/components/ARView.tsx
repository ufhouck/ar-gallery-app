"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, RefreshCw } from 'lucide-react';

interface ARViewProps {
    imageUrl: string;
    onClose: () => void;
}

const ARView: React.FC<ARViewProps> = ({ imageUrl, onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mindarThree: any = null;
        let renderer: THREE.WebGLRenderer | null = null;
        let scene: THREE.Scene | null = null;
        let camera: THREE.PerspectiveCamera | null = null;

        const startAR = async () => {
            try {
                // Dinamik import (SSR uyumluluğu için ve cache-busting ekliyoruz)
                const { MindARThree } = await import(`mind-ar/dist/mindar-image-three.prod.js?v=${Date.now()}` as any);

                mindarThree = new MindARThree({
                    container: containerRef.current!,
                    imageTargetSrc: 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/examples/image-tracking/assets/card-example/card.mind', // Varsayılan bir target gerekebilir, ancak biz markerless'a yakın bir yapı kurmaya çalışacağız
                });

                const { renderer: r, scene: s, camera: c } = mindarThree;
                renderer = r;
                scene = s;
                camera = c;

                const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
                scene.add(light);

                // Fotoğrafı yükle
                const textureLoader = new THREE.TextureLoader();
                textureLoader.load(imageUrl, (texture) => {
                    const aspectRatio = texture.image.width / texture.image.height; // Corrected aspect ratio calculation
                    const geometry = new THREE.PlaneGeometry(1, 1 / aspectRatio);
                    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
                    const plane = new THREE.Mesh(geometry, material);

                    // MindAR marker-based olduğu için bir anchor eklemeliyiz
                    const anchor = mindarThree.addAnchor(0);
                    anchor.group.add(plane);

                    setLoading(false);
                });

                await mindarThree.start();
                renderer.setAnimationLoop(() => {
                    renderer?.render(scene!, camera!);
                });
            } catch (err: any) {
                console.error("MindAR error:", err);
                setError("AR başlatılamadı. Lütfen kamera izinlerini kontrol edin.");
                setLoading(false);
            }
        };

        startAR();

        return () => {
            if (mindarThree) {
                mindarThree.stop();
            }
            if (renderer) {
                renderer.setAnimationLoop(null);
                renderer.dispose();
            }
        };
    }, [imageUrl]);

    return (
        <div className="fixed inset-0 z-[100] bg-black">
            <div ref={containerRef} className="w-full h-full" />

            <div className="absolute top-6 left-6 right-6 flex justify-between items-center pointer-events-none">
                <button
                    onClick={onClose}
                    className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white pointer-events-auto hover:bg-white/30 transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                    <RefreshCw className="text-white animate-spin mb-4" size={40} />
                    <p className="text-white font-medium">AR Deneyimi Hazırlanıyor...</p>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-8 text-center">
                    <p className="text-red-400 font-medium mb-6">{error}</p>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white/10 text-white rounded-2xl font-semibold backdrop-blur-md"
                    >
                        Geri Dön
                    </button>
                </div>
            )}

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[80%] max-w-xs pointer-events-none">
                <div className="bg-white/20 backdrop-blur-xl border border-white/30 p-4 rounded-3xl text-center shadow-2xl">
                    <p className="text-white text-sm font-medium">
                        Resmi görmek için kamerayı yüzeye tutun.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ARView;
