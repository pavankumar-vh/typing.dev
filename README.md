# Typing.dev

A terminal-style code typing trainer built for developers. Practice typing real code snippets in Java, Python, and JavaScript with real-time performance metrics.

## Project Structure

```
typing.dev/
├── frontend/        ← React + Vite app (V1 complete)
└── backend/         ← Node.js API (coming soon)
```

## Frontend Stack

- **React 19** + **Vite**
- **Tailwind CSS v4**
- **JetBrains Mono** font
- CRT phosphor terminal theme

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

## Features (V1)

- Monkeytype-style single-page trainer
- Language selection: Java, Python, JavaScript
- Duration: 15s / 30s / 60s / 120s
- Real-time WPM, raw WPM, accuracy, error count
- Tab = new test · Esc = restart same snippet
- CRT scanline + vignette + phosphor glow effects
- Block cursor with step-end blink

