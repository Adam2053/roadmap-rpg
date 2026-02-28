# 🗡️ Roadmap RPG – AI-Powered Life Operating System

A production-ready SaaS MVP that gamifies personal growth using AI-generated roadmaps, XP, levels, and streaks.

## ✨ Features

- **AI Roadmap Generation** – Google Gemini generates personalized weekly plans with daily tasks
- **XP & Leveling System** – Earn XP per task, level up based on `floor(0.1 * sqrt(totalXP))`
- **Category Tracking** – Body, Skills, Mindset, Career XP bars
- **Streak System** – Complete at least 1 task/day to maintain your streak
- **Editable Roadmaps** – Mark tasks complete, regenerate plans anytime
- **Dark Theme UI** – Modern glassmorphism design with animated progress bars
- **JWT Auth** – HTTP-only cookie sessions, bcrypt passwords
- **Mobile Responsive** – Works on all screen sizes

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Backend | Next.js API Routes (Node.js) |
| Database | MongoDB (Mongoose) |
| Auth | JWT (jose) + bcryptjs |
| AI | Google Gemini 1.5 Flash |
| Toast | Sonner |

## 🚀 Quick Setup

### 1. Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Google AI Studio account (for Gemini API key)

### 2. Clone & Install
```bash
git clone <your-repo>
cd roadmap-rpg
npm install
```

### 3. Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/roadmap-rpg
JWT_SECRET=your-random-32-char-secret-here
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Get your Gemini API key:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key (free tier available)

**Generate a JWT secret:**
```bash
openssl rand -base64 32
```

**MongoDB Atlas:**
1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user
3. Whitelist your IP (or 0.0.0.0/0 for development)
4. Copy the connection string

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Build for Production
```bash
npm run build
npm start
```

## 📁 Project Structure

```
roadmap-rpg/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles + CSS variables
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   └── page.tsx               # Dashboard (XP, level, streak, roadmaps)
│   ├── login/
│   │   ├── layout.tsx
│   │   └── page.tsx               # Login form
│   ├── register/
│   │   ├── layout.tsx
│   │   └── page.tsx               # Register form
│   ├── roadmap/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Roadmap generator form
│   │   └── [id]/page.tsx          # Roadmap view + task completion
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── me/route.ts
│       ├── roadmap/
│       │   ├── route.ts           # POST generate, GET list
│       │   └── [id]/route.ts      # GET, PUT regenerate, DELETE
│       └── tasks/
│           └── route.ts           # POST complete/uncomplete task
├── lib/
│   ├── db.ts                      # MongoDB connection
│   ├── auth.ts                    # JWT sign/verify, level formula
│   ├── gemini.ts                  # Gemini AI integration
│   └── types.ts                   # Shared TypeScript types
├── models/
│   ├── User.ts                    # User schema
│   ├── Roadmap.ts                 # Roadmap schema
│   └── TaskProgress.ts            # Task progress schema
├── components/
│   ├── Navbar.tsx
│   ├── AuthProvider.tsx            # Auth hydration + route protection
│   ├── XPBar.tsx                  # Animated XP progress bar
│   ├── CategoryBadge.tsx
│   └── Skeleton.tsx               # Loading skeletons
├── store/
│   └── authStore.ts               # Zustand user store
├── .env.example
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 🎮 Gamification Details

### Level Formula
```
Level = floor(0.1 * sqrt(totalXP))
```

| XP | Level |
|----|-------|
| 0 | 0 |
| 100 | 1 |
| 400 | 2 |
| 900 | 3 |
| 10,000 | 10 |
| 40,000 | 20 |

### XP Values
- Easy tasks: 20–50 XP
- Medium tasks: 50–100 XP
- Hard tasks: 100–200 XP

### Streak Logic
- Complete ≥1 task today → streak increments
- Miss a day → streak resets to 1
- Tracked via `lastActiveDate` on User model

### Categories
| Category | Color | Icon |
|---------|-------|------|
| Body | Orange | 💪 |
| Skills | Blue | 🧠 |
| Mindset | Purple | ✨ |
| Career | Green | 🚀 |

## 🔒 Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT stored in HTTP-only cookies (not accessible via JS)
- All API routes validate JWT before processing
- XP values read from DB (server-side), not trusted from client
- Input validation and sanitization on all routes
- MongoDB injection prevented by Mongoose schema types

## 🧠 AI Integration

Gemini 1.5 Flash generates roadmaps with:
- Strict JSON schema validation
- Auto-retry on invalid JSON (once)
- Temperature 0.7 for creative but coherent plans
- Tasks fitted to user's available hours/day
- Progressive difficulty across weeks

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```
Set environment variables in Vercel dashboard.

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use a strong `JWT_SECRET` (32+ chars)
- Use MongoDB Atlas with proper IP allowlisting
- Set `NEXT_PUBLIC_APP_URL` to your production domain

