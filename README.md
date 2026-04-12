# Real-Time Collaborative AI Workspace

A real-time collaborative workspace inspired by Notion and ChatGPT. Multiple users can join a shared "room", co-edit documents live, and trigger AI actions (summarize, rewrite, translate) streaming in real-time.

## Features
- **Custom Real-Time Engine**: Built from the ground up using Socket.io and fractional block indexing (no Yjs or Liveblocks).
- **Optimistic UI Syncing**: Instant local feedback combined with reliable server broadcasts.
- **Dynamic AI Streaming**: Full integration with the Google Gemini API for real-time text manipulation and generation.
- **Real-Time Presence**: See who's currently active inside your workspace.
- **Robust Authentication**: JWT backend protection.
- **PostgreSQL Database**: Prisma ORM with structured relational modeling.

## Tech Stack
- Frontend: **React + Vite**, Zustand, Vanilla CSS, Axios
- Backend: **Node.js, Express, Socket.io**, Prisma
- Database: **PostgreSQL**
- AI: **Google Gemini API** (`@google/genai`)

## Quickstart

### Prerequisites
- PostgreSQL running locally or a cloud database URL (Neon, Supabase).
- Node.js (v20+ recommended).

### Running Locally
1. Configure `backend/.env` with your PostgreSQL `DATABASE_URL` and `GEMINI_API_KEY`.
2. Push database schema:
   ```bash
   cd backend
   npx prisma db push
   ```
3. Start the Backend server:
   ```bash
   cd backend
   npm run dev
   ```
4. Start the Frontend dev server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

*Note: You can read the `DEVELOPMENT_NOTES.md` file for full insights into the architectural decisions and synchronization logic.*
