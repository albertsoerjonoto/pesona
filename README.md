# Pesona.io

AI-native personal beauty & body coach for Indonesia.

## Getting Started

```bash
cp .env.local.example .env.local
# Fill in your Supabase credentials and Gemini API key
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Tech Stack

- **Framework**: Next.js 15 (App Router), TypeScript
- **Styling**: Tailwind CSS v4
- **Backend/Auth**: Supabase (email/password, OAuth, PostgreSQL, Storage)
- **AI**: Google Gemini 2.5 Flash (coach chat, vision analysis, routine generator)
- **Payments**: Midtrans (QRIS, VA, card) via `/api/subscription/checkout`
- **Deploy**: Vercel at pesona.io

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run lint` — Lint code
- `npm start` — Start production server

See [CLAUDE.md](CLAUDE.md) for full project documentation.
