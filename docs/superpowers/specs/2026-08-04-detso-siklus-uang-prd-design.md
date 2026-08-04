# PRD & Design — Detso: Roadmap "Kejar Siklus Uang"

| | |
|---|---|
| Status | Draft untuk review |
| Tanggal | 2026-08-04 |
| Penulis | Luminova + Claude (analisa multi-agent atas seluruh codebase) |
| Keputusan kunci | Arah: Opsi A "Kejar Siklus Uang" · Siklus tagih: dua mode, configurable per tenant · Gateway: Tripay · WA: WAHA self-hosted di balik abstraksi provider |

---

## 1. Ringkasan eksekutif

Detso hari ini adalah CRM + ticketing + monitoring untuk ISP, dengan fondasi auth yang kuat dan mobile app teknisi yang matang. Yang belum disentuh justru alasan ISP membayar software: siklus uang. Harga paket sudah tersimpan di `service_connection` tapi tidak pernah ditagihkan. Status `SUSPENDED` ada di schema tapi tidak ada satu pun mekanisme yang menggerakkannya. Detso sendiri tidak bisa menagih tenant; semua tenant gratis tanpa batas.

Roadmap ini membalik keadaan itu dalam empat fase (±4,5–6 bulan, developer solo):

1. **Stop-the-bleed** (2–4 minggu): tutup lubang keamanan yang aktif sekarang, amankan data & secrets, pasang gerbang kualitas pertama.
2. **Billing engine + notifikasi WA** (6–8 minggu): tagihan bulanan otomatis, pembayaran manual, reminder WA. Keluar fase ini lewat gerbang: 1 ISP pilot menjalankan 1 siklus tagihan penuh dengan hasil cocok 100%.
3. **Uang masuk otomatis** (6–8 minggu): Tripay (VA + QRIS + retail outlet), provisioning PPPoE via Mikrotik API, isolir otomatis + restore otomatis.
4. **Monetisasi Detso** (4–6 minggu): plan & subscription tenant dengan enforcement kuota, tagihan Detso→tenant memakai billing engine yang sama.

Konteks penting: belum ada ISP yang memakai Detso harian. Karena itu pilot di Fase 2 bukan pelengkap melainkan gerbang. Jika setelah 8 minggu pencarian tidak ada pilot, arah roadmap direview ulang (fallback ke pola konsolidasi design-partner).

## 2. Kondisi saat ini (hasil analisa kode, 2026-08-04)

Analisa dilakukan 7 agent atas kode sungguhan (bukan dokumentasi): backend, schema DB, frontend web, mobile, kualitas/ops, dan dokumen produk.

### 2.1 Kematangan modul

| Modul | Status | Catatan |
|---|---|---|
| Auth & tenant | hampir siap | Refresh token rotation + reuse detection benar; lubang fatal di pinggirnya (lihat 2.2) |
| Customer & dokumen | setengah jadi | Wizard 5 langkah jalan; rantai dokumen rusak (path DB ≠ disk, signed URL mati) sekaligus bocor (folder private publik) |
| Paket & service connection | hampir siap | Solid; nol unique constraint per tenant untuk `id_pel`/NIK |
| Ticketing | hampir siap | Workflow + history konsisten; teknisi bisa akses tiket yang bukan assignment-nya |
| Jadwal kerja | setengah jadi | Sinkron tiket↔jadwal jalan; `PUT /schedule/:id` tanpa cek role |
| Network map & ODP | setengah jadi | Waypoint editor mobile bagus; web nol UI; model topologi dangkal untuk FTTH |
| Monitoring Mikrotik | setengah jadi | Polling 15 detik nyata; PPPoE sessions/temperature/bps masih dummy |
| Dashboard web | baru mulai | Halaman pasca-login masih stub; endpoint backend-nya sudah ada |
| Testing & ops | baru mulai | Nol test, nol CI, nol backup, deploy `db push --accept-data-loss` |

### 2.2 Temuan kritis (wajib Fase 1)

