"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Edit2, Calendar, Loader2, Camera, Check, X, LayoutGrid } from "lucide-react";
import ARView from "@/components/ARView";

interface GalleryItem {
    id: string;
    url: string;
    name: string;
    createdAt: string;
}

// Vercel Blob URL'sine w parametresi ekleyerek küçük thumbnail oluşturur
function thumbnailUrl(url: string, width = 400): string {
    try {
        const u = new URL(url);
        // Vercel Blob, ?width= parametresini destekler
        u.searchParams.set('w', String(width));
        return u.toString();
    } catch {
        return url;
    }
}

function GalleryCard({ item, onAR, onDelete, onSave }: {
    item: GalleryItem;
    onAR: (url: string) => void;
    onDelete: (id: string) => void;
    onSave: (id: string, name: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [newName, setNewName] = useState(item.name);
    const [imgLoaded, setImgLoaded] = useState(false);

    return (
        <div className="group relative flex flex-col glass-card rounded-3xl overflow-hidden">
            {/* Görsel */}
            <div
                className="relative aspect-[4/5] overflow-hidden bg-gray-100 cursor-pointer"
                onClick={() => onAR(item.url)}
            >
                {/* Blur Placeholder — küçük thumbnail hemen yüklenir */}
                <img
                    src={thumbnailUrl(item.url, 30)}
                    alt=""
                    aria-hidden="true"
                    className={`absolute inset-0 w-full h-full object-cover scale-110 blur-lg transition-opacity duration-300 ${imgLoaded ? 'opacity-0' : 'opacity-100'}`}
                />
                {/* Ana görsel — lazy loading */}
                <img
                    src={thumbnailUrl(item.url, 600)}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setImgLoaded(true)}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* Hover overlay (desktop için) */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                    <div className="p-3 bg-white/90 backdrop-blur-sm rounded-full text-indigo-600 shadow-xl scale-0 group-hover:scale-100 transition-transform duration-200">
                        <Camera size={20} />
                    </div>
                </div>

                {/* Tarih badge */}
                <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Calendar size={9} />
                    {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                </div>
            </div>

            {/* Başlık + Aksiyonlar */}
            <div className="px-3 py-3 space-y-2">
                {editing ? (
                    <div className="flex items-center gap-1.5">
                        <input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="flex-1 text-sm font-semibold bg-gray-50 px-2 py-1 rounded-md outline-indigo-500 min-w-0"
                            autoFocus
                            onKeyDown={e => {
                                if (e.key === 'Enter') { onSave(item.id, newName); setEditing(false); }
                                if (e.key === 'Escape') setEditing(false);
                            }}
                        />
                        <button onClick={() => { onSave(item.id, newName); setEditing(false); }} className="text-green-600 p-1 shrink-0">
                            <Check size={15} />
                        </button>
                        <button onClick={() => setEditing(false)} className="text-gray-400 p-1 shrink-0">
                            <X size={15} />
                        </button>
                    </div>
                ) : (
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                )}

                <div className="flex gap-1.5">
                    <button
                        onClick={() => { setEditing(true); setNewName(item.name); }}
                        className="flex-1 glass-button py-1.5 rounded-xl text-xs font-medium text-gray-600 flex items-center justify-center gap-1"
                        aria-label="Düzenle"
                    >
                        <Edit2 size={12} /> Düzenle
                    </button>
                    <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 border border-red-50/50 hover:bg-red-50 text-red-400 rounded-xl transition-colors"
                        aria-label="Sil"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Gallery() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeAR, setActiveAR] = useState<string | null>(null);

    useEffect(() => {
        fetchGallery();
    }, []);

    const fetchGallery = async () => {
        try {
            const res = await fetch("/api/gallery");
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (id: string) => {
        if (!confirm("Bu fotoğrafı silmek istediğine emin misin?")) return;
        try {
            await fetch(`/api/gallery?id=${id}`, { method: "DELETE" });
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const saveEdit = async (id: string, name: string) => {
        try {
            await fetch(`/api/gallery?id=${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            setItems(prev => prev.map(item => item.id === id ? { ...item, name } : item));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Galeri</h1>
                    <p className="text-sm text-gray-400 mt-0.5">{items.length} fotoğraf</p>
                </div>
                <div className="p-2 glass-card rounded-xl">
                    <LayoutGrid size={18} className="text-indigo-600" />
                </div>
            </div>

            {/* Grid — mobilde 2 kolon, tablette 3, masaüstünde 4 */}
            {items.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    <AnimatePresence>
                        {items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: Math.min(index * 0.06, 0.4) }}
                            >
                                <GalleryCard
                                    item={item}
                                    onAR={setActiveAR}
                                    onDelete={deleteItem}
                                    onSave={saveEdit}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="text-center py-20 glass-card rounded-[3rem] space-y-4">
                    <div className="inline-block p-6 bg-indigo-50 rounded-full text-indigo-600">
                        <LayoutGrid size={40} />
                    </div>
                    <h2 className="text-2xl font-semibold">Henüz fotoğraf yok</h2>
                    <p className="text-gray-500">Ana sayfaya dönüp ilk fotoğrafını yükle!</p>
                </div>
            )}

            {activeAR && (
                <ARView imageUrl={activeAR} onClose={() => setActiveAR(null)} />
            )}
        </div>
    );
}
