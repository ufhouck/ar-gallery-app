"use client";

import Link from "next/link";
import { Camera, Image as ImageIcon, Plus } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
            <nav className="glass-card flex items-center gap-2 px-6 py-3 rounded-full">
                <Link href="/">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-black/5 transition-colors"
                    >
                        <Camera size={18} className="text-indigo-600" />
                        <span className="font-medium text-sm">Vizyon AR</span>
                    </motion.div>
                </Link>

                <div className="w-px h-4 bg-gray-200 mx-2" />

                <Link href="/gallery">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-black/5 transition-colors"
                    >
                        <ImageIcon size={18} className="text-gray-600" />
                        <span className="font-medium text-sm">Galeri</span>
                    </motion.div>
                </Link>
            </nav>
        </header>
    );
}
