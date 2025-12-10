# 🎵 Rand Jukebox

A community-driven music queue for Rand Dining Hall at Vanderbilt University. Students can request songs, vote on the queue, and enjoy a student-curated soundtrack while dining.

![Rand Jukebox](https://img.shields.io/badge/Vanderbilt-Rand%20Jukebox-gold?style=for-the-badge)

## ✨ Features

### For Students
- 🔍 **Search Songs** - Find your favorite tracks via Spotify
- ➕ **Add to Queue** - Request songs to be played (1 song per person limit)
- 👍 **Vote** - Upvote songs to move them up the queue
- 🎧 **Now Playing** - See what's currently playing and what's next

### For Staff (Admin Panel)
- ▶️ **Playback Controls** - Play, pause, skip songs
- 🔒 **Queue Management** - Enable/disable requests, clear queue
- ❌ **Remove Songs** - Delete inappropriate requests
- 📊 **Statistics** - View usage stats and queue info

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/rand-jukebox.git
cd rand-jukebox

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Deploy to Vercel

The easiest way to deploy is with [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/rand-jukebox)

Or via CLI:
```bash
npm i -g vercel
vercel
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Deployment**: Vercel

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main queue page
│   ├── admin/
│   │   └── page.tsx      # Staff control panel
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── Header.tsx        # Navigation header
│   ├── Footer.tsx        # Site footer
│   ├── NowPlaying.tsx    # Current song display
│   ├── QueueList.tsx     # Song queue
│   └── SearchBar.tsx     # Song search
└── store/
    └── useJukeboxStore.ts # Zustand state store
```

## 🎯 Future Enhancements

- [ ] Spotify API integration for real song search
- [ ] VU credentials authentication
- [ ] Explicit content filtering
- [ ] Real-time WebSocket updates
- [ ] Admin authentication
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

## 📋 Project Proposal

This project was created to pitch to Rand Dining Hall staff as a way to:

1. **Build Community** - Let students contribute to the dining atmosphere
2. **Increase Engagement** - Make Rand feel more student-driven
3. **Enhance Experience** - Music curated by the people enjoying it

### Key Guardrails
- ✅ Clean/non-explicit tracks only
- ✅ 1 request per student limit
- ✅ Staff can override, pause, or shut down anytime
- ✅ Operates during designated times only

## 📄 License

MIT License - feel free to use and modify for your own campus!

---

Made with ❤️ for the Vanderbilt community

