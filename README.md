# Unity Call

Inclusive messaging and calling for South African users who want audio, text, video, or sign-first communication.

## Run locally

1. `npm install`
2. `npm install --prefix server`
3. `npm run dev`
4. Open http://localhost:5173

Create two accounts in two browsers (one can be a private window). Use **New Chat** to find the other person by email and start a real conversation or call.

Development sign-in shows the one-time code on screen. Add SMTP or SMS later for production delivery.

## What works now

- Registration, OTP, login, logout, recovery, and account deletion
- Per-user conversations, messages, calls, media, and preferences
- Voice notes with stored playback
- WebRTC voice/video, mute that disables the microphone, live captions, typed replies spoken to the other person
- Settings for language, text size, contrast, vibration, theme, and TTS
- Routes, browser Back, guest invitation links, interpreter booking, and organisation desks

## Production extras

Copy `.env.example` and set:

- `DATABASE_URL` for Neon/Postgres, then apply `server/src/schema.sql`
- `TURN_URLS`, `TURN_USERNAME`, `TURN_PASSWORD` for reliable calling across networks
- `SMTP_URL` for real email OTP
- `OPENAI_API_KEY` if you later enable optional AI image descriptions
