// src/App.jsx
import { useState } from "react";

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
];

const formatUnit = (kg) => (kg < 1 ? `${Math.round(kg * 1000)} g` : `${kg.toFixed(2)} kg`);

export default function App() {
  const [desiredKg, setDesiredKg] = useState("");
  const [scaled, setScaled] = useState(BASE_RECIPE);
  const [pizzaCounts, setPizzaCounts] = useState(Object.fromEntries(PIZZA_SIZES.map(p => [p.name, ""])));
  const [batches, setBatches] = useState([""]);
  const [expanded, setExpanded] = useState({});
  const [done, setDone] = useState({});

  const baseTotal = BASE_RECIPE.reduce((a, b) => a + b.amountKg, 0);

  const scaleRecipe = (kg) => {
    const total = parseFloat(kg);
    if (!total || total <= 0) return;
    const factor = total / baseTotal;
    setScaled(BASE_RECIPE.map(i => ({ ...i, amountKg: i.amountKg * factor })));

    if (batches.length > 0) {
      const even = total / batches.length;
      setBatches(Array(batches.length).fill(even.toFixed(2)));
    }
  };

  const calcPizzaTotal = () => {
    const totalG = PIZZA_SIZES.reduce(
      (sum, p) => sum + (parseInt(pizzaCounts[p.name]) || 0) * p.weightG,
      0
    );
    const kg = totalG / 1000;
    setDesiredKg(kg);
    scaleRecipe(kg);
  };

  const toggleExpand = (i) => setExpanded(e => ({ ...e, [i]: !e[i] }));
  const toggleDone = (i) => setDone(d => ({ ...d, [i]: !d[i] }));

  return (
    <div className="min-h-screen flex flex-col items-center p-6 text-neutral-100 bg-neutral-900">
      <h1 className="text-3xl font-bold mb-6 text-amber-400">Dough Planner</h1>

      {/* Pizza Calculator */}
      <div className="bg-neutral-800 rounded-2xl p-4 w-full max-w-xl mb-6">
        <h2 className="text-xl font-semibold mb-3">Pizza Calculator</h2>
        {PIZZA_SIZES.map((p) => (
          <div key={p.name} className="flex justify-between mb-2">
            <span>{p.name} ({p.weightG}g)</span>
            <input
              type="number"
              className="w-20 bg-neutral-700 rounded px-2 text-center"
              value={pizzaCounts[p.name]}
              onChange={(e) => setPizzaCounts({ ...pizzaCounts, [p.name]: e.target.value })}
            />
          </div>
        ))}
        <button onClick={calcPizzaTotal} className="w-full bg-amber-400 text-black py-2 rounded-md mt-3 font-bold">
          Use for Scaling
        </button>
      </div>

      {/* Total Amount (was "Scale Recipe") */}
      <div className="bg-neutral-800 rounded-2xl p-4 w-full max-w-xl mb-6">
        <h2 className="text-xl font-semibold mb-3">Total Amount</h2>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex-1 min-w-[150px]">
            <input
              type="number"
              placeholder="Amount"
              value={desiredKg}
              onChange={(e) => setDesiredKg(e.target.value)}
              className="w-full bg-neutral-700 rounded px-2 py-1 text-center"
            />
          </div>
          <button
            onClick={() => scaleRecipe(desiredKg)}
            className="bg-amber-400 text-black px-4 py-1 rounded font-bold whitespace-nowrap"
          >
            Scale
          </button>
        </div>

        {scaled.map((i) => (
          <div key={i.name} className="flex justify-between text-sm py-1 border-b border-neutral-700">
            <span>{i.name}</span>
            <span>{formatUnit(i.amountKg)}</span>
          </div>
        ))}
      </div>

      {/* Batch Divider */}
      <div className="bg-neutral-800 rounded-2xl p-4 w-full max-w-xl">
        <h2 className="text-xl font-semibold mb-3">Batch Divider</h2>

        <div className="flex justify-between items-center mb-3">
          <span>Number of batches</span>
          <select
            value={batches.length}
            className="bg-neutral-700 rounded px-2 py-1 text-center"
            onChange={(e) => {
              const n = parseInt(e.target.value);
              const total = parseFloat(desiredKg) || 0;
              const even = total > 0 ? total / n : 0;
              setBatches(Array(n).fill(even.toFixed(2)));
              setDone({});
            }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {batches.map((v, i) => (
          <div
            key={i}
            className={`mb-3 border-b border-neutral-700 pb-3 transition-all ${
              done[i] ? "opacity-50 line-through" : ""
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={done[i] || false}
                  onChange={() => toggleDone(i)}
                  className="accent-amber-400"
                />
                <span>Batch {i + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={v}
                  step="0.1"
                  className="w-24 bg-neutral-700 rounded px-2 text-center"
                  onChange={(e) => {
                    const arr = [...batches];
                    arr[i] = e.target.value;
                    setBatches(arr);
                  }}
                />
                <button
                  className="ml-2 text-amber-400"
                  onClick={() => toggleExpand(i)}
                >
                  {expanded[i] ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {batches.length > 1 && (
              <input
                type="range"
                min="0"
                max="100"
                value={
                  ((parseFloat(v) || 0) /
                    (parseFloat(desiredKg) || 1)) *
                  100
                }
                onChange={(e) => {
                  const total = parseFloat(desiredKg) || 0;
                  const percent = e.target.value / 100;
                  const arr = [...batches];
                  const newVal = total * percent;
                  let diff = newVal - parseFloat(v || 0);
                  arr[i] = newVal.toFixed(2);

                  const laterIdx = arr
                    .map((_, idx) => idx)
                    .filter((idx) => idx > i);
                  const sumLater = laterIdx.reduce(
                    (s, idx) => s + parseFloat(arr[idx] || 0),
                    0
                  );

                  laterIdx.forEach((idx) => {
                    if (sumLater > 0) {
                      const share = parseFloat(arr[idx]) / sumLater;
                      arr[idx] = (parseFloat(arr[idx]) - diff * share).toFixed(2);
                    }
                  });

                  const sumNow = arr.reduce((a, b) => a + parseFloat(b), 0);
                  if (Math.abs(sumNow - total) > 0.01) {
                    const adjust = total - sumNow;
                    arr[arr.length - 1] = (parseFloat(arr[arr.length - 1]) + adjust).toFixed(2);
                  }

                  setBatches(arr);
                }}
                className="w-full accent-amber-400"
              />
            )}

            {expanded[i] && (
              <div className="bg-neutral-900 rounded-lg p-2 mt-2">
                {scaled.map((ing) => {
                  const total = parseFloat(desiredKg) || 0;
                  const factor = total > 0 ? (parseFloat(v) || 0) / total : 0;
                  return (
                    <div key={ing.name} className="flex justify-between text-sm py-0.5">
                      <span>{ing.name}</span>
                      <span>
                        {ing.amountKg * factor < 1
                          ? `${Math.round(ing.amountKg * factor * 1000)} g`
                          : `${(ing.amountKg * factor).toFixed(2)} kg`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
