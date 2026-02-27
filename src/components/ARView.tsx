"use client";

import React, { useEffect, useRef, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface ARViewProps {
    imageUrl: string;
    onClose: () => void;
}

const ARView: React.FC<ARViewProps> = ({ imageUrl, onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusText, setStatusText] = useState('AR Deneyimi Hazırlanıyor...');

    useEffect(() => {
        let mindarThree: any = null;
        let stopped = false;

        const MINDAR_CDN = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-three.prod.js';
        const TARGET_SRC = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/examples/image-tracking/assets/card-example/card.mind';

        const loadScript = (src: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Script yüklenemedi: ${src}`));
                document.head.appendChild(script);
            });
        };

        const startAR = async () => {
            try {
                setStatusText('MindAR kütüphanesi yükleniyor...');
                await loadScript(MINDAR_CDN);

                const MINDAR = (window as any).MINDAR;
                if (!MINDAR) throw new Error('MindAR yüklenemedi');

                const { MindARThree } = MINDAR.IMAGE;

                setStatusText('AR Sahnesi oluşturuluyor...');
                const THREE = await import('three');

                mindarThree = new MindARThree({
                    container: containerRef.current!,
                    imageTargetSrc: TARGET_SRC,
                });

                const { renderer, scene, camera } = mindarThree;

                const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
                scene.add(light);

                const textureLoader = new THREE.TextureLoader();
                textureLoader.load(
                    imageUrl,
                    (texture: any) => {
                        if (stopped) return;
                        const ar = texture.image.width / texture.image.height;
                        const geometry = new THREE.PlaneGeometry(1, 1 / ar);
                        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
                        const plane = new THREE.Mesh(geometry, material);
                        const anchor = mindarThree.addAnchor(0);
                        anchor.group.add(plane);
                    },
                    undefined,
                    (err: any) => console.error('Texture yüklenemedi:', err)
                );

                setStatusText('Kamera açılıyor...');
                await mindarThree.start();
                setLoading(false);

                renderer.setAnimationLoop(() => {
                    renderer.render(scene, camera);
                });
            } catch (err: any) {
                console.error('MindAR error:', err);
                setError('AR başlatılamadı: ' + (err.message || 'Bilinmeyen hata'));
                setLoading(false);
            }
        };

        startAR();

        return () => {
            stopped = true;
            try {
                mindarThree?.stop();
            } catch { }
        };
    }, [imageUrl]);

    return (
        <div className="fixed inset-0 z-[100] bg-black">
            <div ref={containerRef} className="w-full h-full" />

            <div className="absolute top-6 left-6 pointer-events-none">
                <button
                    onClick={onClose}
                    className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white pointer-events-auto hover:bg-white/30 transition-colors"
                    aria-label="Kapat"
                >
                    <X size={24} />
                </button>
            </div>

            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                    <RefreshCw className="text-white animate-spin mb-4" size={40} />
                    <p className="text-white font-medium text-center px-8">{statusText}</p>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-8 text-center">
                    <p className="text-red-400 font-medium mb-6">{error}</p>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white/10 text-white rounded-2xl font-semibold"
                        aria-label="Geri Dön"
                    >
                        Geri Dön
                    </button>
                </div>
            )}

            {!loading && !error && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[80%] max-w-xs pointer-events-none">
                    <div className="bg-white/20 backdrop-blur-xl border border-white/30 p-4 rounded-3xl text-center shadow-2xl">
                        <p className="text-white text-sm font-medium">
                            Kartı kameraya tutun — görsel üzerinde belirecek.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ARView;
