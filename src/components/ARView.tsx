"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { X } from "lucide-react";

interface ARViewProps {
    imageUrl: string;
    onClose: () => void;
}

export default function ARView({ imageUrl, onClose }: ARViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        let scene: THREE.Scene;
        let camera: THREE.PerspectiveCamera;
        let renderer: THREE.WebGLRenderer;
        let reticle: THREE.Mesh;
        let hitTestSource: any = null;
        let hitTestSourceRequested = false;

        const init = async () => {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

            const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
            light.position.set(0.5, 1, 0.25);
            scene.add(light);

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.xr.enabled = true;
            containerRef.current?.appendChild(renderer.domElement);

            reticle = new THREE.Mesh(
                new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
                new THREE.MeshBasicMaterial({ color: 0x4f46e5 })
            );
            reticle.matrixAutoUpdate = false;
            reticle.visible = false;
            scene.add(reticle);

            const controller = renderer.xr.getController(0);
            controller.addEventListener("select", () => {
                if (reticle.visible) {
                    const textureLoader = new THREE.TextureLoader();
                    const texture = textureLoader.load(imageUrl);
                    const geometry = new THREE.PlaneGeometry(0.5, 0.7);
                    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
                    const mesh = new THREE.Mesh(geometry, material);
                    reticle.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
                    mesh.rotation.x = -Math.PI / 2;
                    scene.add(mesh);
                }
            });
            scene.add(controller);

            try {
                const sessionInit = { requiredFeatures: ["hit-test"], optionalFeatures: ["dom-overlay"], domOverlay: { root: containerRef.current } };
                const session = await (navigator as any).xr.requestSession("immersive-ar", sessionInit);
                renderer.xr.setSession(session);
            } catch (err) {
                setError("WebXR bu cihazda desteklenmiyor veya başlatılamadı.");
            }
        };

        function render(timestamp: number, frame: any) {
            if (frame) {
                const referenceSpace = renderer.xr.getReferenceSpace();
                const session = renderer.xr.getSession();

                if (!hitTestSourceRequested) {
                    const xrSession = session as any;
                    xrSession?.requestReferenceSpace("viewer").then((refSpace: any) => {
                        xrSession?.requestHitTestSource({ space: refSpace }).then((source: any) => {
                            hitTestSource = source;
                        });
                    });
                    xrSession?.addEventListener("end", () => {
                        hitTestSourceRequested = false;
                        hitTestSource = null;
                        onClose();
                    });
                    hitTestSourceRequested = true;
                }

                if (hitTestSource) {
                    const hitTestResults = frame.getHitTestResults(hitTestSource);
                    if (hitTestResults.length) {
                        const hit = hitTestResults[0];
                        reticle.visible = true;
                        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
                    } else {
                        reticle.visible = false;
                    }
                }
            }
            renderer.render(scene, camera);
        }

        init().then(() => {
            if (renderer) {
                renderer.setAnimationLoop(render);
            }
        });

        return () => {
            if (renderer) {
                renderer.setAnimationLoop(null);
                renderer.xr.getSession()?.end();
            }
        };
    }, [imageUrl, onClose]);

    return (
        <div ref={containerRef} className="fixed inset-0 z-[100] bg-black">
            {error && (
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center bg-white">
                    <div className="space-y-4">
                        <p className="text-red-500 font-medium">{error}</p>
                        <button onClick={onClose} className="primary-button">Geri Dön</button>
                    </div>
                </div>
            )}

            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-[110] pointer-events-none">
                <button
                    onClick={onClose}
                    className="p-3 glass-button rounded-full pointer-events-auto text-white bg-black/20"
                >
                    <X size={24} />
                </button>
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                    <span className="text-white text-sm font-medium">Yüzey Taranıyor...</span>
                </div>
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex justify-center z-[110] pointer-events-none">
                <p className="bg-white/90 text-black px-6 py-3 rounded-2xl text-sm font-medium shadow-xl">
                    Yüzeye dokunarak fotoğrafı yerleştir.
                </p>
            </div>
        </div>
    );
}
