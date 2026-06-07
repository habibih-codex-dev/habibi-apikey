# 🎛️ Habibi Official — Admin Dashboard (Next.js)

A premium dark-themed admin dashboard for the Habibi Official API.

## Features
- 🔐 Admin login (JWT, stored client-side)
- 📊 Usage overview (totals, 24h, latency, 14-day chart, top endpoints)
- 🔑 API key management (generate, enable/disable, rotate, delete, copy)
- 👥 User management (create, change plan, delete, search)
- 📜 Live request logs (auto-refresh)
- ⚙️ Settings (change password, connection info)

## Setup
```bash
cd dashboard
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL to your API
npm install
npm run dev                         # http://localhost:3000
```

Make sure the API (`/api`) is running first (default `http://localhost:4000`).
Default admin login: **admin / habibi123** (change it in API `.env`).

## Production
```bash
npm run build
npm run start      # or: pm2 start "npm run start" --name habibi-dashboard
```

## Structure
```
dashboard/
├── app/
│   ├── layout.js              # root layout + global css
│   ├── page.js                # redirect -> /login or /dashboard
│   ├── login/page.js          # admin login
│   └── dashboard/
│       ├── layout.js          # auth guard + sidebar
│       ├── page.js            # overview / stats
│       ├── keys/page.js       # API keys
│       ├── users/page.js      # users
│       ├── logs/page.js       # request logs
│       └── settings/page.js   # account/connection
├── components/Sidebar.js
├── lib/api.js                 # API client + auth
└── app/globals.css            # premium theme
```


---

## 🚀 Deploy ke Vercel (FULL-STACK — tampilan + API + database jadi satu)

Sekarang dashboard ini **full-stack**: REST API-nya ada di dalam `app/api/*` (Next.js
Route Handlers) dan datanya disimpan di **Upstash Redis**. Jadi **semua jalan di Vercel** —
tidak perlu VPS untuk website apikey. Pterodactyl cukup untuk **bot** saja.

### 1) Siapkan database (Upstash Redis) — gratis
1. Push project ke GitHub, lalu import folder `dashboard` ke **Vercel**
   (Add New ▸ Project ▸ pilih repo ▸ **Root Directory = `dashboard`**).
2. Di project Vercel → tab **Storage** → **Create Database** → **Upstash for Redis** → Connect.
   Vercel otomatis menyetel env `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`
   (atau `KV_REST_API_URL`/`KV_REST_API_TOKEN`). **Tanpa copy token manual.**

### 2) Set Environment Variables (Settings ▸ Environment Variables)
| Variable | Wajib | Keterangan |
|----------|:----:|------------|
| `JWT_SECRET` | ✅ | string acak panjang (untuk login admin) |
| `ADMIN_USERNAME` | – | default `admin` |
| `ADMIN_PASSWORD` | ✅ | password admin pertama (default `habibi123`) |
| `APIKEY_DAILY_QUOTA` | – | kuota harian per key (default 1000, 0 = unlimited) |
| `OPENAI_API_KEY` | – | aktifkan endpoint `/api/ai/chat` |
| `UPSTREAM_*` | – | sumber downloader/search (lihat `api/.env.example`) |

> Database env (`UPSTASH_*`) sudah otomatis dari langkah 1.

### 3) Deploy
**Deploy** → jadi `https://namamu.vercel.app`. Admin pertama otomatis dibuat saat login pertama.
Login default: **admin / habibi123** (ganti `ADMIN_PASSWORD` ya!).

### 4) Hubungkan ke bot (di Pterodactyl)
Di `config.js` bot, arahkan ke API Vercel (jangan lupa **`/api`** di belakang):
```js
apikey: {
  customApiBase: 'https://namamu.vercel.app/api',
  customApiKey: 'hbi_xxxx',   // generate di dashboard ▸ API Keys
}
```
Selesai — bot ambil downloader, iQC, welcome image, dll dari API Vercel kamu.

---

## 🔀 Endpoint API (full-stack)
Sama seperti versi Express, tapi prefix-nya `/api`:
- Admin: `/api/auth/login`, `/api/keys`, `/api/users`, `/api/stats/*`
- Publik (pakai `x-api-key`): `/api/download/<provider>`, `/api/search/<type>`,
  `/api/ai/chat`, `/api/image/welcome|goodbye|iphonechat`, `/api/ping`

## 🖥️ Alternatif: jalan di VPS (tanpa Vercel)
Folder **`api/`** (Express) tetap ada sebagai opsi kalau kamu mau host API + dashboard
sendiri di VPS/Pterodactyl. Lihat `DEPLOY.md`. Pilih salah satu saja — Vercel **atau** VPS.

### ⚠️ Catatan
- Image generator (`@napi-rs/canvas`) jalan di Vercel pakai runtime Node.js (sudah di-set).
- CORS untuk endpoint publik sudah dibuka (`*`) supaya bot dari Pterodactyl bisa akses.
- Belum dites build di sini (tanpa internet); kalau ada error saat `vercel build`, kirim lognya.

