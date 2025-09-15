mkdir -p src
cat > src/App.jsx <<'EOF'
// src/App.jsx
import React, { useMemo, useState } from "react";

/* ----------------------------- Utilities ----------------------------- */
function titleize(words) {
  return (words || [])
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}
function splitLines(text) {
  if (!text) return [];
  return text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}
function toCSV(rows) {
  if (!rows || !rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ];
  return lines.join("\n");
}

function downloadCSV(filename, rows) {
  const csv = toCSV(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ----------------------------- Data Sets ----------------------------- */
const SPIRITS = ["Vodka", "Gin", "Rum", "Tequila", "Whiskey", "Bourbon"];
const FLAVORS = ["citrus","berry","tropical","herbal","spicy","floral","coffee","chocolate","stone fruit"];
const METHODS = ["shaken", "stirred", "built", "blended"];
const GLASSWARE = ["coupe", "rocks", "collins", "martini", "highball"];
const BUBBLES = ["none", "soda", "tonic", "ginger beer", "prosecco"];
const OPENERS = ["Server tip:","Guest-friendly pitch:","Quick sell:","Recommendation:"];


/* --------------------------- Name Generators -------------------------- */
const ADJ = ["Velvet","Golden","Smoky","Bright","Midnight","Electric","Blushing","Honeyed","Citrus","Silk"];
const NOUN = ["Daiquiri","Highball","Fizz","Sour","Spritz","Collins","Martini","Old Fashioned","Rickey","Cobbler"];
function randomOf(list, rng) { return list[Math.floor(rng() * list.length)]; }
function makeRNG(seed) { let s = seed >>> 0; return () => { s^=s<<13; s^=s>>>17; s^=s<<5; return ((s>>>0)/0xffffffff); }; }

/* -------------------------- Drink Construction ------------------------ */
function buildPitch({ name, spirit, flavors, sweetness, bubbly, glass, method }) {
  const sweetWord = sweetness < 30 ? "crisp and dry" : sweetness < 60 ? "balanced" : "lush";
  const bubbleBit = bubbly !== "none" ? ` with a ${bubbly} lift` : "";
  const flavorBit = flavors.length ? `notes of ${flavors.join(", ")}` : "clean lines";
  return `${name} highlights ${spirit}, ${flavorBit}, ${sweetWord}${bubbleBit}, served ${method} in a ${glass}.`;
}
function makeSuggestions(options, count = 5, seed = Date.now()) {
  const rng = makeRNG(seed);
  const { spirit, flavorSet, sweetness, bubbles } = options;
  const flavorArray = Array.from(flavorSet);
  const picks = [];
  for (let i = 0; i < count; i++) {
    const method = randomOf(METHODS, rng);
    const glass = randomOf(GLASSWARE, rng);
    const bubbly = bubbles ? randomOf(BUBBLES.slice(1), rng) : "none";
    const flavorPool = flavorArray.length ? flavorArray : FLAVORS;
    const f1 = randomOf(flavorPool, rng);
    const f2 = randomOf(flavorPool, rng);
    const f3 = rng() > 0.6 ? randomOf(flavorPool, rng) : null;
    const chosenFlavors = Array.from(new Set([f1, f2, f3].filter(Boolean)));
    const name = `${randomOf(ADJ, rng)} ${randomOf(NOUN, rng)}`;
    const ingredients = [
      `${spirit} (${method})`,
      chosenFlavors.join(", "),
      bubbly !== "none" ? bubbly : null,
    ].filter(Boolean).join(" | ");
    const pitch = buildPitch({ name, spirit, flavors: chosenFlavors, sweetness, bubbly, glass, method });
    picks.push({
      name, spirit, flavors: chosenFlavors.join(", "), sweetness,
      bubbles: bubbly, method, glass, ingredients, pitch,
    });
  }
  return picks;
}

/* --------------------------------- App -------------------------------- */
export default function App() {
  const [spirit, setSpirit] = useState(SPIRITS[0]);
  const [sweetness, setSweetness] = useState(45);
  const [bubbles, setBubbles] = useState(true);
  const [flavorSet, setFlavorSet] = useState(new Set(["citrus"]));
  const [seed, setSeed] = useState(Date.now());
  const [notes, setNotes] = useState("");

  const options = { spirit, sweetness, bubbles, flavorSet };
  const suggestions = useMemo(() => makeSuggestions(options, 5, seed), [spirit, sweetness, bubbles, flavorSet, seed]);

  const rowsForCSV = suggestions.map((s) => ({
    name: s.name, spirit: s.spirit, flavors: s.flavors, sweetness: s.sweetness,
    bubbles: s.bubbles, method: s.method, glass: s.glass, pitch: s.pitch,
  }));
  const pitchesText = suggestions.map((s, i) => `${OPENERS[i % OPENERS.length]} ${s.pitch}`).join("\n");

  function toggleFlavor(tag) {
    setFlavorSet((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  }
  function regenerate() { setSeed(Date.now()); }
  function copyPitches() { navigator.clipboard.writeText(pitchesText); }
  function exportCSV() { downloadCSV("drink-inventor.csv", rowsForCSV); }

  return (
    <div className="app">
      <style>{CSS}</style>
      <header className="header">
        <h1>🍸 Drink Inventor</h1>
        <p className="sub">Quick ideas, friendly pitches, easy export.</p>
      </header>

      <main className="grid">
        <section className="card">
          <h2>Build Parameters</h2>
          <label className="row">
            <span>Base spirit</span>
            <select value={spirit} onChange={(e) => setSpirit(e.target.value)}>
              {SPIRITS.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </label>

          <div className="row">
            <span>Flavor notes</span>
            <div className="chips">
              {FLAVORS.map((f) => {
                const active = flavorSet.has(f);
                return (
                  <button key={f} className={`chip ${active ? "active" : ""}`} onClick={() => toggleFlavor(f)} type="button" aria-pressed={active}>
                    {titleize(f.split(" "))}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="row">
            <span>Sweetness: {sweetness}</span>
            <input type="range" min="0" max="100" step="1" value={sweetness} onChange={(e) => setSweetness(Number(e.target.value))}/>
          </label>

          <label className="row check">
            <input type="checkbox" checked={bubbles} onChange={(e) => setBubbles(e.target.checked)} />
            <span>Include bubbly options</span>
          </label>

          <label className="row">
            <span>Notes (optional)</span>
            <textarea placeholder="Any constraints, allergens, venue vibes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}/>
          </label>

          <div className="actions">
            <button className="btn" onClick={regenerate} type="button">Regenerate Ideas</button>
            <button className="btn" onClick={copyPitches} type="button">Copy Pitches</button>
            <button className="btn" onClick={exportCSV} type="button">Export CSV</button>
          </div>
        </section>

        <section className="card">
          <h2>Suggestions</h2>
          {suggestions.map((s, i) => (
            <article className="suggestion" key={s.name + i}>
              <div className="s-title">
                <strong>{s.name}</strong>
                <small>{s.method} • {s.glass} • {s.bubbles !== "none" ? s.bubbles : "still"}</small>
              </div>
              <div className="s-body">
                <div className="meta">
                  <div><b>Spirit:</b> {s.spirit}</div>
                  <div><b>Flavors:</b> {s.flavors || "clean"}</div>
                  <div><b>Sweetness:</b> {s.sweetness}</div>
                </div>
                <p className="ingredients"><b>Build:</b> {s.ingredients}</p>
                <p className="pitch"><b>{OPENERS[i % OPENERS.length]}</b> {s.pitch}</p>
              </div>
            </article>
          ))}
        </section>
      </main>

      <footer className="footer">
        <small>© {new Date().getFullYear()} Drink Inventor</small>
      </footer>
    </div>
  );
}

const CSS = `
:root { --bg:#0b0c10; --card:#12141a; --muted:#a7b0c0; --text:#e8ecf1; --accent:#5eead4; --accent-2:#60a5fa; --border:#1f2430; --chip:#1a1f2a; --chip-active:#0f172a; }
*{box-sizing:border-box} html,body,#root{height:100%}
body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,"Helvetica Neue",Arial,"Noto Sans","Apple Color Emoji","Segoe UI Emoji";background:radial-gradient(1200px 800px at 10% -10%,#0f172a 0%,var(--bg) 55%);color:var(--text)}
.app{max-width:1100px;margin:0 auto;padding:24px}
.header{text-align:center;margin-bottom:18px}
.header h1{margin:0;font-size:28px;letter-spacing:.3px}
.sub{color:var(--muted);margin-top:6px}
.grid{display:grid;gap:16px;grid-template-columns:380px 1fr}
@media (max-width:980px){.grid{grid-template-columns:1fr}}
.card{background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(0,0,0,.08));border:1px solid var(--border);border-radius:16px;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
.row{display:grid;grid-template-columns:160px 1fr;gap:10px;align-items:center;margin:12px 0}
.row>span{color:var(--muted);font-size:14px}
.row.check{grid-template-columns:1fr;gap:8px;display:flex;align-items:center}
.row.check span{color:var(--text)}
select,textarea,input[type="range"]{width:100%;background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:10px;padding:10px 12px;outline:none}
textarea{resize:vertical}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{border:1px solid var(--border);background:var(--chip);color:var(--text);padding:8px 10px;border-radius:999px;font-size:13px;cursor:pointer}
.chip.active{border-color:var(--accent);background:linear-gradient(180deg,var(--chip-active),rgba(94,234,212,.08));box-shadow:0 0 0 2px rgba(94,234,212,.12) inset}
.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.btn{background:linear-gradient(180deg,rgba(96,165,250,.15),rgba(94,234,212,.12));border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:12px;cursor:pointer}
.btn:hover{border-color:var(--accent-2)}
.suggestion{border-top:1px solid var(--border);padding:12px 0}
.suggestion:first-of-type{border-top:none}
.s-title{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.s-title strong{font-size:16px}
.s-title small{color:var(--muted)}
.meta{display:flex;gap:16px;flex-wrap:wrap;color:var(--muted);font-size:14px}
.ingredients{margin:8px 0}
.pitch{margin:8px 0 0}
.footer{text-align:center;color:var(--muted);margin-top:14px}
`;
EOF
