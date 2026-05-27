<p align="center">
  <img src="frontend/src/assets/image.png" alt="PeerCall logo" width="150" />
</p>

<h1 align="center">PeerCall</h1>

<p align="center">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-0DBE70?style=flat" alt="license: MIT">
  </a>
  	<img src="https://img.shields.io/github/last-commit/SumitDesai-21/PeerCall?style=flat&logo=git&logoColor=white&color=50C878" alt="last-commit">
  	<img src="https://img.shields.io/github/languages/top/SumitDesai-21/PeerCall?style=flat&color=0080ff" alt="repo-top-language">
  	<img src="https://img.shields.io/github/languages/count/SumitDesai-21/PeerCall?style=flat&color=0080ff" alt="repo-language-count">
</p>

PeerCall is a simple video calling app.

I built it to answer one question: **“How can I create a real-time video call experience with WebRTC, and keep it easy for users?”**

The result is a small full‑stack project:

- **Frontend:** React + Vite (UI + WebRTC in the browser)
- **Backend:** Node.js + Express + Socket.IO (auth, signaling, chat, history)
- **Database:** MongoDB (stores user accounts and meeting history)  
---

### What you can do with PeerCall

- Sign up and sign in (JWT auth)
- Join a meeting using a **meeting code** (the code becomes part of the URL)
- Talk in real time using **WebRTC peer connections**
- Send **chat messages** inside the room (Socket.IO)
- Toggle camera and microphone
- Share your screen
- View your **meeting history** (meeting code + date/time)

---

### How it works (high level)

Think of PeerCall as two layers working together:

1) **HTTP layer (Express)**
   - Handles login/register
   - Stores meeting history in MongoDB

2) **Real‑time layer (Socket.IO + WebRTC)**
   - Socket.IO is used for:
     - joining a room
     - sending WebRTC signaling data (SDP + ICE)
     - room chat
     - broadcasting video on/off state
   - WebRTC is used for:
     - direct peer-to-peer audio/video streaming between browsers

Important idea: **Socket.IO does not carry your video stream.**
It only helps browsers “find each other” and exchange the info needed to create a WebRTC connection.

---

### Project structure

```
PeerCall/

  backend/                  # Express + Socket.IO + MongoDB
    app.js                  # server entry
    src/
      controllers/
      middlewares/
      models/
      routes/

  frontend/                 # React + Vite
    src/
      pages/                # Landing, Authentication, Home, VideoMeet, History
      contexts/             # AuthContext
      utils/                # withAuth

  build/                    # optional/static build output (if generated)
```

---

### Prerequisites

- Node.js (LTS recommended)
- MongoDB connection string (local MongoDB or MongoDB Atlas)
- A modern browser (Chrome/Edge recommended for WebRTC)

---

### Setup (local development)

This repo has **two separate apps** (frontend and backend). You run them in two terminals.

#### 1) Backend setup

Go to the backend folder and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
# backend/.env
PORT=8080
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>

# Used to sign/verify JWT tokens (keep it secret)
ACCESS_TOKEN_SECRET=replace-with-a-long-random-string
```

Start the backend:

```bash
npm run server
```

Backend will start on `http://localhost:8080` (or the `PORT` you set).

#### 2) Frontend setup

Open another terminal:

```bash
cd frontend
npm install
```

Optional (but recommended): create `frontend/.env` to point to your backend:

```env
# frontend/.env
# REST API base for auth + history
VITE_BASE_URL=http://localhost:8080/api/users

# Socket.IO server (same backend host/port)
VITE_SERVER_URL=http://localhost:8080
```

Start the frontend:

```bash
npm run dev
```

Now open the Vite URL shown in the terminal (usually `http://localhost:5173`).

---

### Usage walkthrough

1) Open the app => you land on the **Landing** page.
2) Create an account on **Sign Up**, then **Sign In**.
3) You arrive at **Home** where you can enter a meeting code.
4) When you join, PeerCall navigates you to `/<meetingCode>`.
5) The meeting page:
   - asks for camera/microphone permissions
   - connects to Socket.IO with your JWT token
   - joins the room
   - exchanges WebRTC signaling with other users
   - starts the peer-to-peer video streams
6) After joining from Home, the meeting code is saved to your **History**.

---

### Scripts

#### Root (`package.json`)

Some deploy platforms (like Render) run build/start commands from the **repo root**.

- `npm run build` => installs backend + frontend deps and builds the frontend into `frontend/build`
- `npm start` => starts the backend server

#### Backend (`backend/package.json`)

- `npm run server` => start with nodemon (development)
- `npm start` => start with node (production style)
- `npm run prod` => run with pm2 (requires pm2 installed)

#### Frontend (`frontend/package.json`)

- `npm run dev` => start Vite dev server
- `npm run build` => build production assets

---

### API (backend)

Base path: `/api/users`

#### Auth

- `POST /api/users/register`
  - body: `{ name, email, password }`

- `POST /api/users/login`
  - body: `{ email, password }`
  - response (success): `{ token, name }`

#### Meeting history

- `POST /api/users/add_to_activity`
  - body: `{ token, meeting_code }`

- `GET /api/users/get_all_activity?token=...`
  - response: list of meetings: `{ email_id, meetingCode, date }[]`

---

### Socket events (real-time layer)

Socket authentication:

- Client sends the JWT token using `socket.io` auth: `auth: { token }`
- Server verifies it using `ACCESS_TOKEN_SECRET`

Events used in this project:

- `join-call(roomId, name)`
- `user-joined(socketId, users)`
- `signal(toId, message)` i.e WebRTC SDP/ICE payload
- `chat-message(roomId, message, sender)`
- `video-state(videoState)`
- `user-left({ socketId, name })`

---

### Notes and common issues

- **Camera/mic works best on HTTPS in production.** Browsers may block media access on insecure origins.
- **Guest join:** the UI has a “Join As Guest” button on the landing page, but the socket server currently requires a JWT token. If you want true guest mode, you can make socket auth optional on the backend.
- **CORS:** backend enables CORS. If you deploy with strict origins, update the Socket.IO and Express CORS config.
- **MongoDB connection errors:** verify `MONGO_URI` and your IP allowlist on MongoDB Atlas.

---

