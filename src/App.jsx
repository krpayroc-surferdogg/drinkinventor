import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

// Drink Inventor — client app (v1.5.1) dense retro backdrop + sales descriptions

const THEMES = ["None","Summer","Winter","Spring","Autumn","Tiki","Speakeasy","Brunch","Game Day","Romantic","Birthday"];
const HOLIDAYS = ["None","New Year","Valentine's Day","St. Patrick's Day","Easter","Cinco de Mayo","Juneteenth","Independence Day","Halloween","Thanksgiving","Christmas"];
const FLAVORS = ["Citrusy","Fruity","Herbal","Spicy","Smoky","Bitter","Sweet","Sour","Floral","Creamy"];
const SPIRITS = ["Any","Vodka","Gin","Rum","Tequila","Mezcal","Whiskey","Bourbon","Rye","Scotch","Brandy","Cognac","Pisco"];

const INGREDIENTS = {
  baseNA: ["Seedlip Grove NA","Lyre's Dry NA","Cold Brew","Black Tea","Sparkling Water","Ginger Beer","Tonic","Lemonade"],
  citrus: ["Lemon Juice","Lime Juice","Grapefruit Juice","Yuzu Juice"],
  sweeteners: ["Simple Syrup","Demerara Syrup","Honey Syrup","Agave Syrup","Maple Syrup","Grenadine"],
  liqueurs: ["Triple Sec","Cointreau","Aperol","Campari","St-Germain","Amaretto","Dry Vermouth","Sweet Vermouth"],
  bitters: ["Angostura Bitters","Orange Bitters","Peychaud's Bitters"],
  mixers: ["Soda Water","Ginger Beer","Cola","Tonic Water","Pineapple Juice","Cranberry Juice"],
  herbs: ["Mint","Basil","Rosemary","Thyme"],
  garnishes: ["Lemon Twist","Lime Wheel","Orange Peel","Brandied Cherry","Dehydrated Citrus","Cinnamon Stick","Fresh Herb Sprig"],
  premium: ["Egg White","Aquafaba","Demerara Sugar Rim","Smoked Glass","Clarified Juice"],
};

const SPIRIT_COMPATS = {
  Any: ["Vodka","Gin","Rum","Tequila","Whiskey","Bourbon","Rye","Scotch","Brandy"],
  Vodka: ["Citrusy","Fruity","Floral"],
  Gin: ["Herbal","Citrusy","Floral"],
  Rum: ["Fruity","Sweet","Tiki"],
  Tequila: ["Citrusy","Spicy"],
  Mezcal: ["Smoky","Citrusy"],
  Whiskey: ["Bitter","Smoky","Sweet"],
  Bourbon: ["Sweet","Bitter"],
  Rye: ["Bitter","Spicy"],
  Scotch: ["Smoky","Bitter"],
  Brandy: ["Fruity","Sweet"],
  Cognac: ["Fruity","Sweet"],
  Pisco: ["Floral","Citrusy"],
};

const THEME_HINTS = {
  Summer: { colors: "from-yellow-400 via-orange-400 to-pink-500", adds: ["Pineapple Juice","Mango Puree","Mint"] },
  Winter: { colors: "from-sky-400 via-blue-500 to-indigo-600", adds: ["Cinnamon Stick","Maple Syrup","Orange Peel"] },
  Spring: { colors: "from-emerald-400 via-teal-400 to-cyan-400", adds: ["St-Germain","Basil","Cucumber"] },
  Autumn: { colors: "from-amber-500 via-orange-500 to-rose-500", adds: ["Apple Cider","Demerara Syrup","Thyme"] },
  Tiki: { colors: "from-lime-400 via-teal-400 to-cyan-500", adds: ["Pineapple Juice","Orgeat","Angostura Bitters"] },
  Speakeasy: { colors: "from-zinc-700 via-stone-800 to-black", adds: ["Sweet Vermouth","Orange Bitters","Brandied Cherry"] },
  Brunch: { colors: "from-rose-300 via-pink-300 to-amber-200", adds: ["Prosecco","Orange Juice","Grapefruit Juice"] },
  "Game Day": { colors: "from-red-500 via-orange-500 to-yellow-400", adds: ["Ginger Beer","Cola","Lime Juice"] },
  Romantic: { colors: "from-rose-400 via-pink-500 to-fuchsia-600", adds: ["Rose Syrup","Strawberry Puree","Sparkling Wine"] },
  Birthday: { colors: "from-fuchsia-400 via-violet-500 to-indigo-500", adds: ["Vanilla Syrup","Sprinkles Rim","Whipped Cream"] },
};

