# Kurasi Referensi Desain UI/UX (Anti-AI-Slop) untuk Detso Mobile

**Tanggal:** 2026-10-19
**Ruang Lingkup:** Login Screen, Dashboard Owner ISP, & Dashboard Teknisi Lapangan
**Sumber Riset:** Mobbin (Studi 2.108 Dashboard), Dribbble Field Service Shots, Behance Network Monitoring, & UI/UX Pro Max Skill

---

## 1. Mengapa UI Terlihat seperti "AI Slop" (dan Mengapa Tadi Terlihat Rusak)

Ketika AI men-generate atau merombak UI tanpa referensi produk nyata, ada **6 ciri khas AI Slop** yang langsung terlihat murahan:

1. **Box-Inside-Box Syndrome (Kotak di dalam Kotak)**:
   - Setiap elemen dibungkus `border`, `rounded-xl`, dan `bg-card` lagi di dalam card lain. Hasilnya layar penuh garis kotak-kotak kaku seperti wireframe.
2. **4-Card Generic Metric Grid**:
   - 4 kotak identik (2x2) dengan bulatan ikon warna-warni transparan (`color + 20% opacity`) di pojok kiri atas, angka di tengah, label di bawah. Semua kartu punya bobot visual yang sama—tidak ada fokus mana yang kritis.
3. **Segmented Pill / Toggle Berlebihan di Header**:
   - Menaruh switcher bahasa + switcher tema (System/Light/Dark) berjejer di atas halaman Login, sehingga tampak seperti halaman pengaturan debug, bukan halaman masuk produk profesional.
4. **Menghancurkan Karakter Visual Asli (Over-Flattening)**:
   - Mengubah semua tombol `rounded-full` menjadi `rounded-lg` kaku dan menghapus kontras hero pada halaman Login tanpa menggantinya dengan tipografi atau komposisi ruang yang kuat.
5. **Menyentuh Global CSS Variables Tanpa Sinkronisasi Komponen**:
   - Mengubah `@media (prefers-color-scheme: dark)` ke `.dark:root` di `global.css` di NativeWind v4 menyebabkan variabel CSS gagal ter-resolve di sebagian komponen native, sehingga warna background/border menjadi kacau.
6. **Emoji & Decorative Badge**:
   - Memakai emoji atau teks status kapital semua (`OPEN`, `URGENT`) dengan border tebal di setiap baris list.

---

## 2. Referensi Produk Nyata (Gold Standard untuk ISP & Field Service)

Dari kurasi **Mobbin** (*Study of 2,108 Dashboards across 536 apps*), **Dribbble**, dan **Behance**, aplikasi jaringan & teknisi kelas dunia mengikuti 3 kiblat utama:

### A. Referensi Login Mobile: **Linear Mobile, Tailscale, & Cloudflare One**
- **Pola Visual**:
  - **Bukan form kaku di tengah layar kosong**, melainkan menggunakan **Top Brand Anchor** (logo bersih + tipografi judul tegas rata kiri atau tengah dengan ruang bernapas lega di atas).
  - **Bottom-Anchored / Sheet-Style Form** atau **Clean Surface Form**: Input memiliki background halus (`bg-muted/50` atau `bg-card` dengan border sangat tipis `1px`), tinggi nyaman (`52–56px`), radius modern (`12–14px`), bukan kotak tajam dan bukan kapsul raksasa.
  - **Zero Clutter di Atas**: Tidak ada toggle tema 3-tombol di halaman login. Hanya 1 pill bahasa kecil (`ID / EN`) di pojok kanan atas.
  - **Satu Primary CTA Kuat**: Tombol utama solid dengan kontras penuh, tanpa teks link mati ("Lupa Password" / "Daftar" yang tidak ada rutenya).

