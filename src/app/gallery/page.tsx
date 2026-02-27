"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Edit2, Calendar, LayoutGrid, Loader2, Camera, Check, X } from "lucide-react";
import ARView from "@/components/ARView";

interface GalleryItem {
    id: string;
    url: string;
    name: string;
    createdAt: string;
}

export default function Gallery() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeAR, setActiveAR] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        fetchGallery();
    }, []);

    const fetchGallery = async () => {
        try {
            const res = await fetch("/api/gallery");
            const data = await res.json();
            setItems(data);
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
            setItems(items.filter(item => item.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const startEdit = (item: GalleryItem) => {
        setEditingId(item.id);
        setNewName(item.name);
    };

    const saveEdit = async (id: string) => {
        try {
            await fetch(`/api/gallery?id=${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName }),
            });
            setItems(items.map(item => item.id === id ? { ...item, name: newName } : item));
            setEditingId(null);
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
        <div className="py-8 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">Yapılan İşler</h1>
                    <p className="text-gray-500">Geçmişte hazırladığın tüm AR sergileri burada.</p>
                </div>
                <div className="p-1 glass-card rounded-xl flex">
                    <button className="px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-medium text-indigo-600 flex items-center gap-2">
                        <LayoutGrid size={16} /> Izgara
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative flex flex-col glass-card rounded-[2rem] overflow-hidden"
                        >
                            <div className="aspect-[4/5] relative overflow-hidden">
                                <img
                                    src={item.url}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => setActiveAR(item.url)}
                                        className="p-4 bg-white rounded-full text-indigo-600 shadow-xl active:scale-90 transition-all"
                                    >
                                        <Camera size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        {editingId === item.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    className="text-lg font-semibold bg-gray-50 px-2 py-1 rounded-md outline-indigo-500 w-full"
                                                    autoFocus
                                                />
                                                <button onClick={() => saveEdit(item.id)} className="text-green-600 p-1">
                                                    <Check size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                                        )}
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <Calendar size={12} />
                                            {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => editingId === item.id ? setEditingId(null) : startEdit(item)}
                                        className="flex-1 glass-button py-2 rounded-xl text-xs font-medium text-gray-600 flex items-center justify-center gap-2"
                                    >
                                        {editingId === item.id ? <X size={14} /> : <Edit2 size={14} />}
                                        {editingId === item.id ? "İptal" : "Düzenle"}
                                    </button>
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="p-2 border border-red-50/50 hover:bg-red-50 text-red-400 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {items.length === 0 && (
                <div className="text-center py-20 glass-card rounded-[3rem] space-y-4">
                    <div className="inline-block p-6 bg-indigo-50 rounded-full text-indigo-600">
                        <LayoutGrid size={40} />
                    </div>
                    <h2 className="text-2xl font-semibold">Henüz iş yok</h2>
                    <p className="text-gray-500">Ana sayfaya dönüp ilk fotoğrafını yükle!</p>
                </div>
            )}

            {activeAR && (
                <ARView imageUrl={activeAR} onClose={() => setActiveAR(null)} />
            )}
        </div>
    );
}