const HOLIDAY_HINTS = {
  "St. Patrick's Day": { adds: ["Irish Whiskey","Mint","Apple Juice"], nameBits: ["Shamrock","Emerald","Clover"] },
  Halloween: { adds: ["Activated Charcoal","Blackberry","Smoke"], nameBits: ["Phantom","Raven","Nightfall"] },
  Thanksgiving: { adds: ["Apple Cider","Cinnamon Stick","Brown Butter"], nameBits: ["Harvest","Maple","Cider"] },
  Christmas: { adds: ["Cranberry","Rosemary","Peppermint"], nameBits: ["Noel","Mistletoe","Yule"] },
  "Independence Day": { adds: ["Blue Curaçao","Strawberry","Lemon"], nameBits: ["Liberty","Firecracker","Stars"] },
};

function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function sample(arr,n){ const copy=[...arr], out=[]; for(let i=0;i<n&&copy.length;i++) out.push(copy.splice(Math.floor(Math.random()*copy.length),1)[0]); return out; }
function rng(seed=1957){ let t=seed>>>0; return ()=> (t=(t+0x6D2B79F5)|0, ((t^(t>>>15))*(1|t))>>>0)/4294967296; }
function titleize(words){ return words.map(w=>w[0].toUpperCase()+w.slice(1)).join(" "); }
function splitLines(text){ if(!text) return []; return text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean); }

// ✅ Safe CSV builder
function toCSV(rows){
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),                                  // header row
    ...rows.map(r => headers.map(h => esc(r[h])).join(",")), // data rows
  ];
  return lines.join("\n"); // use "\r\n" for Windows line endings if desired
}

const OPENERS = ["Server tip:","Guest-friendly pitch:","Quick sell:","Recommendation:"];
const MOUTHEELS = { Citrusy:["bright","zesty","fresh-squeezed"], Fruity:["juicy","ripe","tropical"], Herbal:["herbal","garden-fresh","botanical"], Spicy:["peppery","spiced","lively"], Smoky:["smoky","embers","campfire-kissed"], Bitter:["bitter-sweet","aperitivo-style","grown-up"], Sweet:["softly sweet","rounded","dessert-leaning"], Sour:["tart","snappy","mouthwatering"], Floral:["floral","perfumed","blooming"], Creamy:["silky","creamy","lush"] };
const PAYOFFS = ["pairs great with appetizers","easy sipping before dinner","perfect for date night","great with something salty","refreshing and not too sweet","full-flavored without being heavy"];
const ACTIONS = ["ask if they prefer tequila or vodka","offer to add a salt rim","suggest a mocktail version","recommend a top-shelf spirit upgrade"];

function salesDescription({ tier, isMocktail, spirit, flavors, theme, holiday }){
  const tone = tier==='Elevated' ? 'refined' : tier==='Budget' ? 'approachable' : 'balanced';
  const style = isMocktail ? 'zero-proof' : (spirit || 'spirit-forward');
  const f = (flavors&&flavors.length) ? rand(flavors) : null;
  const mouthfeel = f && MOUTHEELS[f] ? rand(MOUTHEELS[f]) : 'balanced';
  const context = holiday && holiday!=='None' ? `${holiday.toLowerCase()} vibes` :
                  (theme && theme!=='None' ? `${theme.toLowerCase()} vibes` : 'any occasion');
  const opener = rand(OPENERS), payoff = rand(PAYOFFS), action = rand(ACTIONS);
  return `${opener} ${tone}, ${style}, and ${mouthfeel}; ${payoff}. ${isMocktail?'Zero alcohol':'Clean finish'} — ${context}. Pro move: ${action}.`;
}

