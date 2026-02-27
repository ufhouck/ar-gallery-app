"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Plus, X, Check, Loader2, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import ARView from "@/components/ARView";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [showAR, setShowAR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setStatus("idle");
      setUploadedUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      // Doğrudan Vercel Blob'a client-side yükleme (4.5MB limitini aşar)
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/gallery',
        onUploadProgress: (progress) => {
          setUploadProgress(Math.round(progress.percentage));
        },
      });

      setUploadedUrl(blob.url);
      setStatus("success");
    } catch (err: any) {
      console.error('Upload error:', err);
      setStatus("error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pt-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg text-center space-y-8"
      >
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            AR Galerini Olanaklı Kıl
          </h1>
          <p className="text-lg text-gray-600">
            Fotoğrafını yükle ve gerçek dünyada duvarına as.
          </p>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          className={`relative aspect-square w-full glass-card rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${preview ? 'border-indigo-400' : 'hover:border-indigo-200 border-dashed border-2'
            }`}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <div className="p-4 bg-gray-50 rounded-full">
                <Upload size={32} />
              </div>
              <p className="text-sm font-medium">Fotoğraf seçmek için tıkla</p>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>

        <div className="flex gap-4">
          <AnimatePresence mode="wait">
            {uploadedUrl ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col w-full gap-4"
              >
                <button
                  onClick={() => setShowAR(true)}
                  className="primary-button flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 shadow-green-100"
                >
                  <Camera size={20} />
                  Hemen AR'da Gör
                </button>
                <button
                  onClick={() => router.push("/gallery")}
                  className="glass-button py-3 rounded-2xl text-sm font-medium text-gray-600"
                >
                  Galeriye Git
                </button>
              </motion.div>
            ) : file && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                disabled={uploading}
                onClick={handleUpload}
                className="flex-1 primary-button flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <><Loader2 size={20} className="animate-spin" /> Yükleniyor... {uploadProgress > 0 ? `${uploadProgress}%` : ''}</>
                ) : (
                  <><Plus size={20} /> Galeriye Ekle</>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          {file && !uploadedUrl && (
            <button
              onClick={() => { setFile(null); setPreview(null); setStatus("idle"); setUploadedUrl(null); }}
              className="p-4 glass-button rounded-2xl text-gray-500"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {showAR && uploadedUrl && (
          <ARView imageUrl={uploadedUrl} onClose={() => setShowAR(false)} />
        )}
      </motion.div>
    </div>
  );
}
