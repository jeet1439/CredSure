import { useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   Loan approval dashboard (UI only, backend-ready)

   1. Set USE_MOCK = false and point API_URL at pred endpoint.
   2. The UI POSTs JSON whose keys match the notebook's columns 
      (Applicant_ID and Loan_Approved are not sent):

        {
          "Applicant_Income": 10000, "Coapplicant_Income": 5000,
          "Employment_Status": "Salaried", "Age": 40,
          "Marital_Status": "Married", "Dependents": 1,
          "Credit_Score": 700, "Existing_Loans": 2, "DTI_Ratio": 0.3,
          "Savings": 10000, "Collateral_Value": 25000,
          "Loan_Amount": 20000, "Loan_Term": 48,
          "Loan_Purpose": "Personal", "Property_Area": "Urban",
          "Education_Level": "Graduate", "Gender": "Female",
          "Employer_Category": "Private"
        }

   3. JSON back (only `probability` is required):

        {
          "probability": 0.62,                         // P(Loan_Approved = Yes), 0..1
          "thresholds": { "review": 0.4, "approve": 0.6 },   // optional
          "factors": [                                  // optional, strongest first
            { "label": "Credit score", "value": "700", "impact": 0.45 }
          ],                                            // impact: -1 (hurts) .. 1 (helps)
          "model": { "name": "Logistic Regression", "accuracy": 0.865,
                     "precision": 0.783, "recall": 0.77, "testSize": 200 }  // optional

   ───────────────────────────────────────────────────────────────────────────── */

const USE_MOCK = true;
const API_URL = "/api/predict";

/* Shown until the backend sends its own `model` block. Numbers come from the
   notebook's Logistic Regression test run (200 held-out applicants). */
const MODEL_INFO = {
  name: "Logistic Regression",
  accuracy: 0.865,
  precision: 0.783,
  recall: 0.77,
  testSize: 200,
};

const DEFAULT_THRESHOLDS = { review: 0.4, approve: 0.6 };

/* ── Form definition ───────────────────────────────────────────────────────── */

const opts = (list) => list.map((v) => ({ value: v, label: v }));

const SECTIONS = [
  {
    id: "applicant",
    title: "Applicant",
    note: "Personal details",
    fields: [
      { key: "Age", label: "Age (years)", type: "number", min: 21, max: 59, step: 1, integer: true },
      { key: "Dependents", label: "Dependents", type: "number", min: 0, max: 4, step: 1, integer: true },
      { key: "Gender", label: "Gender", type: "segmented", options: opts(["Female", "Male"]) },
      { key: "Marital_Status", label: "Marital status", type: "segmented", options: opts(["Married", "Single"]) },
      { key: "Education_Level", label: "Education", type: "segmented", options: opts(["Graduate", "Not Graduate"]) },
    ],
  },
  {
    id: "work",
    title: "Work and income",
    note: "Monthly figures, in your currency",
    fields: [
      { key: "Employment_Status", label: "Employment status", type: "select", options: opts(["Salaried", "Self-employed", "Unemployed"]) },
      { key: "Employer_Category", label: "Employer type", type: "select", options: opts(["Government", "MNC", "Private", "Unemployed"]) },
      { key: "Applicant_Income", label: "Applicant income", type: "number", min: 2000, max: 20000, step: 100 },
      { key: "Coapplicant_Income", label: "Co-applicant income", type: "number", min: 0, max: 10000, step: 100 },
    ],
  },
  {
    id: "credit",
    title: "Credit profile",
    note: "These two drive most decisions",
    fields: [
      {
        key: "Credit_Score", label: "Credit score", type: "slider", min: 550, max: 800, step: 1, integer: true,
        display: (v) => String(Math.round(Number(v))),
      },
      {
        key: "DTI_Ratio", label: "Debt-to-income ratio", type: "slider", min: 0.1, max: 0.6, step: 0.01,
        display: (v) => `${Number(v).toFixed(2)}  (${Math.round(Number(v) * 100)}%)`,
      },
      { key: "Existing_Loans", label: "Existing loans", type: "number", min: 0, max: 4, step: 1, integer: true },
      { key: "Savings", label: "Savings", type: "number", min: 0, max: 20000, step: 100 },
      { key: "Collateral_Value", label: "Collateral value", type: "number", min: 0, max: 50000, step: 500 },
    ],
  },
  {
    id: "loan",
    title: "Loan request",
    note: "What the applicant is asking for",
    fields: [
      { key: "Loan_Amount", label: "Loan amount", type: "number", min: 1000, max: 40000, step: 100 },
      {
        key: "Loan_Term", label: "Loan term", type: "select",
        options: [12, 24, 36, 48, 60, 72, 84].map((m) => ({ value: String(m), label: `${m} months` })),
      },
      { key: "Loan_Purpose", label: "Purpose", type: "select", options: opts(["Business", "Car", "Education", "Home", "Personal"]) },
      { key: "Property_Area", label: "Property area", type: "segmented", options: opts(["Rural", "Semiurban", "Urban"]) },
    ],
  },
];

const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);

const EXAMPLE = {
  Applicant_Income: "10000", Coapplicant_Income: "5000", Employment_Status: "Salaried",
  Age: "40", Marital_Status: "Married", Dependents: "1", Credit_Score: "700",
  Existing_Loans: "2", DTI_Ratio: "0.30", Savings: "10000", Collateral_Value: "25000",
  Loan_Amount: "20000", Loan_Term: "48", Loan_Purpose: "Personal", Property_Area: "Urban",
  Education_Level: "Graduate", Gender: "Female", Employer_Category: "Private",
};

/* ── Zones ─────────────────────────────────────────────────────────────────── */

const ZONES = {
  decline: { label: "Likely declined", color: "#ef6a58", note: "The model sees this application as a likely decline." },
  review: { label: "Needs manual review", color: "#e8b341", note: "The model is unsure. A person should look at this one." },
  approve: { label: "Likely approved", color: "#3fc79d", note: "The model sees this application as a likely approval." },
};

function zoneOf(p, t) {
  if (p >= t.approve) return "approve";
  if (p >= t.review) return "review";
  return "decline";
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

const fmt = (n) => Math.round(n).toLocaleString("en-US");
const pct = (n) => `${Math.round(n * 100)}%`;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function validate(values) {
  const errors = {};
  for (const f of ALL_FIELDS) {
    const v = values[f.key];
    if (f.type === "number" || f.type === "slider") {
      const n = Number(v);
      if (v === "" || !Number.isFinite(n)) errors[f.key] = "Enter a number.";
      else if (n < f.min || n > f.max) errors[f.key] = `Enter a value from ${f.min} to ${f.max}.`;
      else if (f.integer && !Number.isInteger(n)) errors[f.key] = "Use a whole number.";
    } else if (!f.options.some((o) => o.value === v)) {
      errors[f.key] = "Choose an option.";
    }
  }
  return errors;
}

function toPayload(values) {
  const out = {};
  for (const f of ALL_FIELDS) {
    out[f.key] = f.type === "number" || f.type === "slider" ? Number(values[f.key]) : values[f.key];
  }
  return out;
}

/* Patterns visible in the notebook's boxplots: no approved applicant had a
   credit score under ~650 or a DTI ratio above ~0.4. Shown as context, not
   as a model output. */
function getFlags(values) {
  const credit = Number(values.Credit_Score);
  const dti = Number(values.DTI_Ratio);
  return [
    credit >= 650
      ? { ok: true, text: `Credit score ${credit} is at or above 650, the lowest seen among approved applicants.` }
      : { ok: false, text: `Credit score ${credit} is below 650. No applicant under 650 was approved in the training data.` },
    dti <= 0.4
      ? { ok: true, text: `Debt-to-income ${dti.toFixed(2)} is within 0.40, the highest seen among approved applicants.` }
      : { ok: false, text: `Debt-to-income ${dti.toFixed(2)} is above 0.40. No applicant above that was approved in the training data.` },
  ];
}

/* ── Backend call ──────────────────────────────────────────────────────────── */

function mockPredict(p) {
  // Stand-in so the UI is alive before the backend exists. Delete with USE_MOCK.
  const credit = 0.028 * (p.Credit_Score - 680);
  const dti = -7 * (p.DTI_Ratio - 0.35);
  const loan = -0.00003 * (p.Loan_Amount - 20000);
  const income = 0.00008 * (p.Applicant_Income - 10000);
  const term = -0.008 * (p.Loan_Term - 48);
  const job = p.Employment_Status === "Unemployed" ? -0.8 : 0;
  const z = -0.4 + credit + dti + loan + income + term + job;
  const probability = 1 / (1 + Math.exp(-z));
  const scale = (x) => clamp(x / 1.5, -1, 1);
  const factors = [
    { label: "Credit score", value: String(p.Credit_Score), impact: scale(credit) },
    { label: "Debt-to-income ratio", value: p.DTI_Ratio.toFixed(2), impact: scale(dti) },
    { label: "Loan amount", value: fmt(p.Loan_Amount), impact: scale(loan) },
    { label: "Applicant income", value: fmt(p.Applicant_Income), impact: scale(income) },
    { label: "Loan term", value: `${p.Loan_Term} months`, impact: scale(term) },
    { label: "Employment", value: p.Employment_Status, impact: scale(job) },
  ]
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 5);
  return { probability, thresholds: DEFAULT_THRESHOLDS, factors, model: MODEL_INFO };
}

async function predictLoan(payload) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 700));
    return mockPredict(payload);
  }
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Prediction failed (${res.status})`);
  return res.json();
}

/* ── Form controls ─────────────────────────────────────────────────────────── */

const inputCls =
  "w-full rounded-lg border border-[#cfdcf0] bg-white px-3 py-2 text-sm text-[#13233e] outline-none transition focus:border-[#2a5bd7] focus-visible:ring-2 focus-visible:ring-[#2a5bd7]/30 aria-[invalid=true]:border-[#c8402f] lg:h-7 lg:px-2 lg:py-0 lg:text-xs";

function FieldShell({ id, label, error, wide, children }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#13233e] lg:mb-0.5 lg:text-[10px]">
          {label}
        </label>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-[#c8402f]">
          {error}
        </p>
      )}
    </div>
  );
}

function Field({ field, value, error, onChange }) {
  const id = `f-${field.key}`;
  const invalid = Boolean(error);

  if (field.type === "slider") {
    const shown = error ? "—" : field.display(value);
    return (
      <FieldShell id={id} error={error} wide>
        <div className="flex items-baseline justify-between">
          <label htmlFor={id} className="text-sm font-medium text-[#13233e] lg:text-[10px]">
            {field.label}
          </label>
          <span className="font-display text-xl font-semibold text-[#13233e]">{shown}</span>
        </div>
        <input
          id={id}
          type="range"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="mt-2 w-full cursor-pointer accent-[#13233e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2a5bd7] lg:mt-0.5"
        />
        <div className="flex justify-between text-xs text-[#6b7f9e] lg:hidden">
          <span>{field.min}</span>
          <span>{field.max}</span>
        </div>
      </FieldShell>
    );
  }

  if (field.type === "number") {
    return (
      <FieldShell id={id} label={field.label} error={error}>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(e) => onChange(field.key, e.target.value)}
          className={inputCls}
        />
      </FieldShell>
    );
  }

  if (field.type === "select") {
    return (
      <FieldShell id={id} label={field.label} error={error}>
        <select
          id={id}
          value={value}
          aria-invalid={invalid}
          onChange={(e) => onChange(field.key, e.target.value)}
          className={inputCls}
        >
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FieldShell>
    );
  }

  // segmented
  return (
    <FieldShell id={id} error={error}>
      <span id={`${id}-label`} className="mb-1.5 block text-sm font-medium text-[#13233e] lg:mb-0.5 lg:text-[10px]">
        {field.label}
      </span>
      <div role="radiogroup" aria-labelledby={`${id}-label`} className="flex rounded-lg border border-[#cfdcf0] bg-[#f1f5fc] p-0.5">
        {field.options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(field.key, o.value)}
              className={`flex-1 rounded-md px-2 py-1.5 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2a5bd7] lg:px-1 lg:py-0.5 lg:text-[10px] ${
                on ? "bg-[#13233e] font-medium text-white" : "text-[#3d5278] hover:bg-white"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}