1. `backend/src/app.ts:42` menyajikan seluruh `/storage` via `express.static` tanpa auth, termasuk `storage/private/customer/documents` berisi scan KTP. Nama file berbasis timestamp mudah dienumerasi. Eksposur langsung UU PDP.
2. `GET /api/user/:id` terdaftar tanpa `authMiddleware` (`backend/src/controller/user/index.ts:10`); data user bocor lintas tenant.
3. Kredensial produksi ter-commit: `postgres.env` (password DB), `frontend/.env.production` (`JWT_SECRET_TOKEN`), `detso-mobile/.env.development` (Mapbox secret `sk.*`), dan `backend/.env` pernah ter-commit penuh tanpa purge history.
4. `backend/src/utils/encryption.ts:14` fallback ke kunci hardcoded bila `MIKROTIK_ENCRYPTION_KEY` kosong, dan variabel itu tidak ada di env mana pun. Satu dump DB berarti password RouterOS semua tenant terbuka.
5. `backend/Dockerfile:36` menjalankan `prisma db push --accept-data-loss` setiap start container; tidak ada backup DB dalam bentuk apa pun.
6. Endpoint seed Super Admin lolos bila `ADMIN_SETUP_TOKEN` tidak diset (`backend/src/controller/auth/seed.auth.ts:19`). Socket.IO menerima `join-tenant` tanpa verifikasi token (`backend/index.ts:27`).
7. Bug fungsional: signed URL mati total karena membaca `JWT_SECRET` alih-alih `JWT_SECRET_TOKEN` (`backend/src/utils/signed-url.ts:40`); path dokumen di DB (`storage/public/...`) tidak cocok dengan lokasi fisik (`storage/private/...`); role `'TEKNISI'` vs `'TENANT_TEKNISI'` mematahkan menu web; login tidak memeriksa `is_active` tenant.

## 3. Masalah yang diselesaikan

Owner ISP kecil (100–2.000 pelanggan) menjalankan siklus uang secara manual: rekap tagihan di Excel, kirim reminder satu-satu lewat WA pribadi, cek mutasi bank sendiri, lalu buka Winbox untuk isolir pelanggan nunggak satu per satu. Pekerjaan ini memakan berjam-jam tiap awal bulan, rawan salah, dan menahan collection rate. Detso mengotomasi loop penuh: **tagih → ingatkan → terima bayar → rekonsiliasi → isolir → pulihkan**.

## 4. Visi & positioning

Detso adalah sistem inti operasional ISP kecil-menengah Indonesia. Pembeda terhadap billing tools yang ada (Mikbotam, Smartbilling): loop uang terintegrasi langsung dengan data lapangan yang sudah dimiliki Detso, yaitu topologi jaringan, tiket, jadwal teknisi, dan monitoring Mikrotik. Pertanyaan "pelanggan ini nunggak?" dan "pelanggan ini online?" dijawab satu layar.

## 5. Persona

- **Owner ISP**: melihat pendapatan vs tunggakan, menentukan kebijakan tagihan (mode siklus, jatuh tempo, denda, isolir).
- **Admin/operator**: mengelola pelanggan, mereview invoice DRAFT, menandai pembayaran manual, mengirim ulang notifikasi.
- **Teknisi lapangan** (mobile): pemasangan, tiket, melihat status tagihan pelanggan saat kunjungan.
- **Super Admin Detso**: mengelola tenant, plan, dan subscription (Fase 4).

## 6. Prinsip

1. **Keamanan sebelum fitur.** Tidak ada fitur baru sebelum temuan kritis tertutup; platform ini memegang NIK warga.
2. **Uang dulu, hiasan belakangan.** Semua yang tidak melayani loop uang ditunda (lihat Non-goals).
3. **Manual dulu, otomatis belakangan.** Pembayaran manual di Fase 2 mendahului gateway di Fase 3; alur teruji sebelum otomasi menyentuh uang dan router produksi.
4. **Pilot sebagai gerbang, bukan pelengkap.** Bentuk billing divalidasi ISP sungguhan sebelum dibangun lebih jauh.
5. **Permukaan produk = kenyataan.** Fitur zombie dihapus; dokumentasi ditulis ulang dari kode, bukan sebaliknya.
6. **Setiap fitur uang punya dry-run.** Invoice bisa direview sebelum terkirim; isolir bisa disimulasikan sebelum dieksekusi.

