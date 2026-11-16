import { useEffect, useMemo, useState } from "react";

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
    return saved && saved.remember !== false ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
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

export default function App() {
  const [settings, setSettings] = useState(readSettings);
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
        .dp-ingredient{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid var(--dp-border);font-size:.88em}.dp-ingredient:last-child{border-bottom:0}.dp-ingredient strong{color:var(--dp-accent);white-space:nowrap;font-variant-numeric:tabular-nums}
        .dp-compact .dp-morning .dp-ingredient{font-size:.76em}.dp-pizza-total{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;flex-wrap:wrap}.dp-pizza-total strong{color:var(--dp-accent);font-size:1.15em}
        .dp-compact .dp-button,.dp-compact .dp-ghost{padding-top:5px;padding-bottom:5px;min-height:32px;line-height:1.2}.dp-compact .dp-pizza-total .dp-button{width:100%}.dp-scale-row{display:flex;gap:8px;margin-bottom:12px}.dp-scale-row .dp-input{flex:1;width:0}.dp-compact .dp-scale-row{flex-wrap:wrap}.dp-compact .dp-scale-row .dp-button{width:100%}
        .dp-divider-header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}.dp-batch{background:var(--dp-input);border:1px solid var(--dp-border);border-radius:11px;padding:13px;margin-top:10px}
        .dp-batch-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.dp-batch-label{display:flex;align-items:center;gap:10px;font-weight:700}.dp-batch-label input{width:19px;height:19px}
        .dp-batch-controls{display:flex;align-items:center;gap:8px}.dp-batch-controls .dp-input{width:100px;text-align:center}.dp-batch-details{background:var(--dp-card);padding:12px;border-radius:9px;margin-top:12px}.dp-batch-details .dp-ingredient{font-size:.85em}
        .dp-done .dp-batch-label span{text-decoration:line-through;opacity:.55}.dp-batch-slider{width:100%;margin-top:12px;min-height:24px;cursor:pointer}
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

        <main className={settings.layout === "compact" ? "dp-compact" : "dp-classic"}>
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
        </main>
      </div>
    </div>
  );
}
