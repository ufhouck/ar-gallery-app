"use client";

import { useEffect } from 'react';

interface ARViewProps {
    imageUrl: string;
    onClose: () => void;
}

// AR deneyimi public/ar.html üzerinden açılır.
// Bu component sadece geçiş için kullanılır.
const ARView: React.FC<ARViewProps> = ({ imageUrl, onClose }) => {
    useEffect(() => {
        const url = `/ar.html?img=${encodeURIComponent(imageUrl)}`;
        window.open(url, '_blank');
        // Hemen kapat, kullanıcı yeni sekmeye geçecek
        onClose();
    }, [imageUrl, onClose]);

    return null;
};

export default ARView;