// ---------- generation engine ----------
function makeName({ theme, holiday, spirit, flavor }){
  const baseWords = ["Velvet","Ember","Aurora","Crescent","Starlight","Serenade","Zephyr","Citrine","Obsidian","Marigold","Midnight","Saffron","Evergreen","Opal","Garnet","Topaz"];
  const bits = [rand(baseWords)];
  if (holiday && holiday!=="None" && HOLIDAY_HINTS[holiday]) bits.push(rand(HOLIDAY_HINTS[holiday].nameBits));
  else if (theme && theme!=="None") bits.push(theme);
  else if (flavor && flavor!=="") bits.push(flavor);
  if (spirit && spirit!=="Any") bits.push(spirit);
  return titleize(bits);
}
function pickByTier(tier){
  if (tier==="Elevated") return { technique: rand(["Shake","Stir","Whip Shake"]), components:[rand(INGREDIENTS.citrus),rand(INGREDIENTS.sweeteners),rand(INGREDIENTS.liqueurs),rand(INGREDIENTS.bitters)], premium: sample(INGREDIENTS.premium,1), garnish: rand(INGREDIENTS.garnishes), glass: rand(["Coupe","Nick & Nora","Rocks"]) };
  if (tier==="Budget")   return { technique: rand(["Build","Stir"]), components:[rand(INGREDIENTS.citrus),rand(INGREDIENTS.mixers)], premium:[], garnish: rand(["Lime Wheel","Orange Peel"]), glass: rand(["Highball","Rocks"]) };
  return { technique: rand(["Shake","Stir","Build"]), components:[rand(INGREDIENTS.citrus),rand(INGREDIENTS.sweeteners)], premium:[], garnish: rand(INGREDIENTS.garnishes), glass: rand(["Coupe","Rocks","Highball"]) };
}
function elevationTips(name){
  const base=[{type:"Technique",tip:"Use a large clear-ice cube to slow dilution and highlight aromatics."},{type:"Ingredient",tip:"Upgrade sweetener to demerara or honey syrup for richer body."},{type:"Balance",tip:"Fine-tune acid/sweet with 0.25 oz adjustments; aim for bright but not puckering."},{type:"Aroma",tip:"Express a fresh citrus peel and rim the glass lightly with the oils."},{type:"Prep",tip:"Double strain shaken cocktails for silkier texture; consider adding egg white or aquafaba."},{type:"Presentation",tip:"Use a complementary herb sprig or dehydrated citrus as garnish."}];
  const n=(name||"").toLowerCase(); let targeted=null;
  if (n.includes("margarita"))    targeted={type:"Upgrade",tip:"Split base with mezcal (3:1 tequila:mezcal) for subtle smoke."};
  if (n.includes("old fashioned"))targeted={type:"Upgrade",tip:"Swap simple for demerara; add 1 dash orange bitters alongside Angostura."};
  if (n.includes("martini"))      targeted={type:"Upgrade",tip:"Express lemon over a 50/50 build and garnish with a lemon coin for brightness."};
  const picks=sample(base,targeted?3:4); return targeted?[targeted,...picks]:picks;
}
function composeRecipe({ theme, holiday, flavors, spirits, allowCocktails, allowMocktails, tier }){
  const useSpirit = allowCocktails ? (spirits.includes("Any") ? rand(SPIRIT_COMPATS.Any) : rand(spirits)) : null;
  const flavor = flavors.length ? rand(flavors) : "";
  const name = makeName({ theme, holiday, spirit: useSpirit ?? "Mocktail", flavor });
  const t = pickByTier(tier);
  const base = useSpirit ?? rand(INGREDIENTS.baseNA);
  const adds=[]; if (theme && theme!=="None" && THEME_HINTS[theme]) adds.push(...sample(THEME_HINTS[theme].adds, Math.min(2, THEME_HINTS[theme].adds.length)));
  if (holiday && holiday!=="None" && HOLIDAY_HINTS[holiday]) adds.push(...sample(HOLIDAY_HINTS[holiday].adds, Math.min(2, HOLIDAY_HINTS[holiday].adds.length)));
  const allComponents = [base, ...t.components, ...sample(adds, Math.min(1, adds.length)), ...t.premium];
  const method = `${t.technique} with ice for 10–12 seconds${t.technique==="Stir" ? " until well-chilled" : ""}. Strain into a ${t.glass} over fresh ice if appropriate.`;
  const spec = [`${useSpirit ? "2 oz" : "2 oz"} ${base}`, `${rand(["0.75 oz","1 oz"])} ${rand(INGREDIENTS.citrus)}`, `${rand(["0.5 oz","0.75 oz"])} ${rand(INGREDIENTS.sweeteners)}`];
  if (t.components.includes("Dry Vermouth") || t.components.includes("Sweet Vermouth")) spec.push(`${rand(["0.5 oz","0.75 oz"])} Vermouth`);
  if (t.premium.includes("Egg White") || t.premium.includes("Aquafaba")) spec.push(`${t.premium.includes("Egg White") ? "1" : "1 oz"} ${t.premium.includes("Egg White") ? "Egg White" : "Aquafaba"}`);
  const description = salesDescription({ tier, isMocktail: !useSpirit, spirit: useSpirit, flavors, theme, holiday });
  return { name, tier, isMocktail: !useSpirit, base, technique: t.technique, glass: t.glass, garnish: t.garnish, ingredients: allComponents, spec: Array.from(new Set(spec)), method, description, notes: flavor ? `Leans ${flavor.toLowerCase()}.` : "" };
}

