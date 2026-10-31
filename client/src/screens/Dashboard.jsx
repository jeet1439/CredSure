import { useState } from "react";

// Edit these values, labels, and HTML inputs directly. There is no generated form schema.
const EXAMPLE = {
  Age: "40",
  Dependents: "1",
  Gender: "Female",
  Marital_Status: "Married",
  Education_Level: "Graduate",
  Employment_Status: "Salaried",
  Employer_Category: "Private",
  Applicant_Income: "10000",
  Coapplicant_Income: "5000",
  Credit_Score: "700",
  DTI_Ratio: "0.30",
  Existing_Loans: "2",
  Savings: "10000",
  Collateral_Value: "25000",
  Loan_Amount: "20000",
  Loan_Term: "48",
  Loan_Purpose: "Personal",
  Property_Area: "Urban",
};

// Mock JSON responses. Replace these with API results later if needed.
const MODEL_RESULTS = {
  linear: {
    probability: 0.68,
    thresholds: { review: 0.4, approve: 0.6 },
    model: { name: "Linear Regression", accuracy: 0.865, testSize: 200 },
  },
  xgboost: {
    probability: 0.74,
    thresholds: { review: 0.4, approve: 0.6 },
    model: { name: "XGBoost", accuracy: 0.91, testSize: 200 },
  },
  tree: {
    probability: 0.58,
    thresholds: { review: 0.4, approve: 0.6 },
    model: { name: "Decision Tree", accuracy: 0.84, testSize: 200 },
  },
};

const field =
  "w-full rounded-lg border border-[#cfdcf0] bg-white px-3 py-2 text-sm text-[#13233e] outline-none focus:border-[#2a5bd7] lg:h-7 lg:px-2 lg:py-0 lg:text-xs";
const label =
  "mb-1.5 block text-sm font-medium text-[#13233e] lg:mb-0.5 lg:text-[10px]";
const group = "flex rounded-lg border border-[#cfdcf0] bg-[#f1f5fc] p-0.5";
const choice =
  "flex-1 rounded-md px-2 py-1.5 text-sm lg:px-1 lg:py-0.5 lg:text-[10px]";

function Band({ probability, active }) {
  return (
    <div className="mt-6">
      <div className={`relative flex h-3 overflow-hidden rounded-full ${ active ? "" : "opacity-40" }`}>
        <i className="w-[40%] bg-[#ef6a58]" />
        <i className="w-[20%] bg-[#e8b341]" />
        <i className="w-[40%] bg-[#3fc79d]" />
        {active && (
          <i
            className="absolute -top-1.5 h-6 w-1.5 -translate-x-1/2 rounded-full bg-white ring-2 ring-[#13233e]"
            style={{ left: `${probability * 100}%` }}
          />
        )}
      </div>
      <div className="mt-2 flex text-xs text-[#7184a1]">
        <span className="w-[40%]">Decline</span>
        <span className="w-[20%]">Review</span>
        <span className="w-[40%] text-right">Approve</span>
      </div>
    </div>
  );
}

function Result({ status, result }) {
  const percent = result ? `${Math.round(result.probability * 100)}%` : "";
  const zone = result?.probability >= 0.6 ? "approve" : result?.probability >= 0.4 ? "review" : "decline";
  const zoneText = {
    approve: ["Likely approved", "text-[#3fc79d]", "The model sees this application as a likely approval."],
    review: ["Needs manual review", "text-[#e8b341]", "The model recommends a manual review."],
    decline: ["Likely declined", "text-[#ef6a58]", "The model sees this application as a likely decline."],
  };

  return (
    <aside className="rounded-2xl border border-[#d7e5f7] bg-white p-6 shadow-[0_12px_32px_rgba(37,99,165,0.10)] lg:h-full lg:p-5">
      <h2 className="font-display text-lg font-semibold">Approval chance</h2>

      {status === "idle" && (
        <>
          <p className="mt-4 font-display text-5xl font-bold text-[#dbe8f7]">
            —
          </p>
          <p className="mt-2 text-sm text-[#7184a1]">
            Fill in the applicant details, then select Check approval chance.
          </p>
          <Band probability={0} active={false} />
        </>
      )}

      {status === "loading" && (
        <>
          <p className="mt-4 animate-pulse font-display text-5xl font-bold text-[#dbe8f7]">
            …
          </p>
          <p className="mt-2 text-sm text-[#7184a1]">
            Checking this application.
          </p>
          <Band probability={0} active={false} />
        </>
      )}

      {status === "done" && (
        <>
          <div className="mt-4 flex items-end gap-3">
            <p className={`font-display text-6xl font-bold leading-none ${zoneText[zone][1]}`}>
              {percent}
            </p>
            <p className="pb-1 font-display text-lg font-semibold">
              {zoneText[zone][0]}
            </p>
          </div>
          <p className="mt-2 text-sm text-[#7184a1]">
            {zoneText[zone][2]}
          </p>
          <Band probability={result.probability} active />
          <p className="mt-3 text-xs text-[#7184a1]">
            Scores from 40% to 60% go to manual review.
          </p>
        </>
      )}

      <p className="mt-6 border-t border-[#dbe8f7] pt-4 text-xs leading-relaxed text-[#7184a1]">
        {result?.model.name ?? "Select a model"}, tested on {result?.model.testSize ?? 0} applicants: {result ? `${Math.round(result.model.accuracy * 100)}%` : "0%"} accurate. This is a decision aid, not a decision.
      </p>
    </aside>
  );
}