/* ── Result pieces ─────────────────────────────────────────────────────────── */

function Band({ probability, thresholds, active }) {
  const r = Math.round(thresholds.review * 100);
  const a = Math.round(thresholds.approve * 100);
  const dim = active ? "" : "opacity-40";
  return (
    <div className="mt-6">
      <div className="relative">
        <div className={`flex h-3 overflow-hidden rounded-full ${dim}`}>
          <div style={{ width: `${r}%`, background: ZONES.decline.color }} />
          <div style={{ width: `${a - r}%`, background: ZONES.review.color }} />
          <div style={{ width: `${100 - a}%`, background: ZONES.approve.color }} />
        </div>
        {active && (
          <div
            className="absolute -top-1.5 h-6 w-1.5 -translate-x-1/2 rounded-full bg-white ring-2 ring-[#13233e] transition-[left] duration-700 ease-out motion-reduce:transition-none"
            style={{ left: `${clamp(probability * 100, 1.5, 98.5)}%` }}
          />
        )}
      </div>
      <div className="mt-2 flex text-xs text-[#7184a1]">
        <span style={{ width: `${r}%` }}>Decline</span>
        <span style={{ width: `${a - r}%` }}>Review</span>
        <span className="text-right" style={{ width: `${100 - a}%` }}>Approve</span>
      </div>
    </div>
  );
}