// ---------- UI ----------
export default function App(){
  const [theme,setTheme]=useState("None");
  const [holiday,setHoliday]=useState("None");
  const [flavors,setFlavors]=useState([]);
  const [spirits,setSpirits]=useState(["Any"]);
  const [allowCocktails,setAllowCocktails]=useState(true);
  const [allowMocktails,setAllowMocktails]=useState(true);
  const [elevatedCount,setElevatedCount]=useState(2);
  const [regularCount,setRegularCount]=useState(3);
  const [budgetCount,setBudgetCount]=useState(2);
  const [existingDrinks,setExistingDrinks]=useState("");
  const [generated,setGenerated]=useState([]);
  const [tips,setTips]=useState([]);

  const totalRequested=elevatedCount+regularCount+budgetCount;
  const canGenerate=useMemo(()=> !(!allowCocktails && !allowMocktails) && !!totalRequested, [allowCocktails,allowMocktails,totalRequested]);

  function toggleArray(setter,value){ setter(prev=>prev.includes(value)?prev.filter(v=>v!==value):[...prev,value]); }
  function handleGenerate(){ const out=[]; const pack=(n,tier)=>{ for(let i=0;i<n;i++){ out.push(composeRecipe({theme,holiday,flavors,spirits,allowCocktails,allowMocktails,tier})); } }; pack(elevatedCount,"Elevated"); pack(regularCount,"Regular"); pack(budgetCount,"Budget"); setGenerated(out); }
  function handleElevate(){ const names=splitLines(existingDrinks); const out=names.map(name=>({name,suggestions:elevationTips(name)})); setTips(out); }
  function copyAll(){ if(!generated.length) return; const blocks=generated.map(r=>[`${r.name} (${r.tier}${r.isMocktail?' • Mocktail':''})`,`Description: ${r.description}`,`Glass: ${r.glass} • Technique: ${r.technique}`,`Spec: ${r.spec.join(', ')}`,`Method: ${r.method}`,r.notes?`Notes: ${r.notes}`:''].filter(Boolean).join('\n')); const text=blocks.join('\n\n'); navigator.clipboard?.writeText(text); }

  useEffect(()=>{ const results=runTests(); console.log('[DrinkInventor tests]',results); const failed=results.filter(r=>!r.passed); if(failed.length){ console.error('[DrinkInventor tests] failures:',failed);} },[]);

  const accent=THEME_HINTS[theme]?.colors||"from-fuchsia-400 via-rose-400 to-amber-400";

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-20`} />
      <RetroBackdrop />
      <div className="relative z-10 px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="flex items-center justify-between">
            <motion.h1 initial={{y:10,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:0.5}} className="text-3xl font-black tracking-tight">🍸 Drink Inventor</motion.h1>
          </header>
          <motion.section initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.5}} className="grid md:grid-cols-3 gap-4">
            <Card title="Context">
              <Label>Theme</Label>
              <Select value={theme} onChange={e=>setTheme(e.target.value)}>{THEMES.map(t=>(<option key={t} value={t}>{t}</option>))}</Select>
              <Label className="mt-3">Holiday</Label>
              <Select value={holiday} onChange={e=>setHoliday(e.target.value)}>{HOLIDAYS.map(h=>(<option key={h} value={h}>{h}</option>))}</Select>
              <Label className="mt-3">Flavor Profiles</Label>
              <div className="flex flex-wrap gap-2">{FLAVORS.map(f=>(<Chip key={f} active={flavors.includes(f)} onClick={()=>toggleArray(setFlavors,f)}>{f}</Chip>))}</div>
            </Card>
            <Card title="Base Spirits">
              <div className="flex flex-wrap gap-2">{SPIRITS.map(s=>(<Chip key={s} active={spirits.includes(s)} onClick={()=>{ if(s==="Any"){setSpirits(["Any"]);return;} setSpirits(prev=>{ const next=prev.includes("Any")?prev.filter(x=>x!=="Any"):[...prev]; return next.includes(s)?next.filter(x=>x!==s):[...next,s]; }); }}>{s}</Chip>))}</div>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <Toggle checked={allowCocktails} onChange={setAllowCocktails} label="Cocktails"/>
                <Toggle checked={allowMocktails} onChange={setAllowMocktails} label="Mocktails"/>
              </div>
              <h2 className="font-semibold mt-4">Counts</h2>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <Num label="Elevated" value={elevatedCount} setValue={setElevatedCount}/>
                <Num label="Regular" value={regularCount} setValue={setRegularCount}/>
                <Num label="Budget" value={budgetCount} setValue={setBudgetCount}/>
              </div>
              <div className="text-xs text-slate-700/70 mt-1">Total: {totalRequested}</div>
            </Card>
            <Card title="Elevate Existing Drinks">
              <p className="text-sm text-slate-700/80">Paste one drink per line (e.g., “Margarita”, “Old Fashioned”).</p>
              <textarea className="w-full border rounded-xl p-3 h-28 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/70" value={existingDrinks} onChange={e=>setExistingDrinks(e.target.value)} placeholder={"Margarita\nOld Fashioned"} />
              <div className="flex gap-2 mt-3">
                <GradButton onClick={handleElevate}>Get Elevation Tips</GradButton>
                <GhostButton onClick={()=>{ setExistingDrinks(""); setTips([]); }}>Clear</GhostButton>
              </div>
            </Card>
          </motion.section>
          <motion.section initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.5}} className="flex items-center gap-3">
            <GradButton disabled={!canGenerate} onClick={handleGenerate}>Generate Recipes</GradButton>
            <GhostButton onClick={copyAll} disabled={!generated.length}>Copy All</GhostButton>
            <GhostButton onClick={()=>window.print()} disabled={!generated.length}>Print / Save PDF</GhostButton>
          </motion.section>
          {!!generated.length && (
            <section>
              <h2 className="text-xl font-semibold mb-3">Generated Recipes</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generated.map((r,idx)=>(
                  <motion.article whileHover={{y:-3}} key={idx} className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-4 space-y-2 border border-white/60">
                    <div className="flex items-center justify-between"><h3 className="font-bold">{r.name}</h3><TierBadge tier={r.tier}/></div>
                    <div className="text-xs text-slate-700">{r.isMocktail?'Mocktail':'Cocktail'} • Glass: {r.glass} • Technique: {r.technique}</div>
                    <div className="text-sm"><span className="font-semibold">Description:</span> {r.description}</div>
                    <div className="text-sm"><span className="font-semibold">Spec:</span> {r.spec.join(", ")}</div>
                    <div className="text-sm"><span className="font-semibold">Method:</span> {r.method}</div>
                    {r.notes && <div className="text-xs text-slate-600">{r.notes}</div>}
                  </motion.article>
                ))}
              </div>
            </section>
          )}
          {!!tips.length && (
            <section>
              <h2 className="text-xl font-semibold mb-3">Elevation Tips</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tips.map((t,idx)=>(
                  <motion.article whileHover={{y:-3}} key={idx} className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-4 border border-white/60">
                    <h3 className="font-bold">{t.name}</h3>
                    <ul className="list-disc ml-5 mt-2 text-sm space-y-1">{t.suggestions.map((s,i)=>(<li key={i}><span className="font-semibold">{s.type}:</span> {s.tip}</li>))}</ul>
                  </motion.article>
                ))}
              </div>
            </section>
          )}
          <footer className="text-xs text-slate-700/80 pt-6 border-t border-white/50">Made for restaurant owners and operators to brainstorm fresh cocktail/mocktail ideas, sell with confidence, and elevate current menus.</footer>
        </div>
      </div>
    </div>
  );
}

// ---------- UI primitives ----------
function Card({ title, children }){ return (<motion.div whileHover={{y:-3}} className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-4 border border-white/60">{title && <h2 className="font-semibold mb-2">{title}</h2>}{children}</motion.div>); }
function Label({ children, className="" }){ return <label className={`block text-sm ${className}`}>{children}</label>; }
function Select(props){ return <select className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-amber-400/70" {...props} />; }
function Chip({ children, active, onClick }){ return (<button onClick={onClick} className={`px-3 py-1 rounded-full text-sm transition border ${active?'bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white border-transparent shadow':'bg-white text-slate-800 hover:bg-slate-50 border-slate-200'}`}>{children}</button>); }
function Toggle({ checked, onChange, label }){ return (<label className="inline-flex items-center gap-2 cursor-pointer select-none"><span className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${checked?'bg-emerald-500':'bg-slate-300'}`} onClick={()=>onChange(!checked)}><span className={`h-4 w-4 bg-white rounded-full shadow transform transition ${checked?'translate-x-4':'translate-x-1'}`} /></span><span className="text-sm">{label}</span></label>); }
function Num({ label, value, setValue }){ return (<div><label className="block text-sm mb-1">{label}</label><input type="number" min={0} className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-cyan-400/70" value={value} onChange={e=>setValue(+e.target.value||0)} /></div>); }
function GradButton({ children, disabled, onClick }){ return (<button disabled={disabled} onClick={onClick} className={`px-4 py-2 rounded-xl text-white transition shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-400`}>{children}</button>); }
function GhostButton({ children, disabled, onClick }){ return (<button disabled={disabled} onClick={onClick} className={`px-3 py-2 rounded-xl border transition bg-white/70 backdrop-blur hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed`}>{children}</button>); }
function TierBadge({ tier }){ const styles=tier==='Elevated'?'bg-amber-100 text-amber-800 border-amber-200': tier==='Budget'?'bg-sky-100 text-sky-800 border-sky-200':'bg-emerald-100 text-emerald-800 border-emerald-200'; return <span className={`text-xs px-2 py-1 rounded-full border ${styles}`}>{tier}</span>; }

// ---------- dense retro backdrop ----------
function RetroBackdrop(){
  const r=rng(1957);
  const dots=Array.from({length:60},(_,i)=>({ id:`d${i}`, x:r()*100, y:r()*100, size:8+Math.floor(r()*16), color:rand(["#F59E0B","#FB923C","#FCA5A5","#34D399","#60A5FA"]) }));
  const slices=Array.from({length:10},(_,i)=>({ id:`s${i}`, x:r()*100, y:r()*100, rot:Math.floor(r()*360), color:rand(["#F59E0B","#FB923C"]) }));
  const leaves=Array.from({length:18},(_,i)=>({ id:`l${i}`, x:r()*100, y:r()*100, rot:Math.floor(r()*360), color:rand(["#34D399","#10B981","#2DD4BF"]) }));
  const glasses=Array.from({length:7},(_,i)=>({ id:`g${i}`, x:r()*100, y:r()*100, size:56+Math.floor(r()*32), type:rand(["martini","wine","beer","coupe","highball"]) }));
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {dots.map(d=> (
        <motion.div key={d.id} className="absolute" style={{left:`${d.x}%`, top:`${d.y}%`}} animate={{y:[0,-6,0]}} transition={{repeat:Infinity, duration:6+Math.random()*4, delay:Math.random()*2}}>
          <svg width={d.size} height={d.size} viewBox="0 0 10 10" className="opacity-40"><circle cx="5" cy="5" r="5" fill={d.color}/></svg>
        </motion.div>
      ))}
      {slices.map(s=> (
        <motion.div key={s.id} className="absolute" style={{left:`${s.x}%`, top:`${s.y}%`, rotate:s.rot}} animate={{rotate:[s.rot,s.rot+10,s.rot]}} transition={{repeat:Infinity, duration:14+Math.random()*6}}>
          <CitrusIcon size={64} color={s.color} />
        </motion.div>
      ))}
      {leaves.map(l=> (
        <motion.div key={l.id} className="absolute" style={{left:`${l.x}%`, top:`${l.y}%`, rotate:l.rot}} animate={{y:[0,4,0]}} transition={{repeat:Infinity, duration:10+Math.random()*6}}>
          <LeafIcon size={34} color={l.color} />
        </motion.div>
      ))}
      {glasses.map(g=> (
        <motion.div key={g.id} className="absolute text-slate-800/30" style={{left:`${g.x}%`, top:`${g.y}%`}} animate={{y:[0,-8,0]}} transition={{repeat:Infinity, duration:12+Math.random()*6}}>
          {g.type==="martini"&&<MartiniIcon size={70} />}
          {g.type==="wine"&&<WineIcon size={68} />}
          {g.type==="beer"&&<BeerIcon size={72} />}
          {g.type==="coupe"&&<CoupeIcon size={74} />}
          {g.type==="highball"&&<HighballIcon size={76} />}
        </motion.div>
      ))}
    </div>
  );
}

// ---------- simple icons ----------
function MartiniIcon({ size=72 }){ return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18l-9 9-9-9Z"/><path d="M12 12v8"/><path d="M8 21h8"/><path d="M15 6l3 3"/></svg>); }
function WineIcon({ size=68 }){ return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2h10l-1 6a6 6 0 1 1-8 0L7 2Z"/><path d="M12 14v6"/><path d="M8 22h8"/></svg>); }
function BeerIcon({ size=70 }){ return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="7" width="10" height="13" rx="2"/><path d="M14 9h3a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-3"/><path d="M4 7c0-2 2-3 5-3s5 1 5 3"/></svg>); }
function CoupeIcon({ size=78 }){ return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18c0 3-4 6-9 6S3 8 3 5Z"/><path d="M12 11v7"/><path d="M8 22h8"/></svg>); }
function HighballIcon({ size=82 }){ return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M7 7h10M7 12h10M7 17h10"/></svg>); }
function CitrusIcon({ size=64, color="#FB923C" }){ return (<svg width={size} height={size} viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="30" stroke={color} strokeWidth="4" fill="#00000000"/><g stroke={color} strokeWidth="4"><path d="M32 32V4"/><path d="M32 32V60"/><path d="M32 32H4"/><path d="M32 32H60"/><path d="M32 32L10 10"/><path d="M32 32L54 10"/><path d="M32 32L10 54"/><path d="M32 32L54 54"/></g></svg>); }
function LeafIcon({ size=34, color="#34D399" }){ return (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><path d="M6 30c0-12 10-22 22-22 0 14-8 26-22 26" stroke={color} strokeWidth="4" fill="none"/><path d="M10 28c6 0 10-4 14-8" stroke={color} strokeWidth="4"/></svg>); }

// ---------- console-only tests ----------
function runTests(){
  const cases=[];
  try{ const input='Margarita\r\nOld Fashioned\n\n Martini \r\n'; const lines=splitLines(input); const expected=['Margarita','Old Fashioned','Martini']; cases.push({name:'splitLines()',passed:JSON.stringify(lines)===JSON.stringify(expected)});}catch(e){ cases.push({name:'splitLines() threw',passed:false,details:String(e)}); }
  try{
    const rows=[{A:'x',B:'y'},{A:'1,2',B:'He said "Hi"'}];
    const csv=toCSV(rows);
    const expected=['A,B','"x","y"','"1,2","He said ""Hi"""'].join('\n');
    cases.push({name:'toCSV()',passed:csv===expected});
  }catch(e){ cases.push({name:'toCSV() threw',passed:false,details:String(e)}); }
  try{
    const r=composeRecipe({theme:'Summer',holiday:'None',flavors:['Citrusy'],spirits:['Any'],allowCocktails:true,allowMocktails:true,tier:'Regular'});
    const keys=['name','tier','isMocktail','base','technique','glass','garnish','ingredients','spec','method','description','notes'];
    const hasAll=keys.every(k=>Object.prototype.hasOwnProperty.call(r,k));
    const descOk=typeof r.description==='string' && r.description.length>25;
    cases.push({name:'composeRecipe() + description',passed:hasAll && Array.isArray(r.spec) && r.spec.length>=3 && descOk});
  }catch(e){ cases.push({name:'composeRecipe() threw',passed:false,details:String(e)}); }
  try{
    const tips=elevationTips('Margarita'); const hasMezcal=tips.some(t=>/mezcal/i.test(t.tip));
    cases.push({name:'elevationTips() Margarita contains mezcal split tip',passed:hasMezcal});
  }catch(e){ cases.push({name:'elevationTips() threw',passed:false,details:String(e)}); }
  try{
    const ok=[Card,Label,Select,Chip,Toggle,Num,GradButton,GhostButton,TierBadge].every(fn=>typeof fn==='function');
    cases.push({name:'UI primitives exist',passed:ok});
  }catch(e){ cases.push({name:'UI primitives exist check threw',passed:false,details:String(e)}); }
  return cases;
}
