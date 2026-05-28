# tenK — Mastery Tracker

> Track your journey to 10,000 hours of deliberate practice.

tenK is an open-source web + mobile app for tracking skill mastery. Log focused Pomodoro sessions, keep diary memos with photo evidence, visualize progress on a GitHub-style heatmap, and share your journey with friends in groups.

## Features

- **Skill hierarchy** — Organize skills under domains (e.g. *Music → Guitar*, *Coding → TypeScript*)
- **Pomodoro timer** — Configurable work/break cycles with per-session progress tracking
- **Session memos** — Write notes and attach photos to each practice session
- **Activity heatmap** — GitHub-style calendar showing daily practice intensity
- **Groups & leaderboard** — Share selected skills with friends and compare weekly hours
- **Real-time sync** — Changes appear instantly across all your devices via Supabase Realtime
- **Google Calendar** — View your practice schedule alongside real-world events

## Tech Stack

| Layer | Tech |
|---|---|
| Web | React 18, Vite, TypeScript, Tailwind CSS, Zustand |
| Mobile | Expo 51, React Native 0.74, Expo Router, NativeWind |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Shared types | `@tenk/shared` (npm workspace) |

## Prerequisites

- **Node.js** 18+
- **npm** 8+ (workspaces)
- **Supabase CLI** — `npm install -g supabase`
- **Expo CLI** — `npm install -g expo-cli`
- A [Supabase](https://supabase.com) project (free tier works)
- A [Google Cloud](https://console.cloud.google.com) project (for Calendar OAuth)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/tenk-app/tenk.git
cd tenk
npm install
```

### 2. Database

**Option A — Supabase CLI (recommended)**

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

**Option B — SQL editor**

Copy the contents of `supabase/migrations/001_initial_schema.sql` and paste it into the [Supabase SQL editor](https://app.supabase.com).

### 3. Storage bucket

In your Supabase dashboard → **Storage**:
1. Create a bucket named `evidence`
2. Set it as **public**

### 4. Environment variables

```bash
# Web
cp .env.example apps/web/.env
```

Edit `apps/web/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Create `apps/mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 5. Run

```bash
# Web (http://localhost:5173)
npm run web

# Mobile (scan QR code with Expo Go)
npm run mobile
```

## Google Calendar Setup

1. Open [Google Cloud Console](https://console.cloud.google.com) → enable **Google Calendar API**
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add authorized origins:
   - `http://localhost:5173` (dev)
   - Your production domain
4. Copy the Client ID → `VITE_GOOGLE_CLIENT_ID`

For Google sign-in via Supabase Auth:
- Dashboard → **Authentication → Providers → Google** → enter Client ID + Secret

## Deployment

### Web — Vercel

```bash
npm install -g vercel
vercel --cwd apps/web --prod
```

Set environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Mobile — Expo EAS

```bash
npm install -g eas-cli
cd apps/mobile
eas login
eas build --platform all
eas submit --platform all
```

## Project Structure

```
tenk/
├── packages/
│   └── shared/              # Shared TypeScript types (@tenk/shared)
├── apps/
│   ├── web/                 # React + Vite web app
│   │   ├── src/
│   │   │   ├── components/  # UI components (Timer, Groups, Calendar…)
│   │   │   ├── lib/         # Supabase client, Zustand store, hooks
│   │   │   └── pages/       # Route-level page components
│   │   └── public/
│   └── mobile/              # Expo React Native app
│       ├── app/
│       │   ├── (tabs)/      # Tab screens (Timer, Skills, Groups)
│       │   └── auth/        # Sign-in / sign-up screens
│       ├── components/      # Shared RN components
│       └── store/           # Zustand timer store
└── supabase/
    └── migrations/          # PostgreSQL schema (run once)
```

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE) © tenK Contributors
