# QQShare

**QQShare** is a secure, one-time file sharing service. Upload a file (≤ 100 MB), get a link, and share it for a single download within 60 minutes. All encryption is 100% client-side (AES-GCM-256), and the decryption secret is only in the link fragment.

## Features
- One-time file sharing (file is deleted after first download)
- 60-minute expiry for uploads
- 100% client-side encryption (optional password)
- No file or secret ever sent unencrypted
- Modern, dark JetBrains/Apple-style UI

## Tech Stack
- **Frontend:** Next.js 14 (App Router, React 18), Tailwind CSS, shadcn/ui
- **Crypto:** Browser Web Crypto API
- **Backend:** Next.js Route Handlers (API)
- **Storage:** Local FS (`/tmp/onedrop/<id>.bin` and `<id>.json`)

## Usage
1. Run the dev server:
   ```bash
   npm run dev
   # or: yarn dev / pnpm dev / bun dev
   ```
2. Open [http://localhost:3000](http://localhost:3000)
3. Upload a file and share the generated link.

## API
- `POST /api/upload` — Uploads file, returns `{ id, expiresAt }`
- `GET /api/download/[id]` — Downloads file (once), then deletes it. Second attempt returns 410.

## Environment Variables
```
FILE_TTL_MINUTES=60
MAX_FILE_SIZE_MB=100
NODE_ENV=development
```

## Notes
- All files are stored in `/tmp/onedrop` and purged after expiry or download.
- No AWS/Redis dependencies. Pure local FS.
- For production, ensure `/tmp` is writable and persists ≤ 60 min.