function Section({ title, note, children }) {
  return (
    <fieldset className="border-t border-[#e6eefa] p-6 first:border-0 lg:px-4 lg:py-2">
      <legend className="sr-only">{title}</legend>
      <div className="mb-4 flex items-baseline gap-2 lg:mb-1">
        <h2 className="font-display text-lg font-semibold lg:text-xs">
          {title}
        </h2>
        <p className="text-sm text-[#6b7f9e] lg:text-[10px]">{note}</p>
      </div>
      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-3 lg:gap-y-1.5">
        {children}
      </div>
    </fieldset>
  );
}

export default function Dashboard({ onLogout }) {
  const [values, setValues] = useState(EXAMPLE);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [selectedModel, setSelectedModel] = useState("linear");

  const set = (name) => (event) =>
    setValues({ ...values, [name]: event.target.value });

  const pick = (name, value) => () => setValues({ ...values, [name]: value });

  const active = (name, value) =>
    values[name] === value
      ? "bg-[#13233e] font-medium text-white"
      : "text-[#3d5278] hover:bg-white";

  async function submit() {
    setStatus("loading");
    await new Promise((resolve) => setTimeout(resolve, 700));
    setResult(MODEL_RESULTS[selectedModel]);
    setStatus("done");
  }

  return (
    <main className="min-h-screen bg-[#f4f9ff] px-4 py-6 text-[#13233e] sm:px-6 lg:h-screen lg:overflow-hidden lg:px-8 lg:py-4">
      <div className="mx-auto max-w-6xl lg:flex lg:h-full lg:flex-col">
        <header className="mb-8 rounded-2xl bg-gradient-to-r from-[#0b61ce] to-[#1c82ee] px-6 py-6 text-white shadow-lg shadow-[#b8d9fc] lg:mb-3 lg:px-6 lg:py-2">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="mb-3 text-sm font-semibold tracking-wide text-[#ddebff] lg:mb-1 lg:text-xs">
                CREDSURE
              </div>
              <h1 className="font-display text-3xl font-bold lg:text-2xl">
                Loan approval check
              </h1>
              <p className="mt-2 text-base text-[#e6f1ff] lg:mt-1 lg:text-xs">
                Enter an applicant's details to see how likely the loan is to be
                approved.
              </p>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold hover:bg-white/10"
              >
                Sign out
              </button>
            )}
          </div>
        </header>

        <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-4">
          <section className="rounded-2xl border border-[#dbe5f5] bg-white lg:flex lg:flex-col">
            <Section title="Applicant" note="Personal details">
              <div>
                <label className={label}>Age (years)</label>
                <input
                  className={field}
                  type="number"
                  value={values.Age}
                  onChange={set("Age")}
                />
              </div>
              <div>
                <label className={label}>Dependents</label>
                <input
                  className={field}
                  type="number"
                  value={values.Dependents}
                  onChange={set("Dependents")}
                />
              </div>
              <div>
                <span className={label}>Gender</span>
                <div className={group}>
                  <button
                    type="button"
                    className={`${choice} ${active("Gender", "Female")}`}
                    onClick={pick("Gender", "Female")}
                  >
                    Female
                  </button>
                  <button
                    type="button"
                    className={`${choice} ${active("Gender", "Male")}`}
                    onClick={pick("Gender", "Male")}
                  >
                    Male
                  </button>
                </div>
              </div>
              <div>
                <span className={label}>Marital status</span>
                <div className={group}>
                  <button
                    type="button"
                    className={`${choice} ${active("Marital_Status", "Married")}`}
                    onClick={pick("Marital_Status", "Married")}
                  >
                    Married
                  </button>
                  <button
                    type="button"
                    className={`${choice} ${active("Marital_Status", "Single")}`}
                    onClick={pick("Marital_Status", "Single")}
                  >
                    Single
                  </button>
                </div>
              </div>
              <div>
                <span className={label}>Education</span>
                <div className={group}>
                  <button
                    type="button"
                    className={`${choice} ${active("Education_Level", "Graduate")}`}
                    onClick={pick("Education_Level", "Graduate")}
                  >
                    Graduate
                  </button>
                  <button
                    type="button"
                    className={`${choice} ${active("Education_Level", "Not Graduate")}`}
                    onClick={pick("Education_Level", "Not Graduate")}
                  >
                    Not Graduate
                  </button>
                </div>
              </div>
            </Section>

            <Section title="Work and income" note="Monthly figures, in your currency">
              <div>
                <label className={label}>Employment status</label>
                <select
                  className={field}
                  value={values.Employment_Status}
                  onChange={set("Employment_Status")}
                >
                  <option>Salaried</option>
                  <option>Self-employed</option>
                  <option>Unemployed</option>
                </select>
              </div>
              <div>
                <label className={label}>Employer type</label>
                <select
                  className={field}
                  value={values.Employer_Category}
                  onChange={set("Employer_Category")}
                >
                  <option>Government</option>
                  <option>MNC</option>
                  <option>Private</option>
                  <option>Unemployed</option>
                </select>
              </div>
              <div>
                <label className={label}>Applicant income</label>
                <input
                  className={field}
                  type="number"
                  value={values.Applicant_Income}
                  onChange={set("Applicant_Income")}
                />
              </div>
              <div>
                <label className={label}>Co-applicant income</label>
                <input
                  className={field}
                  type="number"
                  value={values.Coapplicant_Income}
                  onChange={set("Coapplicant_Income")}
                />
              </div>
            </Section>

            <Section title="Credit profile" note="These two drive most decisions">
              <div className="sm:col-span-2">
                <div className="flex justify-between">
                  <label className={label}>Credit score</label>
                  <b>{values.Credit_Score}</b>
                </div>
                <input
                  className="w-full accent-[#13233e]"
                  type="range"
                  min="550"
                  max="800"
                  value={values.Credit_Score}
                  onChange={set("Credit_Score")}
                />
              </div>
              <div className="sm:col-span-2">
                <div className="flex justify-between">
                  <label className={label}>Debt-to-income ratio</label>
                  <b>{values.DTI_Ratio}</b>
                </div>
                <input
                  className="w-full accent-[#13233e]"
                  type="range"
                  min="0.1"
                  max="0.6"
                  step="0.01"
                  value={values.DTI_Ratio}
                  onChange={set("DTI_Ratio")}
                />
              </div>
              <div>
                <label className={label}>Existing loans</label>
                <input
                  className={field}
                  type="number"
                  value={values.Existing_Loans}
                  onChange={set("Existing_Loans")}
                />
              </div>
              <div>
                <label className={label}>Savings</label>
                <input
                  className={field}
                  type="number"
                  value={values.Savings}
                  onChange={set("Savings")}
                />
              </div>
              <div>
                <label className={label}>Collateral value</label>
                <input
                  className={field}
                  type="number"
                  value={values.Collateral_Value}
                  onChange={set("Collateral_Value")}
                />
              </div>
            </Section>

            <Section title="Loan request" note="What the applicant is asking for">
              <div>
                <label className={label}>Loan amount</label>
                <input
                  className={field}
                  type="number"
                  value={values.Loan_Amount}
                  onChange={set("Loan_Amount")}
                />
              </div>
              <div>
                <label className={label}>Loan term</label>
                <select
                  className={field}
                  value={values.Loan_Term}
                  onChange={set("Loan_Term")}
                >
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                  <option value="36">36 months</option>
                  <option value="48">48 months</option>
                  <option value="60">60 months</option>
                </select>
              </div>
              <div>
                <label className={label}>Purpose</label>
                <select
                  className={field}
                  value={values.Loan_Purpose}
                  onChange={set("Loan_Purpose")}
                >
                  <option>Business</option>
                  <option>Car</option>
                  <option>Education</option>
                  <option>Home</option>
                  <option>Personal</option>
                </select>
              </div>
              <div>
                <span className={label}>Property area</span>
                <div className={group}>
                  <button
                    type="button"
                    className={`${choice} ${active("Property_Area", "Rural")}`}
                    onClick={pick("Property_Area", "Rural")}
                  >
                    Rural
                  </button>
                  <button
                    type="button"
                    className={`${choice} ${active("Property_Area", "Semiurban")}`}
                    onClick={pick("Property_Area", "Semiurban")}
                  >
                    Semiurban
                  </button>
                  <button
                    type="button"
                    className={`${choice} ${active("Property_Area", "Urban")}`}
                    onClick={pick("Property_Area", "Urban")}
                  >
                    Urban
                  </button>
                </div>
              </div>
            </Section>

            <div className="flex gap-3 border-t border-[#e6eefa] p-6 lg:mt-auto lg:px-4 lg:py-1.5">
              <div>
                <label className={label}>Prediction model</label>
                <select className={field.replace("w-full", "w-40")} value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)}>
                  <option value="linear">Linear Regression</option>
                  <option value="xgboost">XGBoost</option>
                  <option value="tree">Decision Tree</option>
                </select>
              </div>
              <button
                type="button"
                disabled={status === "loading"}
                onClick={submit}
                className="w-40 rounded-lg bg-[#13233e] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 lg:px-4 lg:py-1.5 lg:text-xs"
              >
                {status === "loading" ? "Checking…" : "Check approval chance"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setValues(EXAMPLE);
                  setStatus("idle");
                  setResult(null);
                }}
                className="rounded-lg px-4 py-2.5 text-sm text-[#3d5278] hover:bg-[#eef3fb]"
              >
                Reset to example
              </button>
            </div>
          </section>

          <Result status={status} result={result} />
        </div>
      </div>
    </main>
  );
}
