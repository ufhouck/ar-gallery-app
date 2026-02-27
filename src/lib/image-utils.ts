import { removeBackground as removeBg } from '@imgly/background-removal';

/**
 * Checks if an image has a transparent background.
 * It draws the image on a canvas and checks the alpha channel of pixels.
 * If it finds a sufficient number of clearly transparent pixels, it considers it transparent.
 */
export async function isTransparent(file: File): Promise<boolean> {
    if (file.type === 'image/jpeg') {
        return false; // JPEGs don't support transparency
    }

    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (!ctx) {
                resolve(false); // Fallback to processing if canvas fails
                return;
            }

            // Check a smaller version of the image for performance
            const MAX_SIZE = 500;
            let width = img.width;
            let height = img.height;

            if (width > MAX_SIZE || height > MAX_SIZE) {
                const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;

            // Fill with a specific color to ensure we detect true transparency
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.fillRect(0, 0, width, height);

            // Clear a small rectangle in the corner as a control test (optional, but good for debugging)
            // ctx.clearRect(0,0, 10, 10);

            // Draw the image. Transparent parts will not overwrite our fill.
            // Wait, a better way is to draw image directly, then check alpha.
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            let transparentPixelCount = 0;
            // Step by 4 (RGBA) and sample every Nth pixel for speed
            const step = 4 * 10;

            for (let i = 3; i < data.length; i += step) {
                // Alpha channel is the 4th value (index 3, 7, 11...)
                if (data[i] < 250) { // < 255 means some level of transparency
                    transparentPixelCount++;
                    // If we find enough transparent pixels, we can confidently say it has a transparent bg
                    // We don't need the whole image, just a small percentage (e.g., edges often have transparency)
                    if (transparentPixelCount > 50) {
                        resolve(true);
                        return;
                    }
                }
            }

            resolve(false);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(false); // Fallback
        };

        img.src = url;
    });
}

export type ProgressCallback = (message: string) => void;

/**
 * Removes the background from the image using @imgly/background-removal.
 * Returns the processed Blob.
 */
export async function removeBackground(file: File, onProgress?: ProgressCallback): Promise<Blob> {
    try {
        if (onProgress) {
            onProgress("Model yükleniyor/hazırlanıyor...");
        }

        // We pass the config to ensure models are fetched correctly, 
        // though the defaults usually work well in Next.js public directory context.
        const imageBlob = await removeBg(file, {
            progress: (key, current, total) => {
                if (onProgress && total > 0) {
                    const percent = Math.round((current / total) * 100);
                    onProgress(`Model yükleniyor: ${percent}%`);
                }
            },
            // In some setups you might need to host the models yourself in public/
            // publicPath: '/models/'
        });

        return imageBlob;
    } catch (error) {
        console.error("Background removal error:", error);
        throw new Error("Arkaplan temizleme başarısız oldu.");
    }
}
