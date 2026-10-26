import brandIcon from "../assets/icon.png";

export function Arrow() {
  return (
    <svg
      className="size-4 fill-none stroke-current stroke-2"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}
export function Eye() {
  return (
    <svg
      className="size-[18px] fill-none stroke-current stroke-[1.7]"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}
export function Brand({ light = false }) {
  return (
    <div
      className={`relative z-10 flex items-center gap-2.5 font-display text-[22px] font-bold tracking-tight ${light ? "text-white" : "text-[#102c52]"}`}
    >
      <img
        className="size-[31px] rounded-lg object-cover"
        src={brandIcon}
        alt="CredSure"
      />
      <span>CredSure</span>
    </div>
  );
}
export function AuthSide() {
  return (
    <aside className="relative hidden min-h-screen flex-col overflow-hidden bg-[#0756ce] px-9 py-10 text-white md:flex lg:px-[clamp(36px,6vw,92px)]">
      <div className="absolute -right-70 -bottom-52 size-155 rounded-full border border-white/15" />
      <div className="absolute -right-41 -bottom-29 size-107 rounded-full border border-white/15" />
      <Brand light />
      <div className="z-10 my-auto max-w-[415px] translate-y-4">
        <p className="mb-3.5 text-[11px] font-bold tracking-[1.3px] text-[#b7d4ff]">
          WELCOME TO CREDSURE
        </p>
        <h1 className="mb-5 font-display text-[clamp(35px,3.6vw,53px)] leading-[1.15] font-bold tracking-[-2px]">
          Make every
          <br />
          credential count.
        </h1>
        <p className="max-w-[380px] text-base leading-7 text-[#dceaff]">
          Manage your professional credentials with confidence, all in one
          secure place.
        </p>
      </div>
      <div className="z-10 flex items-center gap-1.5 text-xs text-[#c8ddff]">
        <span className="h-1.5 w-5 rounded bg-white" />
        <span className="size-1.5 rounded-full bg-[#74a9f5]" />
        <span className="size-1.5 rounded-full bg-[#74a9f5]" />
        <span className="ml-2">Trusted by professionals everywhere</span>
      </div>
    </aside>
  );
}