## 7. Roadmap ringkas

| Fase | Durasi | Isi | Gerbang keluar |
|---|---|---|---|
| 1. Stop-the-bleed | 2–4 minggu | Keamanan, secrets, backup, constraint, CI | Nol temuan kritis tersisa; CI hijau; restore backup terbukti |
| 2. Billing + WA | 6–8 minggu | Invoice engine 2 mode, pembayaran manual, reminder WA, laporan | 1 pilot, 1 siklus penuh, hasil 100% cocok |
| 3. Uang masuk otomatis | 6–8 minggu | Tripay, provisioning PPPoE, isolir & restore otomatis | ≥80% pembayaran tanpa sentuhan operator di pilot |
| 4. Monetisasi Detso | 4–6 minggu | Plan, subscription, kuota, tagihan Detso→tenant | Tenant berbayar pertama |

## 8. Fase 1 — Stop-the-bleed (detail)

### F1.1 Amankan dokumen pelanggan
- Hapus `express.static` untuk seluruh `/storage`; folder private dilayani lewat endpoint ber-auth dengan pengecekan tenant, plus signed URL yang diperbaiki (pakai `JWT_SECRET_TOKEN`).
- Rekonsiliasi path DB vs disk: migration/script menyamakan `storage/public/...` di DB dengan lokasi fisik `storage/private/...`; audit file orphan.
- **AC:** request anonim ke `/storage/private/*` ditolak; dokumen lama terbuka lagi dari UI; ada test regresi untuk keduanya.

### F1.2 Tutup lubang auth & authz
- `authMiddleware` + `requireRole` di `GET /api/user/:id`; `requireRole` di `PUT /schedule/:id`.
- Teknisi hanya bisa baca/ubah tiket assignment-nya (bukan cuma difilter di list).
- Socket.IO: verifikasi JWT saat handshake; `join-tenant` memakai tenant dari token, bukan dari client.
- Login memeriksa `tenant.is_active` dan `tenant.deleted_at`; token user dari tenant nonaktif ditolak middleware.
- **AC:** suite test integrasi lintas-tenant dan lintas-role hijau; skenario "user tenant A membaca resource tenant B" gagal untuk semua router utama.

### F1.3 Rotasi & purge secrets
- Purge git history (`git-filter-repo`) untuk `backend/.env`, `postgres.env`, `frontend/.env.*`, `detso-mobile/.env.*`, `google-services.json`; untrack semuanya.
- Rotasi: password Postgres, `JWT_SECRET_TOKEN` (64+ karakter acak), `ADMIN_SETUP_TOKEN`, token Mapbox (ganti ke `pk.*` untuk client, `sk.*` lama dicabut), Google Maps key di-restrict per aplikasi.
- `MIKROTIK_ENCRYPTION_KEY` dan `ADMIN_SETUP_TOKEN` masuk validasi `env.config.ts`; hapus fallback kunci hardcoded di `encryption.ts`, proses fail-fast bila kosong. Password router lama di-reencrypt dengan kunci baru.
- Hapus `console.log` kredensial di `detso-mobile/src/features/auth/store.ts` dan pasang strip-console untuk build release.
- **AC:** scan gitleaks/trufflehog bersih atas history baru; app menolak start tanpa env wajib.

### F1.4 Ops dasar
- Dockerfile: build ke JS + `prisma migrate deploy` + jalan sebagai non-root; hapus `db push --accept-data-loss`.
- Endpoint `GET /health` (cek DB) dan healthcheck compose menunjuk ke sana.
- Backup `pg_dump` harian + retensi 14 hari + satu kali drill restore terdokumentasi. Target offsite ditentukan (lihat Pertanyaan terbuka).
- HTTPS: domain + reverse proxy (Caddy/Traefik) dengan Let's Encrypt; API produksi tidak lagi diakses via IP:port HTTP.
- **AC:** restart container tidak menyentuh schema; drill restore sukses; produksi hanya bisa diakses via HTTPS.

