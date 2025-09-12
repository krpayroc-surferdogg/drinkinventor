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

function rand(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function sample(arr, n) { const copy=[...arr], out=[]; for (let i=0;i<n && copy.length;i++) out.push(copy.splice(Math.floor(Math.random()*copy.length),1)[0]); return out; }
function rng(seed=1957){ let t=seed>>>0; return ()=> (t=(t+0x6D2B79F5)|0, ((t^(t>>>15))*(1|t))>>>0)/4294967296; }
function titleize(words){ return words.map(w=>w[0].toUpperCase()+w.slice(1)).join(" "); }
function splitLines(text){ if(!text) return []; return text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean); }

// ✅ Fixed toCSV
function toCSV(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","), // header row
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")), // data rows
  ];
  return lines.join("\n");
}

const OPENERS = ["Server tip:","Guest-friendly pitch:","Quick sell:","Recommendation:"];
const MOUTHEELS = { Citrusy:["bright","zesty","fresh-squeezed"], Fruity:["juicy","ripe","tropical"], Herbal:["herbal","garden-fresh","botanical"], Spicy:["peppery","spiced","lively"], Smoky:["smoky","embers","campfire-kissed"], Bitter:["bitter-sweet","aperitivo-style","grown-up"], Sweet:["softly sweet","rounded","dessert-leaning"], Sour:["tart","snappy","mouthwatering"], Floral:["floral","perfumed","blooming"], Creamy:["silky","creamy","lush"] };
const PAYOFFS = ["pairs great with appetizers","easy sipping before dinner","perfect for date night","great with something salty","refreshing and not too sweet","full-flavored without being heavy"];
const ACTIONS = ["ask if they prefer tequila or vodka","offer to add a salt rim","suggest a mocktail version","recommend a top-shelf spirit upgrade"];

function salesDescription({ tier, isMocktail, spirit, flavors, theme, holiday }){
  const tone = tier==='Elevated'?'refined': tier==='Budget'?'approachable':'balanced';
  const style = isMocktail ? 'zero-proof' : (spirit || 'spirit-forward');
  const f = (flavors&&flavors.length)? rand(flavors): null;
  const mouthfeel = f && MOUTHEELS[f] ? rand(MOUTHEELS[f]) : 'balanced';
  const context = holiday && holiday!=='None' ? `${holiday.toLowerCase()} vibes` : (theme && theme!=='None' ? `${theme.toLowerCase()} vibes` : 'any occasion');
  const opener = rand(OPENERS), payoff = rand(PAYOFFS), action = rand(ACTIONS);
  return `${opener} ${tone}, ${style}, and ${mouthfeel}; ${payoff}. ${isMocktail?'Zero alcohol':'Clean finish'} — ${context}. Pro move: ${action}.`;
}

// … (rest of your file unchanged: makeName, pickByTier, elevationTips, composeRecipe, App component, UI primitives, RetroBackdrop, icons, runTests)
