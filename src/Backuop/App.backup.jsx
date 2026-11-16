import { useEffect, useMemo, useRef, useState } from "react";

const BASE_RECIPE = [
  { name: "Vesi", amountKg: 13.8 },
  { name: "Paranne", amountKg: 0.4 },
  { name: "Öljy", amountKg: 1.2 },
  { name: "Durum", amountKg: 11 },
  { name: "Hiiva", amountKg: 0.3 },
  { name: "Rustica", amountKg: 21 },
  { name: "Suola", amountKg: 0.35 },
  { name: "Sokeri", amountKg: 2.3 },
];
const PIZZA_SIZES = [
  { name: "XS", weightG: 100 },
  { name: "S", weightG: 220 },
  { name: "M", weightG: 360 },
  { name: "L", weightG: 540 },
  { name: "Thin Crispy", weightG: 200 },
  { name: "Deep Dish", weightG: 250 },
];
const THEMES = {
  Coffee: { bg: "#241d19", card: "#362a23", input: "#2b221d", border: "#58463a", text: "#f6eadc", muted: "#bba899", accent: "#e4b477", onAccent: "#241d19" },
  Pine: { bg: "#14241d", card: "#24382c", input: "#1a2b22", border: "#3c5846", text: "#f0f4e8", muted: "#b2c5b3", accent: "#b1d19b", onAccent: "#14241d" },
  Midnight: { bg: "#141c2f", card: "#232e46", input: "#19243a", border: "#3c4b66", text: "#edf3ff", muted: "#b1c0d9", accent: "#a0c3fa", onAccent: "#141c2f" },
  Honey: { bg: "#292015", card: "#3c2d1d", input: "#302416", border: "#59432b", text: "#fff2d6", muted: "#d5b98b", accent: "#f0bd61", onAccent: "#292015" },
  Olive: { bg: "#272b1f", card: "#373e2c", input: "#2b3223", border: "#505b3c", text: "#f2f0df", muted: "#c1c8a3", accent: "#c6ce83", onAccent: "#272b1f" },
  Terracotta: { bg: "#30201e", card: "#472d29", input: "#382522", border: "#654039", text: "#f9eae1", muted: "#d3aca1", accent: "#e6a080", onAccent: "#30201e" },
  Slate: { bg: "#20282b", card: "#2e393d", input: "#253034", border: "#465359", text: "#f0f4f2", muted: "#b0bec1", accent: "#a1c6c3", onAccent: "#20282b" },
  Lavender: { bg: "#272335", card: "#383247", input: "#2e293b", border: "#524b64", text: "#f5f0fa", muted: "#c4b6d3", accent: "#c9afe9", onAccent: "#272335" },
  Cream: { bg: "#f5f0e6", card: "#fffdf8", input: "#f5f0e6", border: "#b5a796", text: "#241b15", muted: "#5d5044", accent: "#ae764d", onAccent: "#ffffff" },
  Sage: { bg: "#e8ede5", card: "#f9fbf7", input: "#edf3e9", border: "#9dad9c", text: "#172b20", muted: "#465c4d", accent: "#62896e", onAccent: "#ffffff" },
};
const DEFAULT_SETTINGS = { layout: "classic", theme: "Coffee", font: "modern", fontSize: 100, textColor: "default", remember: true, keepAwake: false };
const FONT_FAMILIES = { modern: 'system-ui, -apple-system, sans-serif', rounded: '"Trebuchet MS", system-ui, sans-serif', serif: 'Georgia, "Times New Roman", serif', mono: 'Consolas, "Courier New", monospace' };
const BASE_TOTAL = BASE_RECIPE.reduce((sum, ingredient) => sum + ingredient.amountKg, 0);
const formatUnit = (kg) => (kg < 1 ? `${Math.round(kg * 1000)} g` : `${kg.toFixed(2)} kg`);
const kgToGrams = (kg) => Math.max(0, Math.round(kg * 1000));
const gramsToKg = (g) => (g / 1000).toFixed(2);
const readSettings = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("doughplanner-appearance") || "null");
    const appearance = saved && saved.remember !== false ? { ...DEFAULT_SETTINGS, ...saved } : { ...DEFAULT_SETTINGS };
    return { ...appearance, keepAwake: localStorage.getItem("doughplanner-keep-awake") === "true" };
  } catch { return DEFAULT_SETTINGS; }
};

const EMPTY_PIZZAS = Object.fromEntries(PIZZA_SIZES.map((p) => [p.name, ""]));
const EMPTY_DOUGH = { desiredKg: "", pizzaCounts: EMPTY_PIZZAS, batches: [""], done: {}, expanded: {} };
const readDough = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("doughplanner-dough-v1") || "null");
    if (!saved || typeof saved !== "object") return { ...EMPTY_DOUGH, restore: null };
    const valid = (v) => typeof v === "string" && (v === "" || (Number.isFinite(Number(v)) && Number(v) >= 0));
    const normalize = (data) => {
      if (!data || !valid(data.desiredKg)) return null;
      return {
        desiredKg: data.desiredKg,
        pizzaCounts: Object.fromEntries(PIZZA_SIZES.map((p) => [p.name, valid(data.pizzaCounts?.[p.name]) ? data.pizzaCounts[p.name] : ""])),
        batches: Array.isArray(data.batches) && data.batches.length >= 1 && data.batches.length <= 5 && data.batches.every(valid) ? data.batches : [""],
        done: data.done && typeof data.done === "object" ? data.done : {},
        expanded: data.expanded && typeof data.expanded === "object" ? data.expanded : {},
      };
    };
    return { ...(normalize(saved) || EMPTY_DOUGH), restore: normalize(saved.restore) };
  } catch { return { ...EMPTY_DOUGH, restore: null }; }
};