### F1.5 Integritas data
- Migration unique constraint per tenant: `[tenant_id, id_pel]`, `[tenant_id, nik]`, `[tenant_id, username]`; script dedup dijalankan pada salinan data sebelum migration.
- Guard `seed.ts` agar menolak jalan bila `NODE_ENV=production`.
- Hentikan hard-delete file KTP saat soft-delete customer; file ikut aturan retensi.
- **AC:** insert duplikat ditolak DB; seed di production exit dengan error.

### F1.6 Permukaan produk = kenyataan
- Hapus halaman WhatsApp mati + `whatsapp.api.ts`; perbaiki role `'TEKNISI'` → `'TENANT_TEKNISI'`; dashboard web minimal mengonsumsi `GET /dashboard/tenant` dan `/dashboard/saas` yang sudah ada; perbaiki link baris customer yang 404.
- Tulis ulang README/AGENTS/`_bmad` agar tidak mengklaim fitur fiktif (WhatsApp, ADR yang tidak ada, label "Production Ready").
- **AC:** menyusuri semua menu web tanpa menemukan stub, 404, atau handler `console.log`.

### F1.7 CI pertama
- GitHub Actions: typecheck + build ketiga app, jalankan test isolasi tenant (F1.1/F1.2), gitleaks.
- **AC:** merge ke `main` hanya lewat pipeline hijau.

## 9. Fase 2 — Billing engine + notifikasi WA (detail)

### 9.1 Model data baru

- `Detso_Tenant_Billing_Config` (1:1 tenant): `billing_mode` (`FIXED_DATE` | `ACTIVATION_DATE`), `billing_day` (1–28, dipakai mode FIXED_DATE), `due_days`, `late_fee_type` (`NONE` | `FLAT`) + `late_fee_amount`, `auto_send` (false = semua invoice lahir DRAFT), `invoice_prefix`, info rekening untuk instruksi bayar manual, `isolir_after_days` (disimpan sekarang, dieksekusi Fase 3), konfigurasi WAHA per tenant (endpoint, session, API key; terenkripsi AES yang sudah ada).
- `Detso_Invoice`: tenant_id, customer_id, service_connection_id, `invoice_number` (unique per tenant, berurut), periode, snapshot nama + harga paket, `base_amount`, `prorate_amount`, `late_fee`, `total`, `due_date`, status `DRAFT → SENT → PAID` / `OVERDUE` / `CANCELLED` (+ alasan).
- `Detso_Payment`: invoice_id, amount, method (`MANUAL_TRANSFER` | `MANUAL_CASH`; `GATEWAY` menyusul Fase 3), bukti foto opsional, `verified_by`, `paid_at`. Versi pertama hanya menerima pelunasan penuh; pembayaran parsial ditolak dengan pesan jelas.
- `Detso_Notification_Log`: tenant_id, customer_id, invoice_id, channel, `template_key`, payload, status (`QUEUED` | `SENT` | `FAILED`), respons provider, `sent_at`.

Semua tabel baru membawa `tenant_id` + ikut suite test isolasi tenant dari Fase 1.

### 9.2 Mesin generate tagihan (dua mode)

Cron harian 01:00 WIB, idempoten (unique `[tenant_id, service_connection_id, periode]` menjamin cron dobel tidak membuat invoice dobel):

- **FIXED_DATE**: semua service aktif tenant ditagih pada `billing_day` untuk bulan berjalan. Bulan pertama aktivasi diprorata: `harga × sisa_hari / total_hari_bulan`.
- **ACTIVATION_DATE**: tiap service ditagih pada tanggal anniversary aktivasinya (aktivasi tanggal 29–31 jatuh ke hari terakhir bulan pendek). Tanpa prorate.
- Lewat `due_date` belum lunas → status `OVERDUE` + `late_fee` bila dikonfigurasi.
- `auto_send=false`: invoice lahir `DRAFT`; operator mereview lalu "Kirim semua" (dry-run bawaan untuk tenant baru).

**AC:** test unit tanggal edge (31 → Februari, tahun kabisat, aktivasi tengah bulan, ganti paket mid-cycle memakai snapshot harga lama sampai siklus berikutnya), test idempotensi, test kedua mode berdampingan pada dua tenant berbeda.

