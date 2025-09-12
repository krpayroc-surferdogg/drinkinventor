# Drink Inventor

React + Vite + Tailwind app that generates cocktail/mocktail recipes by theme/holiday/spirit with sales-focused descriptions and upgrade tips. Includes a dense retro 50s-style animated backdrop (no external icon CDNs).

## Quick Start
```bash
npm install
npm run dev
# build
npm run build && npm run preview
```
## Deploy to Vercel
- Push this repo to GitHub.
- Import the repo in Vercel (Framework: **Vite**). Default settings work.
- Build command: `npm run build` — Output dir: `dist/`

## Project Structure
```
drink-inventor/
  ├─ index.html
  ├─ package.json
  ├─ postcss.config.js
  ├─ tailwind.config.js
  ├─ vite.config.js
  └─ src/
     ├─ App.jsx
     ├─ index.css
     └─ main.jsx
```

Console-only tests run in DevTools on mount.