function FactorRow({ factor }) {
  const w = Math.abs(factor.impact) * 50;
  const good = factor.impact >= 0;
  return (
    <li className="py-2">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-[#243c5f]">{factor.label}</span>
        <span className="text-[#7184a1]">{factor.value}</span>
      </div>
      <div className="relative mt-1.5 h-1.5 rounded-full bg-[#dce9f8]" role="img" aria-label={`${factor.label} ${good ? "raises" : "lowers"} the approval chance`}>
        <div className="absolute left-1/2 top-[-2px] h-[10px] w-px bg-[#7b91ad]" />
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            width: `${w}%`,
            left: good ? "50%" : `${50 - w}%`,
            background: good ? ZONES.approve.color : ZONES.decline.color,
          }}
        />
      </div>
    </li>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex-1 px-4 first:pl-0 last:pr-0">
      <dt className="text-xs text-[#7184a1]">{label}</dt>
      <dd className="mt-0.5 font-display text-lg font-semibold text-[#13233e]">{value}</dd>
    </div>
  );
}

function ApprovalOutlook({ probability, active }) {
  const values = [18, 25, 22, 34, 30, 43, 48, 45, 57, 62, 68, 73];
  const line = values.map((value, index) => `${index ? "L" : "M"} ${12 + index * 25} ${102 - value}`).join(" ");
  const area = `${line} L 287 112 L 12 112 Z`;
  const markerX = 12 + clamp(probability, 0, 1) * 275;
  const markerY = 102 - (18 + clamp(probability, 0, 1) * 58);

  return (
    <section className="mt-6 rounded-xl border border-[#c7ddf7] bg-[#f7fbff] p-4" aria-label="Approval outlook chart">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-[#13233e]">Approval outlook</h3>
          <p className="mt-0.5 text-xs text-[#6b7f9e]">Illustrative probability trend</p>
        </div>
        <span className="rounded-full bg-[#e3f0ff] px-2.5 py-1 text-xs font-semibold text-[#0963d7]">Last 12 checks</span>
      </div>
      <svg viewBox="0 0 300 132" className="mt-3 h-auto w-full" role="img" aria-label={active ? `Approval probability is ${pct(probability)}` : "Approval probability trend awaiting a check"}>
        <defs><linearGradient id="approval-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#1d7dec" stopOpacity=".25" /><stop offset="100%" stopColor="#1d7dec" stopOpacity="0" /></linearGradient></defs>
        {[28, 56, 84, 112].map((y) => <line key={y} x1="12" x2="287" y1={y} y2={y} stroke="#cfe1f5" strokeDasharray="3 4" />)}
        <path d={area} fill="url(#approval-fill)" />
        <path d={line} fill="none" stroke="#1670df" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {active && <><line x1={markerX} x2={markerX} y1="18" y2="112" stroke="#0963d7" strokeDasharray="3 3" /><circle cx={markerX} cy={markerY} r="5" fill="white" stroke="#0963d7" strokeWidth="3" /></>}
        <text x="12" y="128" fill="#8091aa" fontSize="9">Earlier</text><text x="255" y="128" fill="#8091aa" fontSize="9">Today</text>
      </svg>
    </section>
  );
}

function ResultPanel({ status, result, error, values, history, onRetry, onLoad }) {
  const thresholds = result?.thresholds ?? DEFAULT_THRESHOLDS;
  const model = result?.model ?? MODEL_INFO;
  const done = status === "done" && result;
  const zone = done ? zoneOf(result.probability, thresholds) : null;

  const income = Number(values.Applicant_Income) + Number(values.Coapplicant_Income);
  const loan = Number(values.Loan_Amount);
  const term = Number(values.Loan_Term);
  const flags = getFlags(values);

  return (
    <aside className="rounded-2xl border border-[#d7e5f7] bg-white p-6 text-[#13233e] shadow-[0_12px_32px_rgba(37,99,165,0.10)] lg:h-full lg:overflow-y-auto lg:p-5" aria-live="polite">
      <h2 className="font-display text-lg font-semibold">Approval chance</h2>

      {status === "idle" && (
        <>
          <p className="mt-4 font-display text-5xl font-bold text-white/30">–</p>
          <p className="mt-2 max-w-xs text-sm text-[#7184a1]">
            Fill in the applicant details, then select Check approval chance.
          </p>
          <Band probability={0} thresholds={thresholds} active={false} />
        </>
      )}

      {status === "loading" && (
        <>
          <p className="mt-4 animate-pulse font-display text-5xl font-bold text-white/50 motion-reduce:animate-none">…</p>
          <p className="mt-2 text-sm text-[#7184a1]">Checking this application.</p>
          <Band probability={0} thresholds={thresholds} active={false} />
        </>
      )}

      {status === "error" && (
        <div className="mt-4">
          <p className="text-sm text-[#c8402f]">
            The result could not be loaded. Check that the prediction service is running, then try again.
          </p>
          <p className="mt-1 text-xs text-[#7184a1]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-lg border border-[#bcd4f0] px-3 py-1.5 text-sm text-[#0963d7] hover:bg-[#f2f8ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0963d7]"
          >
            Try again
          </button>
        </div>
      )}

      {done && (
        <>
          <div className="mt-4 flex items-end gap-3">
            <p className="font-display text-6xl font-bold leading-none" style={{ color: ZONES[zone].color }}>
              {pct(result.probability)}
            </p>
            <p className="pb-1 font-display text-lg font-semibold">{ZONES[zone].label}</p>
          </div>
          <p className="mt-2 text-sm text-[#7184a1]">{ZONES[zone].note}</p>
          <Band probability={result.probability} thresholds={thresholds} active />
          <p className="mt-3 text-xs text-[#7184a1]">
            Scores from {pct(thresholds.review)} to {pct(thresholds.approve)} go to manual review.
          </p>

          <dl className="mt-6 flex divide-x divide-[#dbe8f7] border-y border-[#dbe8f7] py-3">
            <Stat label="Total income" value={fmt(income)} />
            <Stat label="Loan vs income" value={`${(loan / income).toFixed(1)}×`} />
            <Stat label="Principal a month" value={fmt(loan / term)} />
          </dl>

          {result.factors?.length > 0 && (
            <section className="mt-6">
              <h3 className="font-display text-base font-semibold">What moved the score</h3>
              <p className="text-xs text-[#7184a1]">Green raised the chance, red lowered it.</p>
              <ul className="mt-2 divide-y divide-[#e3edf8]">
                {result.factors.map((f, index) => (
                  <div key={f.label} className={index > 2 ? "lg:hidden" : ""}><FactorRow factor={f} /></div>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-6 lg:hidden">
            <h3 className="font-display text-base font-semibold">Patterns in past decisions</h3>
            <ul className="mt-2 space-y-2">
              {flags.map((f) => (
                <li key={f.text} className="flex gap-2 text-sm">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: f.ok ? ZONES.approve.color : ZONES.decline.color }}
                  />
                  <span className="text-[#526a89]">
                    <span className="sr-only">{f.ok ? "Fine: " : "Concern: "}</span>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <ApprovalOutlook probability={result?.probability ?? 0} active={done} />

      {history.length > 0 && (
        <section className="mt-6 border-t border-[#dbe8f7] pt-4 lg:hidden">
          <h3 className="font-display text-base font-semibold">Earlier checks</h3>
          <ul className="mt-2 space-y-1">
            {history.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => onLoad(h)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[#f2f8ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0963d7]"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: ZONES[h.zone].color }} aria-hidden="true" />
                  <span className="w-12 font-display font-semibold">{pct(h.probability)}</span>
                  <span className="truncate text-[#7184a1]">
                    Score {h.values.Credit_Score} · DTI {Number(h.values.DTI_Ratio).toFixed(2)} · Loan {fmt(Number(h.values.Loan_Amount))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-6 border-t border-[#dbe8f7] pt-4 text-xs leading-relaxed text-[#7184a1]">
        {model.name}, tested on {model.testSize} applicants: {pct(model.accuracy)} accurate, finds {pct(model.recall)} of
        approvals. This is a decision aid, not a decision.
      </p>
    </aside>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

export default function Dashboard({ onLogout }) {
  const [values, setValues] = useState(EXAMPLE);
  const [showErrors, setShowErrors] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const resultRef = useRef(null);

  const errors = validate(values);
  const hasErrors = Object.keys(errors).length > 0;

  const setField = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  async function submit() {
    if (hasErrors) {
      setShowErrors(true);
      return;
    }
    setStatus("loading");
    setError("");
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    try {
      const data = await predictLoan(toPayload(values));
      const zone = zoneOf(data.probability, data.thresholds ?? DEFAULT_THRESHOLDS);
      setResult(data);
      setStatus("done");
      setHistory((h) => [{ id: Date.now(), probability: data.probability, zone, values }, ...h].slice(0, 4));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }

  function reset() {
    setValues(EXAMPLE);
    setShowErrors(false);
    setStatus("idle");
    setResult(null);
  }

  function loadFromHistory(h) {
    setValues(h.values);
    setShowErrors(false);
  }

  return (
    <main className="min-h-screen bg-[#f4f9ff] px-4 py-6 text-[#13233e] sm:px-6 lg:h-screen lg:overflow-hidden lg:px-8 lg:py-4">
      <div className="mx-auto max-w-6xl lg:flex lg:h-full lg:flex-col">
        <header className="mb-8 rounded-2xl bg-gradient-to-r from-[#0b61ce] to-[#1c82ee] px-6 py-6 text-white shadow-lg shadow-[#b8d9fc] sm:px-8 lg:mb-3 lg:shrink-0 lg:px-6 lg:py-2">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-[#ddebff] lg:mb-1 lg:text-xs"><span className="flex size-7 items-center justify-center rounded-lg bg-white/15 lg:size-6">C</span> CREDSURE</div>
              <h1 className="font-display text-3xl font-bold sm:text-4xl lg:text-2xl">Loan approval check</h1>
              <p className="mt-2 text-base text-[#e6f1ff] lg:mt-1 lg:text-xs">Enter an applicant's details to see how likely the loan is to be approved and what drives that chance.</p>
            </div>
            {onLogout && <button type="button" onClick={onLogout} className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">Sign out</button>}
          </div>
        </header>

        <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch lg:gap-4">
          <section className="rounded-2xl border border-[#dbe5f5] bg-white lg:flex lg:flex-col">
            {SECTIONS.map((section, i) => (
              <fieldset key={section.id} className={`p-6 lg:px-4 lg:py-2 ${i > 0 ? "border-t border-[#e6eefa]" : ""}`}>
                <legend className="sr-only">{section.title}</legend>
                <div className="mb-4 flex items-baseline gap-2 lg:mb-1"><h2 className="font-display text-lg font-semibold lg:text-xs">{section.title}</h2><p className="text-sm text-[#6b7f9e] lg:text-[10px]">{section.note}</p></div>
                <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-3 lg:gap-y-1.5">
                  {section.fields.map((f) => (
                    <Field
                      key={f.key}
                      field={f}
                      value={values[f.key]}
                      error={showErrors ? errors[f.key] : undefined}
                      onChange={setField}
                    />
                  ))}
                </div>
              </fieldset>
            ))}

            <div className="flex flex-wrap items-center gap-3 border-t border-[#e6eefa] p-6 lg:mt-auto lg:px-4 lg:py-1.5">
              <button
                type="button"
                onClick={submit}
                disabled={status === "loading"}
                className="rounded-lg bg-[#13233e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d3459] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2a5bd7] disabled:cursor-wait disabled:opacity-60 lg:px-4 lg:py-1.5 lg:text-xs"
              >
                {status === "loading" ? "Checking…" : "Check approval chance"}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-[#3d5278] hover:bg-[#eef3fb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2a5bd7] lg:px-3 lg:py-1.5 lg:text-xs"
              >
                Reset to example
              </button>
              {showErrors && hasErrors && (
                <p className="text-sm text-[#c8402f]">Fix the highlighted fields to continue.</p>
              )}
            </div>
          </section>

          <div ref={resultRef} className="scroll-mt-4 lg:h-full lg:min-h-0">
            <ResultPanel
              status={status}
              result={result}
              error={error}
              values={values}
              history={history}
              onRetry={submit}
              onLoad={loadFromHistory}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