### 9.3 Pembayaran manual

Admin mencatat pembayaran dari halaman invoice → invoice `PAID`. Pembatalan pembayaran hanya oleh Owner, dengan alasan, tercatat. Teknisi di mobile melihat status tagihan customer read-only; menerima cash bukan wewenang teknisi di versi ini.

**AC:** test transisi status lengkap, termasuk jalur pembatalan.

### 9.4 Notifikasi WA via WAHA

- Interface `NotificationProvider.send(tenant, to, templateKey, vars)`; adapter pertama: WAHA (https://waha.devlike.pro/), self-hosted satu instance, satu session per tenant memakai nomor WA milik tenant.
- Template Bahasa Indonesia: `INVOICE_ISSUED`, `REMINDER_H3`, `REMINDER_H1`, `OVERDUE_H1`, `PAYMENT_CONFIRMED` (+ `ISOLIR_NOTICE`, `RESTORE_NOTICE` di Fase 3). Variabel: nama, id_pel, nominal, jatuh tempo, instruksi bayar.
- Pengiriman lewat antrian `Notification_Log`: retry 3× dengan backoff, jeda antar pesan per session untuk menekan risiko banned, status terlihat di UI.
- **AC:** kegagalan WAHA tidak menghentikan cron billing; semua kiriman punya jejak log; template bisa dipreview dari web.

### 9.5 UI

- **Web:** halaman Tagihan (list + filter status/periode/search, detail, tandai lunas, kirim ulang WA, cancel), badge tunggakan di detail customer, kartu pendapatan bulan ini vs tunggakan di dashboard tenant.
- **Mobile:** status tagihan di layar detail customer (read-only).
- **AC:** operator menyelesaikan satu siklus penuh (review DRAFT → kirim → tandai lunas → laporan) tanpa menyentuh database langsung.

### 9.6 Laporan

Rekap bulanan per tenant: total tertagih, terbayar, tunggakan, daftar penunggak; export CSV.
**AC:** angka rekap cocok dengan fixture test.

### 9.7 Gerbang pilot (exit criteria Fase 2)

Satu ISP pilot menjalankan satu siklus tagihan penuh di Detso, paralel dengan sistem lamanya. Checklist validasi: jumlah invoice, total nominal, dan daftar penunggak cocok 100%. Keluhan pilot selama siklus menjadi backlog prioritas awal Fase 3. Bila 8 minggu berlalu tanpa pilot yang mau jalan, arah roadmap direview (fallback konsolidasi design-partner).

## 10. Fase 3 — Uang masuk otomatis (garis besar)

- **Tripay**: kredensial merchant per tenant (uang pelanggan masuk langsung ke rekening ISP; Detso tidak menjadi penampung dana sehingga terhindar dari kewajiban perizinan pengelola pembayaran). Kode bayar closed-payment per invoice (VA, QRIS, retail outlet), kedaluwarsa mengikuti due date. Webhook: verifikasi signature, idempoten, → `PAID` → `PAYMENT_CONFIRMED` + trigger restore isolir.
- **Provisioning PPPoE**: create service connection membuat PPP secret via Mikrotik API (username = `id_pel`, password generated, profile sesuai paket); mapping disimpan di service_connection; job rekonsiliasi mendeteksi drift antara DB dan router.
- **Isolir otomatis**: cron memindahkan profile PPPoE ke `ISOLIR` untuk invoice `OVERDUE` melewati `isolir_after_days`. Eksekusi batch kecil (≤20) dengan jeda, mode simulasi (daftar calon isolir tanpa eksekusi), log per aksi, dan tombol rollback. Restore otomatis saat webhook `PAID` masuk. Notifikasi `ISOLIR_NOTICE`/`RESTORE_NOTICE`.
- **PPPoE session monitoring**: hidupkan `getPPPoEActiveSessions` yang kini dummy; sesi dipetakan ke service_connection → indikator online/offline + last_seen di detail customer (web + mobile).

## 11. Fase 4 — Monetisasi Detso (garis besar)

- Model `Plan` (kuota customer/user/router, harga) dan `Tenant_Subscription` (masa aktif, status, grace period).
- Enforcement: kuota dicek saat create resource; masa aktif dicek saat login dan di middleware; tenant nunggak melewati grace period tersuspensi otomatis (`is_active=false`, kini benar-benar berefek berkat F1.2).
- Tagihan Detso→tenant memakai billing engine Fase 2 (dogfooding), pembayaran via Tripay merchant Detso.
- Halaman Super Admin: kelola plan, subscription, suspensi. Onboarding tenant baru tetap manual-assisted di versi ini.

## 12. Non-goals (sengaja ditunda)

UI web untuk network map/monitoring Mikrotik; RADIUS/FreeRADIUS; inventory perangkat ONT/CPE; offline mode penuh mobile; laporan pajak; audit log lintas entitas (dibangun menyusul bersama kebutuhan sengketa tagihan); pendalaman topologi FTTH (OLT/ODC/splitter); payment gateway kedua; onboarding tenant self-service.

## 13. Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| Bug billing berarti uang: tagihan salah menghancurkan kepercayaan pilot | Dry-run DRAFT default untuk tenant baru; test unit tanggal edge; gerbang pilot paralel dengan sistem lama |
| Isolir salah berarti pelanggan mati internet massal | Mode simulasi, batch kecil + jeda, rollback, log per aksi; isolir baru dibangun setelah billing terbukti satu siklus |
| Dua mode siklus menggandakan permukaan bug engine | Core generator satu jalur dengan strategi tanggal sebagai fungsi murni terpisah; test matrix wajib mencakup kedua mode |
| WAHA berbasis WA Web, nomor bisa kena banned | Abstraksi provider (ganti adapter tanpa sentuh billing); nomor khusus per tenant; jeda antar pesan; template non-spam |
| Tanpa user nyata, bentuk billing hanya asumsi | Pilot sebagai gerbang keluar Fase 2; deadline 8 minggu dengan fallback eksplisit |
| Developer solo, modul berisiko tinggi | Urutan manual → otomatis; tiap fase punya exit criteria; CI dari Fase 1 menahan regresi |
| Isolasi tenant manual bisa bocor lagi di tabel baru | Semua tabel billing masuk suite test isolasi; hardening terpusat (Prisma extension/RLS) masuk backlog Fase 4 |

## 14. Metrik keberhasilan

- **Fase 1:** nol temuan kritis tersisa; scan secrets bersih; restore backup terbukti; CI hijau menjadi syarat merge.
- **Fase 2:** 1 pilot menjalankan 1 siklus penuh dengan hasil 100% cocok; ≥90% notifikasi WA terkirim tanpa intervensi.
- **Fase 3:** ≥80% pembayaran pilot terekonsiliasi tanpa sentuhan operator; isolir + restore otomatis berjalan tanpa insiden salah-isolir.
- **Fase 4:** tenant berbayar pertama aktif; kuota dan suspensi terbukti berefek.

## 15. Pertanyaan terbuka

1. Target backup offsite (S3/B2/Drive?) dan siapa yang memegang kredensialnya.
2. Domain produksi + lokasi deploy untuk HTTPS (menentukan detail F1.4).
3. Harga plan Detso di Fase 4 (Free/Basic/Pro dan batas kuotanya).
4. Kebijakan retensi dokumen identitas (UU PDP): berapa lama scan KTP disimpan setelah customer berhenti.
5. Kandidat ISP pilot: dari komunitas mana direkrut, dan insentifnya (gratis berapa lama).

## 16. Lampiran — file kunci

`backend/src/app.ts` (static storage), `backend/src/controller/user/index.ts` (route bocor), `backend/src/utils/signed-url.ts` + `encryption.ts` (env mismatch & fallback key), `backend/Dockerfile` (db push), `backend/prisma/schema.prisma` (constraint), `backend/src/jobs/mikrotik-monitoring.job.ts` + `backend/src/services/mikrotik/` (pijakan Fase 3), `frontend/components/admin/sidebar/menu-list.ts` (bug role), `frontend/app/admin/dashboard/page.tsx` (stub), `detso-mobile/src/features/auth/store.ts` (log kredensial).