### B. Referensi Dashboard Owner ISP: **Ubiquiti UniFi Mobile, Stripe Dashboard, & Plausible**
- **Temuan Riset Mobbin (Revolut & Plausible Pattern)**:
  - *"Most dashboards show you the data. The best ones protect you from it."*
  - Daripada menampilkan 4 kotak metrik yang ukurannya sama persis, aplikasi terbaik menggunakan **1 Hero Summary Strip / Primary Verdict Card** (misal: **Layanan Aktif vs Tiket Gangguan Terbuka** sebagai fokus utama), diikuti metrik sekunder yang lebih ringkas.
- **Grouped List (iOS Inset Grouped Style)**:
  - Tiket terbaru dan pelanggan terbaru **tidak** dibuat menjadi kartu-kartu terpisah yang masing-masing punya shadow dan border sendiri, melainkan **1 kontainer grup bersih** dengan *hairline divider* (`border-b border-border/60`) antar item. Jauh lebih rapi dan tidak berisik.
- **Quick Actions (3–4 Pill/Icon Bersih)**:
  - Bukan 6 kotak besar di dalam kotak `Card`, melainkan baris ikon melingkar/squircle langsung di atas canvas atau 4 aksi utama yang paling sering dipakai di HP.

### C. Referensi Dashboard Teknisi: **Field Service Mobile App (Hafiz Ibrahim / Dribbble #26378456) & ServiceTitan**
- **Temuan Visual dari Shot Dribbble #26378456**:
  - **Horizontal Day Strip + Fokus "Hari Ini"**: Teknisi di lapangan tidak butuh melihat statistik bulanan yang rumit. Mereka butuh: *"Apa jadwal pengerjaan saya jam 09:30 ini, di mana lokasinya, dan tiket mana yang LOS merah?"*
  - **Active Job Highlight**: Tugas yang sedang berlangsung (*On going / In Progress*) diberi aksen background lembut hangat (warm amber/teal tint) dengan tombol aksi langsung (**Mulai / Selesaikan / Petunjuk Arah**), sedangkan tugas berikutnya tampil di kartu putih bersih.
  - **Status Pill Minimalis**: Menggunakan *dot indicator* kecil (`● Aktif`, `● Gangguan LOS`) di dalam pill lembut tanpa outline ganda.

---

## 3. Prinsip Desain "Non-AI-Slop" untuk Diterapkan di Detso Mobile

| Area | Gaya "AI Slop" (Hindari) | Gaya Produk Nyata (Dribbble / Mobbin) |
|---|---|---|
| **Hierarki Metrik** | 4 kotak ukuran sama, semua pakai ikon bulat warna-warni | **1 Fokus Utama (Hero Stat)** + 2–3 stat sekunder ringkas dalam 1 baris atau 2 kolom asimetris |
| **Container & Border** | Card di dalam Card, border tebal di semua sisi | **Surface Grouping**: Background halaman `#F4F6F8` (Light) / `#0B0F17` (Dark), grup konten di atas kartu putih `#FFFFFF` / `#151C28` tanpa border ganda |
| **List Item (Tiket/Pelanggan)** | Setiap baris dibungkus kotak ber-border + margin bawah | **Inset Grouped List**: Satu kartu membungkus 3–5 baris, dipisah garis tipis `1px` (`divide-y`) |
| **Radius Sudut** | Kaku `6-8px` di semua tempat atau `999px` di semua tempat | **Konsisten & Proporsional**: Card grup `16px`, Input & Tombol `12px`, Badge status `6–8px` |
| **Tipografi Angka** | Semua teks ukuran mirip (`14px`–`16px`) | **Kontras Skala Ekstrem**: Angka metrik `28–32px` bold tabular, label kategori `11–12px` uppercase tracking lebar atau muted medium |
| **Halaman Login** | Banyak tombol utilitas (Theme + Lang + Forgot + Register) | **Fokus Autentikasi**: Brand header berkarakter, 2 input bersih dengan label, 1 tombol Masuk, 1 link bantuan Admin |
