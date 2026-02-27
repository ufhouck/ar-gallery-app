"use client";

import Link from "next/link";
import { ImageIcon } from "lucide-react";

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

                {/* Nav link */}
                <Link
                    href="/gallery"
                    className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
                >
                    <ImageIcon size={15} />
                    Galeri
                </Link>
            </div>
        </header>
    );
}
