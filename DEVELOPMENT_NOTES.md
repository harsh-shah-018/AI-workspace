# Real-Time Collaborative Workspace - Development Notes

Welcome to the development notes for this project! These notes are structured to provide you with full understanding of how the real-time AI workspace is built from scratch, without relying on external libraries like Next.js or Yjs.

## Technologies Used
- **Frontend:** React, Vite, Zustand (for state management).
- **Backend:** Node.js, Express, Socket.io (for websockets).
- **Database:** PostgreSQL (with Prisma ORM).
- **AI Integration:** Google Gemini API mapping.

## Setup Instructions

### 1. Database Setup
Since you don't have a local PostgreSQL DB, we are going to run one using Docker.
1. Download & Install [Docker Desktop](https://www.docker.com/products/docker-desktop).
2. Open a terminal in the root of this workspace.
3. Run the following command to start PostgreSQL:
   ```bash
   docker-compose up -d
   ```
   *This command spins up a local PostgreSQL server on port 5432 with the credentials defined in `docker-compose.yml`.*

### 2. Custom Collaboration Engine
Instead of using Yjs or Liveblocks, we are building a straightforward replication model suited for block-based editing (like Notion):
- Documents consist of multiple text `Block`s.
- Each time a user edits a block, the local `Zustand` state updates instantly (**Optimistic UI**).
- A debounced WebSocket event is emitted to the server with the block changes.
- The server records the changes in PostgreSQL and broadcasts the updated block to everyone else in the room via Socket.io.
- Other clients receive the event and replace their old block version with the newly updated one.

### 3. State Management (Zustand)
Since we want high performance when multiple blocks are getting updated rapidly, Zustand provides an excellent un-opinionated store without the boilerplate of Redux. We'll simply sync the Zustand store with incoming web socket messages.

---

*(More notes will be appended here as development progresses...)*
