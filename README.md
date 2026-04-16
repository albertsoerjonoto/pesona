# Pesona.io

AI-powered personal beauty & body coach for Indonesia.

## Getting Started

```bash
cp .env.local.example .env.local
# Fill in your Supabase and Anthropic API keys
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Tech Stack

- **Framework**: Next.js 15 (App Router), TypeScript
- **Styling**: Tailwind CSS v4
- **Backend/Auth**: Supabase (email/password, OAuth, PostgreSQL, Storage)
- **AI**: Claude API (Anthropic)
- **Deploy**: Vercel at pesona.io

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run lint` — Lint code
- `npm start` — Start production server

See [CLAUDE.md](CLAUDE.md) for full project documentation.
