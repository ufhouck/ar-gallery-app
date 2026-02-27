# AR Gallery App - Development & Architecture Guide

Bu doküman projenin mevcut (Şubat 2026) mimarisini, kullanılan teknolojileri ve temel akışları özetler.

## 🛠 Kullanılan Teknolojiler

- **Framework:** Next.js 16 (App Router)
- **Dil:** TypeScript
- **Stil & UI:** Tailwind CSS v4, Framer Motion, Lucide React (ikonlar)
- **Veritabanı:** Upstash Redis (Serverless KV)
- **Depolama:** Vercel Blob (Image hosting)
- **AR Teknolojileri:**
  - **Apple iOS:** Apple AR QuickLook (`.usdz` on-the-fly generation)
  - **Android/Masaüstü:** HTML5 Camera API üzerinden Custom Camera Overlay

## 📂 Proje Yapısı

\`\`\`text
ar-gallery-app/
├── public/
│   ├── ar.html           # (Fallback) Android/Masaüstü için kamera overlay AR sayfası
│   └── monnom-logo.svg   # Uygulamanın ana logosu
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── gallery/route.ts  # Redis metadata ve Vercel Blob client-side token auth
│   │   │   └── usdz/route.ts     # (iOS) Yüklenen görselden anında .usdz oluşturan servis
│   │   ├── gallery/page.tsx      # Galeri görünümü (Grid, Lazy loading, düzenleme/silme)
│   │   ├── layout.tsx            # Ana layout (Navbar içerir)
│   │   ├── page.tsx              # Anasayfa (Görsel yükleme bileşeni)
│   │   └── globals.css           # Global Tailwind stilleri ve glassmorphism class'ları
│   ├── components/
│   │   ├── ARView.tsx            # Cihaz tespiti yapıp ar.html veya QuickLook'a yönlendiren bileşen
│   │   └── Navbar.tsx            # Üst navigasyon çubuğu
\`\`\`

## 🚀 Temel Fonksiyonlar & Akışlar

### 1. Görsel Yükleme (Upload Flow)

- Kullanıcı anasayfadan (\`page.tsx\`) resim seçer.
- **YENİ:** Yükleme öncesi tarayıcıda küçük bir `<canvas>` yardımıyla **Transparanlık (Alpha) Kontrolü** yapılır.
- **YENİ:** Eğer görselin arkaplanı transparan değilse (JPEG veya arkaplanı olan PNG ise), Vercel serverless payload limitlerine (4.5MB) takılmamak için **`@imgly/background-removal`** kütüphanesi ile tamamen *Client-Side (tarayıcı içi) ML* kullanılarak arkaplan temizlenir ve transparan bir PNG'ye çevrilir.
- Gerekirse işlenmiş olan (veya zaten transparan) dosya, **client-side upload** yöntemiyle doğrudan tarayıcıdan Vercel Blob'a yüklenir (\`@vercel/blob/client\`).
- Yükleme tamamlanınca dönen URL ve benzersiz ID (UUID), `/api/gallery` endpoint'i üzerinden **Upstash Redis**'e kaydedilir.

### 2. Galeri Görünümü

- `/gallery` sayfasında Redis'ten çekilen veriler listelenir (Tarihe göre yeniden eskiye).
- Performans için **Blur Placeholder** (önce 30px kalitesiz versiyon, sonra 600px ana görsel) ve **Lazy Loading** (`loading="lazy"`) kullanılır.
- Kartlardaki görsellerin URL'leri Vercel Blob'un `?w=` parametresi ile boyutlandırılarak çekilir.

### 3. AR Deneyimi (Çift Yönlü Çözüm)

WebXR'ın iOS Safari'de desteklenmemesi ve MindAR'ın dinamik görseller için önceden derlenmiş target dosyalarına (`.mind`) ihtiyaç duyması nedeniyle mimari ikiye ayrılmıştır:

#### a) iOS Safari Cihazları (Apple QuickLook)

- Cihaz iOS ise, `/api/usdz` endpoint'i çağrılır.
- Bu endpoint sunucu tarafında (\`jszip\` kullanarak) anlık olarak 1x1 metre boyutunda bir 3D düzlem oluşturur (`scene.usda`) ve kullanıcının görselini bu düzleme doku (texture) olarak kaplayıp bir `.usdz` dosyası döndürür.
- **YENİ:** Transparan görsellerin AR'da doğru yorumlanabilmesi ve siyah/yeşil arka plan hatalarını önlemek için USD materyalinde izlenen yol:
  - `UsdUVTexture` Shader'ında `float outputs:a` (Alpha) kanalı açıkça belirtilir.
  - Bu kanal `UsdPreviewSurface` materyalinin `inputs:opacity` değerine bağlanır.
  - Renklerin soluk çıkmaması için görselin renk uzayı `token inputs:sourceColorSpace = "sRGB"` olarak kodlanır.
- Kullanıcıya çıkan **🍎 Apple AR QuickLook** panelinden butona basıldığında iOS'un native kamerası açılır ve görsel gerçek dünyaya/yüzeye oturtulur.

#### b) Android ve Masaüstü Cihazları (Camera Overlay)

- `public/ar.html` sayfası açılır.
- Cihazın arka kamerası tam ekran başlatılır (`navigator.mediaDevices.getUserMedia`).
- Kullanıcı görseli kameranın üzerine bir UI elementi olarak bindirilir.
- Kullanıcı ekrandaki görseli parmağıyla taşıyabilir (drag) veya iki parmağıyla (pinch-to-zoom) boyutunu ayarlayabilir.

## 💾 Veritabanı Modeli (Upstash Redis)

Veriler \`gallery\` adlı bir Hash (HSET) yapısında tutulur.
\`\`\`typescript
{
  "id": "uuid-v4",
  "url": "https://...vercel-storage.com/...jpg",
  "name": "gorsel-adi",
  "createdAt": "2026-02-27T10:00:00.000Z"
}
\`\`\`

## 🔧 İleride Yapılabilecek Geliştirmeler

- **Android WebXR Desteği:** Android cihazlar için hit-test (gerçek yüzey algılama) destekli bir WebXR sahnesi (Three.js/A-Frame) yeniden eklenebilir. Mevcut overlay AR pratik olsa da ortamı algılamaz.
- **Kategori/Etiketleme:** Redis'teki metadata genişletilerek görsellere etiket (tag) veya açıklamalar eklenebilir.
- **Toplu Yükleme (Bulk Upload):** Anasayfadaki input `multiple` yapılarak birden fazla görselin aynı anda Vercel Blob'a gönderilmesi sağlanabilir.
