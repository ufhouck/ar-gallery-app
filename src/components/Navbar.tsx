"use client";

import Link from "next/link";
import { ImageIcon, Plus } from "lucide-react";

export function Navbar() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950 border-b border-white/[0.06]">
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <img
                        src="/monnom-logo.svg"
                        alt="Monnom"
                        className="h-5 w-auto"
                    />
                </Link>

                {/* Nav links */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
                    >
                        <Plus size={15} />
                        Görsel Ekle
                    </Link>
                    <Link
                        href="/gallery"
                        className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
                    >
                        <ImageIcon size={15} />
                        Galeri
                    </Link>
                </div>
            </div>
        </header>
    );
}
