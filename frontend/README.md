# Typing.dev — Frontend

React + Vite typing trainer with CRT terminal theme.

## Dev

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

## Structure

```
src/
├── components/
│   ├── TypingCanvas.jsx   ← character rendering engine
│   └── MetricsBar.jsx     ← WPM/accuracy/timer strip
├── data/
│   └── snippets.js        ← 9 code snippets across 3 languages
├── pages/
│   ├── Home.jsx           ← main single-page trainer (active)
│   ├── Setup.jsx          ← legacy
│   ├── Train.jsx          ← legacy
│   └── Result.jsx         ← legacy
├── utils/
│   └── metrics.js         ← WPM + accuracy calculation
├── App.jsx
├── main.jsx
└── index.css              ← Tailwind v4 + CRT theme tokens
```
