import { useState } from "react";
import { Arrow, AuthSide, Brand, Eye } from "../components/Brand";

const inputClass =
  "mt-2 h-12 w-full rounded-lg border border-[#d9e3ef] bg-white px-3.5 text-[#152842] outline-none placeholder:text-[#a5b3c5] focus:border-[#2075df] focus:ring-3 focus:ring-[#e8f2ff]";
export default function Signup({ onLogin, onDashboard }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <main className="grid min-h-screen md:grid-cols-[minmax(390px,44%)_1fr]">
      <AuthSide />
      <section className="flex min-h-screen items-start justify-center bg-white px-6 pt-7 md:items-center md:px-8 md:py-12">
        <div className="w-full max-w-[425px]">
          <div className="mb-14 md:hidden">
            <Brand />
          </div>
          <p className="mb-3.5 text-[11px] font-bold tracking-[1.3px] text-[#1670df]">
            GET STARTED
          </p>
          <h2 className="mb-2 font-display text-[31px] leading-tight font-bold tracking-tight text-[#13233e]">
            Create your account
          </h2>
          <p className="text-sm leading-6 text-[#6d7f98]">
            Build your verified professional profile in minutes.
          </p>
          <form
            className="mt-8"
            onSubmit={(event) => {
              event.preventDefault();
              onDashboard();
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <label className="mb-5 block text-[13px] font-semibold text-[#304562]">
                First name
                <input className={inputClass} placeholder="Aarav" required />
              </label>
              <label className="mb-5 block text-[13px] font-semibold text-[#304562]">
                Last name
                <input className={inputClass} placeholder="Sharma" required />
              </label>
            </div>
            <label className="mb-5 block text-[13px] font-semibold text-[#304562]">
              Work email
              <input
                className={inputClass}
                type="email"
                placeholder="you@company.com"
                required
              />
            </label>
            <label className="mb-5 block text-[13px] font-semibold text-[#304562]">
              Password
              <div className="relative">
                <input
                  className={`${inputClass} pr-12`}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  required
                />
                <button
                  className="absolute top-5 right-3.5 text-[#7890ad]"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Eye />
                </button>
              </div>
            </label>
            <label className="mb-6 flex items-center gap-2 text-[13px] font-normal text-[#677991]">
              <input
                className="size-4 accent-[#116cdb]"
                type="checkbox"
                required
              />
              <span>
                I agree to the{" "}
                <a className="text-[#146fdc]" href="#terms">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a className="text-[#146fdc]" href="#privacy">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            <button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0963d7] font-semibold text-white shadow-lg shadow-[#b7d5fa] hover:bg-[#0755ba]">
              Create account <Arrow />
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-[#74859a]">
            Already have an account?{" "}
            <button className="font-semibold text-[#1269d8]" onClick={onLogin}>
              Sign in
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