// Imported from photographed kitchen recipe sheets. Review handwritten/obscured details before production.
const INITIAL_RECIPES = [
  {id:"mustikka-creme-caramel",name:"Mustikka crème caramel",section:"current",year:null,yieldUnit:"g",yieldAmount:"1351",ingredients:[["Maito",300],["Kerma",300],["Vaniljatanko",10],["Mustikka",120],["Sokeri",150],["Kananmuna",180],["Keltuainen",110],["Sokeri",140],["Vesi",40],["Suola",1]].map(([name,grams])=>({name,grams})),instructions:"Lämmitä maito, kerma, vanilja, mustikka ja sokeri melkein kiehuvaksi. Soseuta ja anna maustua.\n\nVatkaa keltuaiset ja munat. Sekoita munien rakenne rikki. Kaada se munien päälle koko ajan sekoittaen.\n\nKaramelli: keitä sokeri ja vesi ilman sekoittamista, kunnes väri on syvän ruskea. Lisää suola.\n\nLaita vuoan pohjalle 10 g karamellia ja jäähdytä hetki. Lisää vanukasmassaa 80 g päälle ja kypsennä höyryssä 82 °C noin 45 min.",notes:"Photographed as Mustikkavanukas; confirmed recipe name Mustikka crème caramel. Verify preparation details against the original sheet. Printed amounts sum to 1351 g."},
  {id:"kaakaokoristeet",name:"Kaakaokoristeet",section:"current",year:null,yieldUnit:"g",yieldAmount:"",ingredients:[],instructions:"",notes:"Awaiting original recipe photo."},
  {id:"mantelimuffinssi",name:"Mantelimuffinssi",section:"current",year:null,yieldUnit:"g",yieldAmount:"",ingredients:[ ["Mantelijauhe",240],["Mantelivoi",70],["Kananmuna",240],["Tomusokeri",200],["Ruskistettu voi",200],["Leivinjauhe",6],["Maissitärkkelys",28],["Suola",5],["Valkuainen",80],["Vaniljatanko",5] ].map(([name,grams])=>({name,grams})),instructions:"Lisää ruskeistettu voi ja mantelijauhe. Anna jäähtyä hieman. Mittaa muut raaka-aineet kattilaan. Vatkaa ja lämmitä kevyesti, kunnes ne ovat hieman ohentuneet. Lisää kuivat aineet ja sekoita keskenään. Erottele kaksi valkuaista erilleen ja lisää 4 kpl kokonaisia munia.\n\nVatkaa kananmunat kevyesti, kunnes ne ovat tasaisesti sekoittuneet. Lisää jäähtynyt voi ohuena nauhana kananmunien sekaan. Sekoita kaikki raaka-aineet keskenään.\n\nMittaa 50 g jokaiseen muffinssivuokaan ja paista 150 asteessa noin 18 minuuttia. Kokeile kypsyys hammastikulla ja lisää aikaa tarvittaessa.",notes:"Printed sheet: 1,074 g total. Some handwritten/printed details should be checked."},
  {id:"mascarponekuorrute",name:"Mascarponekuorrute",section:"current",year:null,yieldUnit:"g",yieldAmount:"530",ingredients:[["Mascarpone",250],["Kerma",200],["Tomusokeri",75],["Vanilja",5]].map(([name,grams])=>({name,grams})),instructions:"Sekoita kaikki ainekset ja vatkaa, kunnes muodostuu jämäkkä vaahto.",notes:"Source says 'Mix everything and whip until stiff peaks'."},
  {id:"ruisleipa",name:"Ruisleipä",section:"other",year:null,yieldUnit:"g",yieldAmount:"2055",ingredients:[["Ruisjuuri",200],["Ruisjauho",850],["Vesi",900],["Tumma siirappi",50],["Suola",30],["Hiiva",25]].map(([name,grams])=>({name,grams})),instructions:"Ensin sekoita raski: 200 g juurta, 750 g huoneenlämpöistä vettä ja 750 g ruisjauhoja. Anna olla yön yli lämpimässä paikassa noin 15 tuntia. Tee tämä edellisenä päivänä.\n\nValmis raski on luonut pieniä kuplia pinnalle ja maistuu todella happamalle ja äkäiselle. Sekoita taikina loppuun, jaa ja leivo.\n\nKäsinkirjoitettu paisto-ohje: 200 °C 20 min, sitten 150 °C 15 min.",notes:"REVIEW: The preferment instructions use 750 g water and 750 g rye flour; the full recipe lists 900 g water and 850 g rye flour. Check mixing stages against the photo."},
  {id:"gluteeniton-pizzataikina",name:"Gluteeniton pizzataikina",section:"other",year:null,yieldUnit:"g",yieldAmount:"1015",ingredients:[["Gluteeniton jauho",500],["Vesi",440],["Hiiva",20],["Suola",20],["Oliiviöljy",15],["Sokeri",20]].map(([name,grams])=>({name,grams})),instructions:"Sekoita kaikki paitsi öljy. Vaivaa taikinaa 1 minuutti, lisää öljy ja jatka vaivaamista 10 minuuttia.",notes:"Source notes gluten-free pizza dough is about 15% larger than normal. Size examples: XS 120 g, S 250 g, M 400 g, L 630 g, Thin crispy 220 g."},
  {id:"perunarieska",name:"Perunarieska",section:"other",year:null,yieldUnit:"g",yieldAmount:"1272",ingredients:[["Muusi",1000],["Kerma",200],["Pottujauho",40],["Gluteeniton jauho",20],["Suola",10],["Kananmuna",133]].map(([name,grams])=>({name,grams})),instructions:"Sekoita muusi ja kerma, jos se on tosi paksua. Sekoita kaikki ainekset käsin. Jaa taikinasta 40 g leipiä.\n\nPaista 250 °C noin 8 min.",notes:"REVIEW: Printed source total is 1,272 g but listed ingredient quantities appear to total 1,403 g. Verify the egg amount and original sheet."}
];
const readRecipes = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("doughplanner-recipes-v1") || "null");
    if (!Array.isArray(saved)) return INITIAL_RECIPES.map(normalizeRecipe);
    const duplicate = saved.find(r => r.id === "mustikkavanukas");
    const current = saved.find(r => r.id === "mustikka-creme-caramel");
    const source = INITIAL_RECIPES.find(r => r.id === "mustikka-creme-caramel");
    // Keep existing edits to the named recipe when present; otherwise migrate the imported photo data.
    const hasEditedContent = current && (current.ingredients?.length > 0 || (current.instructions || "").trim());
    const combined = hasEditedContent ? { ...current, name: "Mustikka crème caramel", section: "current", year: null }
      : { ...source, ...(duplicate ? { ingredients: duplicate.ingredients, instructions: duplicate.instructions, yieldAmount: duplicate.yieldAmount, yieldUnit: duplicate.yieldUnit, notes: duplicate.notes } : {}) };
    const withoutDuplicate = saved.filter(r => r.id !== "mustikkavanukas" && r.id !== "mustikka-creme-caramel");
    return [combined, ...withoutDuplicate].map(normalizeRecipe);
  } catch { return INITIAL_RECIPES.map(normalizeRecipe); }
};
const uniqueId = () => `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const normalizeRecipe = r => ({...r,section:r.section==="other"?"current":r.section,
  ingredients:(r.ingredients||[]).map(i=>({...i,id:i.id||uniqueId(),spacer:!!(i.spacer||i.groupHeader),groupHeader:false})),
  prepGroups:(Array.isArray(r.prepGroups)?r.prepGroups:[{id:"prep-original",title:"Preparation",text:r.instructions||"",width:100,height:180}]).map(g=>({...g,id:g.id||uniqueId()}))});
const moveItem = (list,fromId,toId) => {
  const from=list.findIndex(x=>x.id===fromId),to=list.findIndex(x=>x.id===toId);
  if(from<0||to<0||from===to)return list;
  const copy=[...list];const [item]=copy.splice(from,1);copy.splice(to,0,item);return copy;
};
const newPrepGroup = () => ({id:`prep-${Date.now()}-${Math.random().toString(36).slice(2)}`,title:"New section",text:"",width:100,height:180});
const fmtGrams = n => Math.round(Number(n) || 0).toLocaleString("fi-FI", {maximumFractionDigits:0});
const fmtEggs = n => Number(n.toFixed(2)).toLocaleString("fi-FI", {maximumFractionDigits:2});
// Only infer egg counts when the original grams are an exact multiple of 60 g.
// The count can be overridden per ingredient in Edit mode.
const eggCount = ing => {
  if (ing.eggPcs !== undefined && ing.eggPcs !== "") return Math.max(0, Number(ing.eggPcs) || 0);
  if (!/^kananmun(?:a|at)$/i.test((ing.name || "").trim())) return null;
  const grams = Number(ing.grams);
  return grams > 0 && grams % 60 === 0 ? grams / 60 : null;
};

export default function App() {
  const [settings, setSettings] = useState(readSettings);
  const [activeTab,setActiveTab]=useState("dough");
  const [recipes,setRecipes]=useState(readRecipes);
  const [selectedRecipeId,setSelectedRecipeId]=useState(null);
  const [editingRecipe,setEditingRecipe]=useState(false);
  const [archiveOpen,setArchiveOpen]=useState(false);
  const [archiveYear,setArchiveYear]=useState("all");
  const [recipeTarget,setRecipeTarget]=useState("");
  const [recipeTargetPcs,setRecipeTargetPcs]=useState("");
  const [recipeScaleMode,setRecipeScaleMode]=useState("weight");
  const [recipeQuery,setRecipeQuery]=useState("");
  const [dragging,setDragging]=useState(null);
  const dragRef=useRef(null);
  const recipesRef=useRef(recipes);
  recipesRef.current=recipes;
  const stopDrag=()=>{dragRef.current=null;setDragging(null);};
  const beginDrag=(event,kind,id)=>{
    if(event.button!==undefined&&event.button!==0)return;
    event.preventDefault();
    const startX=event.clientX,startY=event.clientY;
    const recipeId=selectedRecipeId;
    const move=e=>{
      if(!dragRef.current)return;
      if(Math.abs(e.clientY-startY)+Math.abs(e.clientX-startX)<6&&!dragRef.current.active)return;
      dragRef.current.active=true;
      const target=document.elementFromPoint(e.clientX,e.clientY)?.closest(`[data-sort-kind="${kind}"]`);
      const targetId=target?.getAttribute("data-sort-id");
      if(!targetId||targetId===id)return;
      setRecipes(old=>old.map(r=>r.id!==recipeId?r:{...r,[kind]:moveItem(r[kind],id,targetId)}));
    };
    const end=()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",end);window.removeEventListener("pointercancel",end);stopDrag();};
    dragRef.current={active:false};setDragging({kind,id});
    window.addEventListener("pointermove",move);window.addEventListener("pointerup",end);window.addEventListener("pointercancel",end);
  };
  const beginResize=(event,id)=>{
    if(event.button!==undefined&&event.button!==0)return;
    event.preventDefault();
    const recipeId=selectedRecipeId,group=selectedRecipe?.prepGroups?.find(g=>g.id===id);
    if(!group)return;
    const startX=event.clientX,startY=event.clientY,initialHeight=group.height||180;
    const parent=event.currentTarget.closest(".dp-prep-grid");
    const gridWidth=parent?.getBoundingClientRect().width||500;
    const initialWidth=group.width||100;
    const move=e=>{
      const height=Math.max(100,Math.min(900,Math.round(initialHeight+e.clientY-startY)));
      const widthPct=initialWidth+((e.clientX-startX)/gridWidth)*100;
      const width=widthPct<63?50:widthPct<88?75:100;
      setRecipes(old=>old.map(r=>r.id!==recipeId?r:{...r,prepGroups:r.prepGroups.map(g=>g.id===id?{...g,width,height}:g)}));
    };
    const end=()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",end);window.removeEventListener("pointercancel",end);};
    window.addEventListener("pointermove",move);window.addEventListener("pointerup",end);window.addEventListener("pointercancel",end);
  };

  const selectedRecipe=recipes.find(r=>r.id===selectedRecipeId);
  useEffect(()=>{try{localStorage.setItem("doughplanner-recipes-v1",JSON.stringify(recipes));}catch{}},[recipes]);
  const updateRecipe=patch=>setRecipes(old=>old.map(r=>r.id===selectedRecipeId?{...r,...patch}:r));
  const openRecipe=id=>{setSelectedRecipeId(id);setEditingRecipe(false);const r=recipes.find(x=>x.id===id);setRecipeTarget(String(r?.yieldAmount||""));setRecipeTargetPcs(String(r?.originalPcs||""));setRecipeScaleMode("weight");};
  const addRecipe=()=>{const id="recipe-"+Date.now();setRecipes(old=>[...old,{id,name:"New recipe",section:"current",year:null,yieldUnit:"g",yieldAmount:"",ingredients:[],instructions:"",prepGroups:[newPrepGroup()],notes:""}]);setSelectedRecipeId(id);setRecipeTarget("");setRecipeTargetPcs("");setRecipeScaleMode("weight");setEditingRecipe(true);};
  const originalPcs = Number(selectedRecipe?.originalPcs) || 0;
  const originalWeight = Number(selectedRecipe?.yieldAmount) || 0;
  const recipeFactor = recipeScaleMode === "pcs" && originalPcs > 0 && Number(recipeTargetPcs) > 0
    ? Number(recipeTargetPcs) / originalPcs
    : originalWeight > 0 && Number(recipeTarget) > 0 ? Number(recipeTarget) / originalWeight : 1;
  const displayedTargetWeight = recipeScaleMode === "pcs" && originalPcs > 0 && originalWeight > 0 && Number(recipeTargetPcs) > 0
    ? String(Number((originalWeight * recipeFactor).toFixed(2))) : recipeTarget;
  const displayedTargetPcs = recipeScaleMode === "weight" && originalPcs > 0 && originalWeight > 0 && Number(recipeTarget) > 0
    ? String(Number((originalPcs * recipeFactor).toFixed(2))) : recipeTargetPcs;
  const recipeYears=[...new Set(recipes.filter(r=>r.section==="archive").map(r=>String(r.year)))].sort((a,b)=>Number(b)-Number(a));

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [awakeActive, setAwakeActive] = useState(false);
  const [awakeMessage, setAwakeMessage] = useState("");
  const [morningCollapsed, setMorningCollapsed] = useState(false);
  const [initialDough] = useState(readDough);
  const [desiredKg, setDesiredKg] = useState(initialDough.desiredKg);
  const [pizzaCounts, setPizzaCounts] = useState(initialDough.pizzaCounts);
  const [batches, setBatches] = useState(initialDough.batches);
  const [expanded, setExpanded] = useState(initialDough.expanded);
  const [done, setDone] = useState(initialDough.done);
  const [restoreSnapshot, setRestoreSnapshot] = useState(initialDough.restore);
  const snapshot = () => ({ desiredKg, pizzaCounts: { ...pizzaCounts }, batches: [...batches], done: { ...done }, expanded: { ...expanded } });
  const zeroDough = () => {
    if (!(Number(desiredKg) > 0 || Object.values(pizzaCounts).some((v) => Number(v) > 0))) return;
    setRestoreSnapshot(snapshot());
    setDesiredKg("0"); setPizzaCounts({ ...EMPTY_PIZZAS });
    setBatches(Array(batches.length).fill("0.00")); setDone({}); setExpanded({});
  };
  const restoreDough = () => {
    if (!restoreSnapshot) return;
    setDesiredKg(restoreSnapshot.desiredKg); setPizzaCounts(restoreSnapshot.pizzaCounts);
    setBatches(restoreSnapshot.batches); setDone(restoreSnapshot.done); setExpanded(restoreSnapshot.expanded);
    setRestoreSnapshot(null);
  };

  const updateSettings = (patch) => setSettings((old) => ({ ...old, ...patch }));
  useEffect(() => {
    try {
      if (settings.remember) localStorage.setItem("doughplanner-appearance", JSON.stringify(settings));
      else localStorage.removeItem("doughplanner-appearance");
    } catch { /* Storage may be unavailable in private browsing. */ }
  }, [settings]);

  useEffect(() => {
    try { localStorage.setItem("doughplanner-keep-awake", String(settings.keepAwake)); }
    catch { /* Storage may be unavailable. */ }
  }, [settings.keepAwake]);

  useEffect(() => {
    try {
      localStorage.setItem("doughplanner-dough-v1", JSON.stringify({ desiredKg, pizzaCounts, batches, done, expanded, restore: restoreSnapshot }));
    } catch { /* Local storage may be unavailable. */ }
  }, [desiredKg, pizzaCounts, batches, done, expanded, restoreSnapshot]);

  useEffect(() => {
    if (!settings.keepAwake) { setAwakeActive(false); setAwakeMessage(""); return; }
    let lock = null;
    let disposed = false;
    const acquire = async () => {
      if (!("wakeLock" in navigator)) { setAwakeMessage("Screen wake lock is not supported by this browser."); return; }
      if (document.visibilityState !== "visible") return;
      try {
        lock = await navigator.wakeLock.request("screen");
        if (disposed) { await lock.release(); return; }
        setAwakeActive(true);
        setAwakeMessage("");
        lock.addEventListener("release", () => { if (!disposed) setAwakeActive(false); });
      } catch { if (!disposed) { setAwakeActive(false); setAwakeMessage("Screen wake lock could not be activated on this device."); } }
    };
    const visibilityChanged = () => { if (document.visibilityState === "visible") acquire(); };
    acquire();
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => { disposed = true; document.removeEventListener("visibilitychange", visibilityChanged); if (lock) lock.release().catch(() => {}); };
  }, [settings.keepAwake]);

  const theme = THEMES[settings.theme] || THEMES.Coffee;
  const lightTheme = ["Cream", "Sage"].includes(settings.theme);
  // Light palettes must not inherit pale text choices intended for dark backgrounds.
  const text = lightTheme ? theme.text : settings.textColor === "warm" ? "#f5e8d6" : settings.textColor === "bright" ? "#ffffff" : settings.textColor === "soft" ? "#bfc6c4" : theme.text;
  const cssVars = { "--dp-bg": theme.bg, "--dp-card": theme.card, "--dp-input": theme.input, "--dp-border": theme.border, "--dp-text": text, "--dp-muted": theme.muted, "--dp-accent": theme.accent, "--dp-on-accent": theme.onAccent, "--dp-font": FONT_FAMILIES[settings.font] || FONT_FAMILIES.modern, "--dp-size": `${settings.fontSize}%` };
  const pizzaTotalKg = useMemo(() => PIZZA_SIZES.reduce((sum, p) => sum + (Math.max(0, Number(pizzaCounts[p.name])) || 0) * p.weightG, 0) / 1000, [pizzaCounts]);
  const scaled = useMemo(() => {
    const total = Number(desiredKg);
    return Number.isFinite(total) && total > 0 ? BASE_RECIPE.map((ingredient) => ({ ...ingredient, amountKg: ingredient.amountKg * total / BASE_TOTAL })) : BASE_RECIPE.map((ingredient) => ({ ...ingredient, amountKg: 0 }));
  }, [desiredKg]);
  const scaledTotalKg = scaled.reduce((sum, ingredient) => sum + ingredient.amountKg, 0);

  const scaleRecipe = (value) => {
    const total = Number(value);
    if (!Number.isFinite(total) || total < 0) return;
    setDesiredKg(String(total));
    const grams = kgToGrams(total);
    const even = Math.floor(grams / batches.length);
    setBatches(Array.from({ length: batches.length }, (_, i) => gramsToKg(even + (i === batches.length - 1 ? grams - even * batches.length : 0))));
    setDone({});
  };
  const usePizzaTotal = () => {
    if (pizzaTotalKg <= 0) return;
    scaleRecipe(pizzaTotalKg);
  };
  const setBatchCount = (n) => {
    const totalGrams = kgToGrams(Number(desiredKg) || 0);
    const even = Math.floor(totalGrams / n);
    setBatches(Array.from({ length: n }, (_, i) => gramsToKg(even + (i === n - 1 ? totalGrams - even * n : 0))));
    setDone({}); setExpanded({});
  };
  const adjustBatch = (index, newValue) => {
    const totalGrams = kgToGrams(Number(desiredKg) || 0);
    if (totalGrams <= 0 || batches.length < 2) return;
    const weights = batches.map((v) => kgToGrams(Number(v) || 0));
    const target = Math.min(totalGrams, Math.max(0, Math.round(newValue)));
    const otherIndices = weights.map((_, i) => i).filter((i) => i !== index);
    const otherTotal = totalGrams - target;
    const otherOldTotal = otherIndices.reduce((sum, i) => sum + weights[i], 0);
    const updated = Array(weights.length).fill(0);
    updated[index] = target;
    let remaining = otherTotal;
    otherIndices.forEach((i, j) => {
      const weight = j === otherIndices.length - 1 ? remaining : otherOldTotal > 0 ? Math.min(remaining, Math.round(otherTotal * weights[i] / otherOldTotal)) : Math.floor(otherTotal / otherIndices.length);
      updated[i] = weight;
      remaining -= weight;
    });
    setBatches(updated.map(gramsToKg));
  };
  const ingredientRows = (items) => items.map((ingredient) => <div key={ingredient.name} className="dp-ingredient"><span>{ingredient.name}</span><strong>{formatUnit(ingredient.amountKg)}</strong></div>);

  return (
    <div className="dp-root" style={cssVars}>
      <style>{`
        .dp-root{min-height:100vh;background:var(--dp-bg);color:var(--dp-text);font-family:var(--dp-font);font-size:var(--dp-size);padding:20px 12px 60px}
        .dp-root *{box-sizing:border-box}.dp-shell{max-width:1020px;margin:auto}.dp-header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px}
        .dp-title{font-size:1.7em;font-weight:800;letter-spacing:-.035em;color:var(--dp-accent)}.dp-subtitle,.dp-muted{color:var(--dp-muted)}.dp-subtitle{font-size:.78em}
        .dp-panel{background:var(--dp-card);border:1px solid var(--dp-border);border-radius:15px;padding:18px;min-width:0}
        .dp-panel-title{font-size:1.12em;font-weight:750;margin:0 0 13px}.dp-button{background:var(--dp-accent);color:var(--dp-on-accent);border:0;border-radius:8px;padding:10px 13px;font-weight:750;cursor:pointer;min-height:40px}
        .dp-button:disabled{opacity:.45;cursor:not-allowed}.dp-ghost{background:var(--dp-input);color:var(--dp-text);border:1px solid var(--dp-border);border-radius:8px;padding:9px 12px;cursor:pointer;min-height:40px}
        .dp-input,.dp-select{background:var(--dp-input);color:var(--dp-text);border:1px solid var(--dp-border);border-radius:8px;padding:9px 10px;min-width:0;max-width:100%;font:inherit}
        .dp-input:focus-visible,.dp-select:focus-visible,.dp-button:focus-visible,.dp-ghost:focus-visible{outline:2px solid var(--dp-accent);outline-offset:2px}
        .dp-input[type=number]{font-variant-numeric:tabular-nums}.dp-root input[type=range],.dp-root input[type=checkbox]{accent-color:var(--dp-accent)}
        .dp-morning{display:grid;grid-template-columns:1fr;gap:15px;margin-bottom:15px}.dp-compact .dp-morning{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
        .dp-pizza-row{display:grid;grid-template-columns:minmax(0,1fr) 80px;gap:10px;align-items:center;margin-bottom:8px}.dp-pizza-row .dp-input{width:100%;text-align:center}
        .dp-compact .dp-pizza-row{grid-template-columns:minmax(0,1fr) 58px;gap:5px}.dp-compact .dp-pizza-row .dp-input{padding:7px 3px}.dp-compact .dp-panel{padding:12px}.dp-compact .dp-panel-title{font-size:1em}
        .dp-ingredient{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid var(--dp-border);font-size:.88em}.dp-ingredient:last-child{border-bottom:0}.dp-ingredient strong{color:var(--dp-accent);white-space:nowrap;font-variant-numeric:tabular-nums}.dp-egg-amount{display:flex;align-items:baseline;gap:8px;white-space:nowrap;font-variant-numeric:tabular-nums}.dp-egg-grams{color:var(--dp-muted);opacity:.7;font-size:.82em}
        .dp-compact .dp-morning .dp-ingredient{font-size:.76em}.dp-pizza-total{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;flex-wrap:wrap}.dp-pizza-total strong{color:var(--dp-accent);font-size:1.15em}
        .dp-compact .dp-button,.dp-compact .dp-ghost{padding-top:5px;padding-bottom:5px;min-height:32px;line-height:1.2}.dp-compact .dp-pizza-total .dp-button{width:100%}.dp-scale-row{display:flex;gap:8px;margin-bottom:12px}.dp-scale-row .dp-input{flex:1;width:0}.dp-compact .dp-scale-row{flex-wrap:wrap}.dp-compact .dp-scale-row .dp-button{width:100%}
        .dp-divider-header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}.dp-batch{background:var(--dp-input);border:1px solid var(--dp-border);border-radius:11px;padding:13px;margin-top:10px}
        .dp-batch-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.dp-batch-label{display:flex;align-items:center;gap:10px;font-weight:700}.dp-batch-label input{width:19px;height:19px}
        .dp-batch-controls{display:flex;align-items:center;gap:8px}.dp-batch-controls .dp-input{width:100px;text-align:center}.dp-batch-details{background:var(--dp-card);padding:12px;border-radius:9px;margin-top:12px}.dp-batch-details .dp-ingredient{font-size:.85em}
        .dp-done .dp-batch-label span{text-decoration:line-through;opacity:.55}.dp-batch-slider{width:100%;margin-top:12px;min-height:24px;cursor:pointer}
        .dp-tabs{display:flex;gap:8px;margin-bottom:15px}.dp-tabs button{flex:1}.dp-recipe-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.dp-recipe-heading h2{font-size:1.35em;margin:0}.dp-recipe-sections{display:flex;gap:8px;margin-bottom:14px}.dp-recipe-sections button{flex:1}.dp-recipe-list-item{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;text-align:left;background:transparent;color:var(--dp-text);border:0;border-bottom:1px solid var(--dp-border);padding:15px 4px;font:inherit;cursor:pointer}.dp-recipe-list-item:last-child{border-bottom:0}.dp-recipe-list-item span:last-child{font-size:1.25em;color:var(--dp-muted)}.dp-recipe-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.dp-recipe-editor{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.dp-recipe-edit-row{display:grid;grid-template-columns:minmax(0,1fr) 95px 36px;gap:6px;margin-bottom:7px}.dp-recipe-edit-row .dp-ghost{padding:4px}.dp-recipe-textarea{width:100%;min-height:160px;resize:vertical}.dp-recipe-instructions{white-space:pre-wrap;line-height:1.65;margin:0}.dp-recipe-page .dp-panel-title{margin-bottom:12px}.dp-drag-handle{touch-action:none;user-select:none;cursor:grab;display:flex;align-items:center;justify-content:center;min-width:34px;min-height:40px;background:var(--dp-card);border:1px solid var(--dp-border);border-radius:8px;color:var(--dp-muted);font-size:1.15em}.dp-drag-handle:active{cursor:grabbing}.dp-sort-active{outline:2px dashed var(--dp-accent);outline-offset:2px}.dp-spacer{height:24px}.dp-spacer-editor{display:flex;align-items:center;gap:8px;height:36px}.dp-spacer-editor .dp-spacer-line{flex:1;border-top:1px dashed var(--dp-border)}.dp-prep-grid{display:flex;flex-wrap:wrap;align-items:flex-start;gap:12px}.dp-prep-grid>.dp-prep-group{margin-bottom:0;flex:0 0 auto}.dp-prep-grid>.dp-prep-half{width:calc((100% - 12px)/2)!important}.dp-prep-grid>.dp-prep-threequarter{width:75%!important}.dp-prep-grid>.dp-prep-full{width:100%!important}.dp-prep-dragbar{display:flex;align-items:center;gap:8px;margin-bottom:9px}.dp-prep-dragbar .dp-drag-handle{flex:1;justify-content:flex-start;padding-left:12px}.dp-resize-grip{touch-action:none;user-select:none;cursor:nwse-resize;align-self:flex-end;padding:10px;border:1px solid var(--dp-border);border-radius:8px;background:var(--dp-card);color:var(--dp-muted)}@media(max-width:520px){.dp-prep-grid>.dp-prep-half{width:calc((100% - 12px)/2)!important}.dp-prep-grid>.dp-prep-threequarter{width:100%!important}.dp-prep-group{padding:8px!important}.dp-prep-grid .dp-input{padding:7px 5px}}.dp-recipe-group-title{font-size:1em;color:var(--dp-accent);border-bottom:2px solid var(--dp-border);padding-bottom:7px;margin:18px 0 8px}.dp-recipe-action-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.dp-prep-group{max-width:100%;min-width:0;border:1px solid var(--dp-border);border-radius:10px;padding:12px;margin-bottom:12px;background:var(--dp-input)}.dp-prep-controls{display:flex;gap:8px;align-items:end;margin-bottom:9px}.dp-prep-controls>.dp-input{flex:1;width:0}.dp-prep-controls>.dp-field{flex:1;min-width:0}.dp-notes-panel{border-left:4px solid var(--dp-accent)}
         .dp-scaling-original{display:flex;align-items:end;gap:12px;flex-wrap:wrap}.dp-original-pcs{display:inline-flex;align-items:center;gap:3px;color:var(--dp-muted);font-size:.86em;white-space:nowrap;min-height:42px}.dp-original-pcs input{width:55px;border:0;border-bottom:1px dashed var(--dp-border);background:transparent;color:var(--dp-muted);font:inherit;text-align:center;padding:4px 0;border-radius:0}.dp-original-pcs input:disabled{border-bottom-color:transparent;opacity:.85}.dp-original-pcs input:focus{outline:1px solid var(--dp-accent);border-radius:3px}.dp-original-pcs input::-webkit-inner-spin-button,.dp-original-pcs input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}.dp-original-pcs input[type=number]{-moz-appearance:textfield}
        .dp-morning-toolbar{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px}.dp-morning-actions{display:flex;gap:5px;align-items:center}.dp-mini{min-height:29px!important;padding:4px 9px!important;font-size:.78em;line-height:1.1}.dp-mini:disabled{opacity:.4}
        .dp-settings{margin-bottom:16px}.dp-settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.dp-field{display:flex;flex-direction:column;gap:6px;font-size:.9em}.dp-field .dp-select{width:100%}
        .dp-palettes{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin:12px 0 18px}.dp-palette{background:transparent;border:1px solid transparent;border-radius:9px;color:var(--dp-text);padding:5px;cursor:pointer;font-size:.75em}
        .dp-palette.selected{border-color:var(--dp-accent);background:var(--dp-input)}.dp-palette-swatch{height:34px;border-radius:6px;border:1px solid #8886;margin-bottom:5px;position:relative}.dp-palette-swatch:after{content:"";position:absolute;right:7px;top:8px;width:16px;height:16px;border-radius:50%;background:var(--swatch-accent)}
        .dp-setting-toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--dp-border);padding:14px 0}.dp-setting-toggle input{width:20px;height:20px}.dp-small{font-size:.8em}.dp-collapsed{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:15px}
        @media(max-width:480px){.dp-morning-toolbar{flex-wrap:nowrap}.dp-morning-actions{gap:3px}.dp-mini{padding:4px 6px!important;font-size:.72em}.dp-root{padding:12px 8px 50px}.dp-panel{padding:12px}.dp-compact .dp-panel{padding:8px}.dp-compact .dp-pizza-row{grid-template-columns:minmax(0,1fr) 39px;gap:3px}.dp-compact .dp-pizza-row .dp-input{padding:6px 1px;font-size:.8em}.dp-compact .dp-pizza-row label{font-size:.77em}.dp-compact .dp-morning .dp-ingredient{font-size:.68em}.dp-compact .dp-panel-title{font-size:.85em}.dp-compact .dp-pizza-total{font-size:.8em}.dp-batch-controls .dp-input{width:83px}.dp-settings-grid{gap:9px}.dp-palettes{gap:3px}.dp-palette{font-size:.65em;padding:3px}.dp-title{font-size:1.4em}}
      `}</style>
      <div className="dp-shell">
        <header className="dp-header"><div><h1 className="dp-title">Dough Planner</h1><div className="dp-subtitle">Pizza dough calculator</div></div><button className="dp-ghost" onClick={() => setSettingsOpen((v) => !v)} aria-expanded={settingsOpen} aria-label="Appearance and settings">⚙ Settings</button></header>

        {settingsOpen && <section className="dp-panel dp-settings" aria-label="Settings">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><h2 className="dp-panel-title">Appearance & Settings</h2><button className="dp-ghost" onClick={() => setSettingsOpen(false)}>Close</button></div>
          <div className="dp-small dp-muted">Colour palette</div>
          <div className="dp-palettes">{Object.entries(THEMES).map(([name, colors]) => <button key={name} type="button" className={`dp-palette ${settings.theme === name ? "selected" : ""}`} onClick={() => updateSettings({ theme: name })} aria-pressed={settings.theme === name}><div className="dp-palette-swatch" style={{ background: colors.bg, "--swatch-accent": colors.accent }} />{name}</button>)}</div>
          <div className="dp-settings-grid">
            <label className="dp-field">Layout<select className="dp-select" value={settings.layout} onChange={(e) => updateSettings({ layout: e.target.value })}><option value="classic">Classic</option><option value="compact">Compact</option></select></label>
            <label className="dp-field">Font family<select className="dp-select" value={settings.font} onChange={(e) => updateSettings({ font: e.target.value })}><option value="modern">Modern Sans</option><option value="rounded">Rounded</option><option value="serif">Editorial Serif</option><option value="mono">Monospace</option></select></label>
            <label className="dp-field">Text colour<select className="dp-select" value={settings.textColor} onChange={(e) => updateSettings({ textColor: e.target.value })}><option value="default">Theme default</option><option value="warm">Warm cream</option><option value="bright">Bright white</option><option value="soft">Soft grey</option></select></label>
            <label className="dp-field">Font size: {settings.fontSize}%<input type="range" min="85" max="135" step="5" value={settings.fontSize} onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })} /></label>
          </div>
          <label className="dp-setting-toggle"><span><strong>Remember appearance</strong><div className="dp-small dp-muted">Save the selected appearance on this device</div></span><input type="checkbox" checked={settings.remember} onChange={(e) => updateSettings({ remember: e.target.checked })} /></label>
          <label className="dp-setting-toggle"><span><strong>Keep screen awake</strong><div className="dp-small dp-muted">{awakeActive ? "Active while this page is visible" : awakeMessage || "Available on supported devices and browsers"}</div></span><input type="checkbox" checked={settings.keepAwake} onChange={(e) => updateSettings({ keepAwake: e.target.checked })} /></label>
          <button className="dp-ghost" onClick={() => setSettings((old) => ({ ...DEFAULT_SETTINGS, keepAwake: false }))}>Reset appearance</button>
        </section>}

        <nav className="dp-tabs" aria-label="Workspace tabs"><button className={activeTab==="dough"?"dp-button":"dp-ghost"} onClick={()=>setActiveTab("dough")}>Dough</button><button className={activeTab==="desserts"?"dp-button":"dp-ghost"} onClick={()=>setActiveTab("desserts")}>Recipes</button></nav>
        {activeTab==="dough" ? <main className={settings.layout === "compact" ? "dp-compact" : "dp-classic"}>
          <div className="dp-morning-toolbar"><strong className="dp-small">Morning setup</strong><div className="dp-morning-actions"><button className="dp-ghost dp-mini" onClick={zeroDough} disabled={!(Number(desiredKg) > 0 || Object.values(pizzaCounts).some((v) => Number(v) > 0))}>Zero</button><button className="dp-ghost dp-mini" onClick={restoreDough} disabled={!restoreSnapshot}>Restore</button><button className="dp-ghost dp-mini" onClick={() => setMorningCollapsed((v) => !v)}>{morningCollapsed ? "Expand ▾" : "Hide ▴"}</button></div></div>
          {!morningCollapsed && <>
            <div className="dp-morning">
              <section className="dp-panel"><h2 className="dp-panel-title">Pizza Calculator</h2>{PIZZA_SIZES.map((p) => <div key={p.name} className="dp-pizza-row"><label htmlFor={`pizza-${p.name}`}>{p.name} <span className="dp-muted">({p.weightG}g)</span></label><input id={`pizza-${p.name}`} type="number" min="0" step="1" className="dp-input" value={pizzaCounts[p.name]} onChange={(e) => setPizzaCounts((old) => ({ ...old, [p.name]: e.target.value }))} /></div>)}<div className="dp-pizza-total"><div><div className="dp-muted dp-small">Total dough required</div><strong>{pizzaTotalKg.toFixed(2)} kg</strong></div><button className="dp-button" onClick={usePizzaTotal} disabled={pizzaTotalKg <= 0}>Use for Scaling</button></div></section>
              <section className="dp-panel"><h2 className="dp-panel-title">Total Amount</h2><div className="dp-scale-row"><input type="number" min="0" step="0.01" placeholder="Amount in kg" aria-label="Total dough amount in kilograms" className="dp-input" value={desiredKg} onChange={(e) => setDesiredKg(e.target.value)} /><button className="dp-button" onClick={() => scaleRecipe(desiredKg)}>Scale</button></div>{ingredientRows(scaled)}</section>
            </div>
          </>}
          <section className="dp-panel"><div className="dp-divider-header"><div><h2 className="dp-panel-title" style={{ marginBottom: 3 }}>Batch Divider</h2><div className="dp-small dp-muted">{Number(desiredKg) > 0 ? `${Number(desiredKg).toFixed(2)} kg planned dough` : "Scale a recipe to begin"}</div></div><label className="dp-small">Number of batches <select className="dp-select" style={{ marginLeft: 7 }} value={batches.length} onChange={(e) => setBatchCount(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select></label></div>
            {batches.map((v, i) => <div key={i} className={`dp-batch ${done[i] ? "dp-done" : ""}`}><div className="dp-batch-top"><label className="dp-batch-label"><input type="checkbox" checked={!!done[i]} onChange={() => setDone((old) => ({ ...old, [i]: !old[i] }))} /><span>Batch {i + 1}</span></label><div className="dp-batch-controls"><input className="dp-input" type="number" min="0" step="0.01" aria-label={`Batch ${i + 1} weight in kilograms`} value={v} onChange={(e) => setBatches((old) => old.map((x, index) => index === i ? e.target.value : x))} /><span className="dp-small dp-muted">kg</span><button className="dp-ghost" aria-expanded={!!expanded[i]} onClick={() => setExpanded((old) => ({ ...old, [i]: !old[i] }))}>{expanded[i] ? "Hide ▴" : "Show ▾"}</button></div></div>
              {batches.length > 1 && <input className="dp-batch-slider" type="range" min="0" max={kgToGrams(Number(desiredKg) || 0)} step="10" value={kgToGrams(Number(v) || 0)} aria-label={`Adjust batch ${i + 1} weight`} disabled={!(Number(desiredKg) > 0)} onChange={(e) => adjustBatch(i, Number(e.target.value))} />}
              {expanded[i] && <div className="dp-batch-details">{ingredientRows(scaled.map((ingredient) => ({ ...ingredient, amountKg: ingredient.amountKg * ((Number(v) || 0) / (scaledTotalKg || 1)) })))}</div>}
            </div>)}
          </section>
        </main> : <main className="dp-recipe-page">
          {!selectedRecipe ? <>
            <div className="dp-recipe-heading"><h2>Recipe Library</h2><button className="dp-button" onClick={addRecipe}>+ Add recipe</button></div>
            <section className="dp-panel"><h2 className="dp-panel-title">Current Recipes</h2>
              {recipes.filter(r=>r.section!=="archive").map(r=><button className="dp-recipe-list-item" key={r.id} onClick={()=>openRecipe(r.id)}><span>{r.name}</span><span>›</span></button>)}
              {!recipes.some(r=>r.section!=="archive")&&<p className="dp-muted">No current recipes.</p>}
            </section>
            <section className="dp-panel" style={{marginTop:14}}>
              <button className="dp-recipe-list-item" onClick={()=>setArchiveOpen(v=>!v)}><strong>Search & Recipe Archive</strong><span>{archiveOpen?"▴":"▾"}</span></button>
              {archiveOpen&&<>
                <input className="dp-input" style={{width:"100%",margin:"12px 0"}} placeholder="Search all recipes" aria-label="Search all recipes" value={recipeQuery} onChange={e=>setRecipeQuery(e.target.value)}/>
                <label className="dp-field">Browse<select className="dp-select" value={archiveYear} onChange={e=>setArchiveYear(e.target.value)}><option value="all">All recipes</option><option value="current">Current Recipes</option>{[...new Set([String(new Date().getFullYear()),String(new Date().getFullYear()-1),String(new Date().getFullYear()-2),...recipeYears])].sort((a,b)=>Number(b)-Number(a)).map(y=><option key={y} value={y}>Archive {y}</option>)}</select></label>
                {recipes.filter(r=>(archiveYear==="all"||archiveYear==="current"&&r.section!=="archive"||r.section==="archive"&&String(r.year)===archiveYear)&&r.name.toLowerCase().includes(recipeQuery.toLowerCase())).map(r=><button className="dp-recipe-list-item" key={r.id} onClick={()=>openRecipe(r.id)}><span>{r.name}{r.section==="archive"?` (${r.year})`:""}</span><span>›</span></button>)}
              </>}
            </section>
          </> : <>
            <button className="dp-ghost" onClick={()=>{setSelectedRecipeId(null);setEditingRecipe(false)}}>← All recipes</button>
            <div className="dp-recipe-heading" style={{marginTop:14}}><h2>{selectedRecipe.name}</h2><button className="dp-ghost" onClick={()=>setEditingRecipe(v=>!v)}>{editingRecipe?"Done editing":"Edit recipe"}</button></div>
            {editingRecipe&&<section className="dp-panel dp-recipe-editor">
              <label className="dp-field">Recipe name<input className="dp-input" value={selectedRecipe.name} onChange={e=>updateRecipe({name:e.target.value})}/></label>
              <label className="dp-field">Category<select className="dp-select" value={selectedRecipe.section==="archive"?"archive":selectedRecipe.section} onChange={e=>updateRecipe({section:e.target.value,year:e.target.value==="archive"?Number(archiveYear):null})}><option value="current">Current Recipes</option><option value="archive">Archive</option></select></label>
              {selectedRecipe.section==="archive"&&<label className="dp-field">Archive year<input className="dp-input" type="number" value={selectedRecipe.year||""} onChange={e=>updateRecipe({year:Number(e.target.value)})}/></label>}
            </section>}
            <section className="dp-panel" style={{marginTop:14}}><h3 className="dp-panel-title">Recipe Scaling</h3>
              <div className="dp-scaling-original">
                <label className="dp-field" style={{flex:"1 1 170px"}}>Original {selectedRecipe.yieldUnit==="portions"?"(portions)":"(g)"}<input className="dp-input" type="number" min="0" disabled={!editingRecipe} value={selectedRecipe.yieldAmount} onChange={e=>updateRecipe({yieldAmount:e.target.value})}/></label>
                <label className="dp-original-pcs" title="Original piece count; edit in Edit recipe mode"><span>(</span><input type="number" min="0" step="any" aria-label="Original pieces" disabled={!editingRecipe} value={selectedRecipe.originalPcs??""} onChange={e=>updateRecipe({originalPcs:e.target.value})} placeholder="—"/><span>pcs.)</span></label>
              </div>
              <div className="dp-recipe-two" style={{marginTop:12}}>
                <label className="dp-field">Desired {selectedRecipe.yieldUnit==="portions"?"(portions)":"(g)"}<input className="dp-input" type="number" min="0" step="any" value={displayedTargetWeight} onChange={e=>{setRecipeTarget(e.target.value);setRecipeScaleMode("weight")}}/></label>
                <label className="dp-field">Desired (pcs.)<input className="dp-input" type="number" min="0" step="any" value={displayedTargetPcs} onChange={e=>{setRecipeTargetPcs(e.target.value);setRecipeScaleMode("pcs")}} placeholder="Set original pcs. first"/></label>
              </div>
              {editingRecipe&&<label className="dp-field" style={{marginTop:10}}>Weight unit<select className="dp-select" value={selectedRecipe.yieldUnit} onChange={e=>{updateRecipe({yieldUnit:e.target.value,yieldAmount:""});setRecipeTarget("");setRecipeScaleMode("weight")}}><option value="g">Grams (g)</option><option value="portions">Portions</option></select></label>}
              <p className="dp-muted dp-small">Scale: {recipeFactor.toFixed(2)}×</p>
              {!selectedRecipe.yieldAmount&&<p className="dp-muted dp-small">Original not recorded yet. Enter it in Edit mode after testing.</p>}
              {recipeScaleMode==="pcs" && !originalPcs && <p className="dp-muted dp-small">Enter the original amount (pcs.) in Edit mode to scale by pieces.</p>}
            </section>
            <section className="dp-panel" style={{marginTop:14}}><h3 className="dp-panel-title">Ingredients <span className="dp-muted dp-small">(g)</span></h3>
                             {selectedRecipe.ingredients.map((ing,i)=><div key={ing.id} data-sort-kind="ingredients" data-sort-id={ing.id} className={dragging?.id===ing.id?"dp-sort-active":""}>
                 {ing.spacer ? (editingRecipe ? <div className="dp-spacer-editor"><button type="button" className="dp-drag-handle" aria-label="Drag ingredient spacer" onPointerDown={e=>beginDrag(e,"ingredients",ing.id)}>⠿</button><div className="dp-spacer-line"/><button className="dp-ghost dp-mini" onClick={()=>updateRecipe({ingredients:selectedRecipe.ingredients.filter(x=>x.id!==ing.id)})}>Remove space</button></div> : <div className="dp-spacer"/>) : editingRecipe ? <div className="dp-recipe-edit-row" style={{gridTemplateColumns:"34px minmax(0,1fr) 85px 36px"}}><button type="button" className="dp-drag-handle" aria-label={`Drag ${ing.name||"ingredient"}`} onPointerDown={e=>beginDrag(e,"ingredients",ing.id)}>⠿</button><input className="dp-input" aria-label={`Ingredient ${i+1} name`} value={ing.name} onChange={e=>updateRecipe({ingredients:selectedRecipe.ingredients.map(x=>x.id===ing.id?{...x,name:e.target.value}:x)})}/><div style={{display:"flex",flexDirection:"column",gap:4}}><input className="dp-input" type="number" min="0" step="any" aria-label={`Ingredient ${i+1} grams`} value={ing.grams} onChange={e=>updateRecipe({ingredients:selectedRecipe.ingredients.map(x=>x.id===ing.id?{...x,grams:e.target.value}:x)})}/>{(eggCount(ing)!==null || /^kananmun/i.test(ing.name||"")) && <label className="dp-muted" style={{fontSize:".75em"}}>Eggs (pcs.)<input className="dp-input" style={{width:"100%",padding:"5px"}} type="number" min="0" step="0.25" placeholder="e.g. 2.5" value={ing.eggPcs??(eggCount(ing)??"")} onChange={e=>updateRecipe({ingredients:selectedRecipe.ingredients.map(x=>x.id===ing.id?{...x,eggPcs:e.target.value}:x)})}/></label>}</div><button className="dp-ghost" aria-label={`Remove ingredient ${i+1}`} onClick={()=>updateRecipe({ingredients:selectedRecipe.ingredients.filter(x=>x.id!==ing.id)})}>×</button></div> : <div className="dp-ingredient"><span>{ing.name}</span>{eggCount(ing)!==null ? <span className="dp-egg-amount"><span className="dp-egg-grams">({fmtGrams((Number(ing.grams)||0)*recipeFactor)} g)</span><strong>{fmtEggs(eggCount(ing)*recipeFactor)}</strong></span> : <strong>{fmtGrams((Number(ing.grams)||0)*recipeFactor)} g</strong>}</div>}
               </div>)}
               {editingRecipe&&<div className="dp-recipe-action-row"><button className="dp-ghost" onClick={()=>updateRecipe({ingredients:[...selectedRecipe.ingredients,{id:uniqueId(),name:"",grams:""}]})}>+ Ingredient</button><button className="dp-ghost" onClick={()=>updateRecipe({ingredients:[...selectedRecipe.ingredients,{id:uniqueId(),spacer:true,name:"",grams:""}]})}>+ Blank space</button></div>}
            </section>
            <section className="dp-panel" style={{marginTop:14}}>
                             <div className="dp-prep-grid">
               {(selectedRecipe.prepGroups||[]).map((group,i)=><div key={group.id} data-sort-kind="prepGroups" data-sort-id={group.id} className={`dp-prep-group ${group.width===50?"dp-prep-half":group.width===75?"dp-prep-threequarter":"dp-prep-full"} ${dragging?.id===group.id?"dp-sort-active":""}`}>
                 {editingRecipe ? <>
                   <div className="dp-prep-dragbar"><button type="button" className="dp-drag-handle" onPointerDown={e=>beginDrag(e,"prepGroups",group.id)} aria-label={`Drag preparation section ${group.title}`}>⠿ Drag section</button><button className="dp-ghost dp-mini" onClick={()=>updateRecipe({prepGroups:selectedRecipe.prepGroups.filter(x=>x.id!==group.id)})}>×</button></div>
                   <input className="dp-input" style={{width:"100%",marginBottom:8}} aria-label="Preparation group title" value={group.title} onChange={e=>updateRecipe({prepGroups:selectedRecipe.prepGroups.map(x=>x.id===group.id?{...x,title:e.target.value}:x)})}/>
                   <textarea className="dp-input dp-recipe-textarea" style={{height:group.height||180,minHeight:100,resize:"none"}} value={group.text||""} onChange={e=>updateRecipe({prepGroups:selectedRecipe.prepGroups.map(x=>x.id===group.id?{...x,text:e.target.value}:x)})} placeholder="Preparation steps..."/>
                   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,marginTop:6}}><label className="dp-field" style={{flex:1}}>Width<select className="dp-select" value={group.width||100} onChange={e=>updateRecipe({prepGroups:selectedRecipe.prepGroups.map(x=>x.id===group.id?{...x,width:Number(e.target.value)}:x)})}><option value="100">Full</option><option value="75">75%</option><option value="50">Half</option></select></label><button className="dp-resize-grip" onPointerDown={e=>beginResize(e,group.id)} title="Drag to resize height and width" aria-label="Drag to resize preparation box">◢</button></div>
                 </> : <><h4 className="dp-recipe-group-title">{group.title}</h4><p className="dp-recipe-instructions">{group.text||"No instructions entered yet."}</p></>}
               </div>)}
               </div>
               {editingRecipe&&<button className="dp-ghost" style={{marginTop:12}} onClick={()=>updateRecipe({prepGroups:[...(selectedRecipe.prepGroups||[]),newPrepGroup()]})}>+ Preparation section</button>}
            </section>
            {(editingRecipe||selectedRecipe.notes)&&<section className="dp-panel dp-notes-panel" style={{marginTop:14}}><h3 className="dp-panel-title">Notes</h3>{editingRecipe?<textarea className="dp-input dp-recipe-textarea" value={selectedRecipe.notes||""} onChange={e=>updateRecipe({notes:e.target.value})}/>:<p className="dp-recipe-instructions">{selectedRecipe.notes}</p>}</section>}
            <section className="dp-panel" style={{marginTop:14}}><h3 className="dp-panel-title">Recipe Archive</h3><p className="dp-muted dp-small">{selectedRecipe.section==="archive"?`Archived in ${selectedRecipe.year}`:selectedRecipe.section==="current"?"Current Recipes":"Current Recipes"}</p>
              {selectedRecipe.section==="archive"?<button className="dp-ghost" onClick={()=>{if(window.confirm("Restore this recipe to Current Recipes?"))updateRecipe({section:"current",year:null})}}>Restore to Current</button>:<div className="dp-recipe-two"><select className="dp-select" aria-label="Archive year" value={Number(archiveYear)>2000?archiveYear:String(new Date().getFullYear())} onChange={e=>setArchiveYear(e.target.value)}>{[String(new Date().getFullYear()),String(new Date().getFullYear()-1),String(new Date().getFullYear()-2),...recipeYears].filter((v,i,a)=>a.indexOf(v)===i).map(y=><option key={y} value={y}>{y}</option>)}</select><button className="dp-ghost" onClick={()=>{if(window.confirm(`Move ${selectedRecipe.name} to ${archiveYear} archive?`))updateRecipe({section:"archive",year:Number(archiveYear)>2000?Number(archiveYear):new Date().getFullYear()})}}>Archive recipe</button></div>}
            </section>
            <p className="dp-muted dp-small" style={{marginTop:12}}>Recipes are saved on this device only. They are not yet synchronized between coworkers.</p>
          </>}
        </main>}
      </div>
    </div>
  );
}
