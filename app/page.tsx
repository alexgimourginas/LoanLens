"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export default function Home() {
  const router = useRouter();
  const chartSection = useReveal(0.15);
  const bottomSection = useReveal(0.1);

  // Wealth projection data (y = remaining debt, inverted for visual)
  const wealthPoints = [110, 108, 103, 94, 82, 66, 46, 22, 4];

  return (
    <main className="bg-white text-black overflow-x-hidden">

      {/* ─── STICKY NAV ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-white/95 backdrop-blur-md border-b-2 border-gray-300 shadow-md">
        <div className="flex flex-col gap-0.5">
          <span className="text-4xl font-black tracking-tight text-black">LoanLens</span>
          <span className="text-[10px] font-mono text-[#64A8F0] uppercase tracking-[0.2em]">AI-Powered Debt Strategy</span>
        </div>
        <a
          href="mailto:LoanLensSHU@gmail.com"
          className="text-sm font-mono text-gray-400 hover:text-[#64A8F0] transition-colors duration-200"
        >
          LoanLensSHU@gmail.com
        </a>
      </nav>

      {/* ─── SECTION 1: HERO (slightly cut off) ─────────────────────── */}
      <section className="relative min-h-[92vh] pt-24 overflow-hidden bg-white flex flex-col">

        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Blue glow top-right */}
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-[#64A8F0]/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-8 md:px-16 flex flex-col md:flex-row items-center gap-16 py-12">

          {/* ── Left: Copy ── */}
          <div className="flex-1 flex flex-col gap-7">
            <h1 className="text-[clamp(3rem,6vw,5rem)] font-black leading-[1.02] tracking-tight text-black">
              See Through
              <br />
              <span className="text-[#64A8F0]">Your Debt.</span>
            </h1>

            <p className="text-gray-500 text-[1.05rem] max-w-[420px] leading-relaxed">
              LoanLens breaks barriers in underserved student finance, molding stigma
              into clarity and confidence with our accessible tools.
            </p>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => router.push("/onboarding")}
                className="bg-[#64A8F0] hover:bg-[#4a94df] text-white font-bold px-8 py-3.5 rounded-xl text-sm tracking-wide transition-all duration-200 shadow-lg shadow-[#64A8F0]/25 hover:shadow-[#64A8F0]/40 hover:-translate-y-0.5"
              >
                BUILD MY PLAN →
              </button>
              <button className="border border-gray-200 hover:border-[#64A8F0]/50 text-gray-500 hover:text-[#64A8F0] px-8 py-3.5 rounded-xl text-sm transition-all duration-200">
                See How It Works
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-10 pt-6 border-t border-gray-100">
              {[
                { value: "$1.7T", label: "Student Loan Debt in the US" },
                { value: "43M", label: "Americans with Student Loans" },
                { value: "20yr", label: "Average Repayment Timeline" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[1.6rem] font-black font-mono text-[#64A8F0]">{s.value}</div>
                  <div className="text-[11px] text-gray-400 font-mono uppercase tracking-wide mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Monitor mockup ── */}
          <div className="flex-1 flex justify-center items-center relative">
            {/* Soft glow behind */}
            <div className="absolute w-[350px] h-[350px] rounded-full bg-[#64A8F0]/8 blur-3xl" />

            <div className="relative drop-shadow-2xl">
              {/* Screen */}
              <div className="w-[614px] h-[414px] bg-[#070d09] rounded-2xl border-[12px] border-[#374151] overflow-hidden relative">
                {/* Browser bar */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-800/90 border-b border-gray-700/60">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  <div className="flex-1 bg-gray-700/50 rounded-md text-[10px] text-gray-400 px-2.5 py-0.5 ml-2 font-mono">
                    loanlens.app/dashboard
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="absolute inset-0 top-9 p-3 flex flex-col gap-2.5">
                  {/* Stat cards */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "BALANCE", value: "$24,500", color: "text-[#64A8F0]" },
                      { label: "PAYOFF", value: "38 mo", color: "text-green-400" },
                      { label: "SAVED", value: "$3,210", color: "text-emerald-300" },
                    ].map((c) => (
                      <div key={c.label} className="bg-gray-800/80 rounded-lg p-2">
                        <div className="text-[7px] text-gray-500 font-mono uppercase tracking-widest">{c.label}</div>
                        <div className={`text-[13px] font-bold font-mono mt-0.5 ${c.color}`}>{c.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Mini chart */}
                  <div className="flex-1 bg-gray-800/60 rounded-lg p-2 flex flex-col gap-1">
                    <div className="text-[7px] text-gray-500 font-mono uppercase tracking-widest">Balance Over Time</div>
                    <svg viewBox="0 0 240 52" className="w-full flex-1" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="mini-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#64A8F0" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#64A8F0" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,5 C20,6 40,10 75,20 C110,30 150,42 210,50 L240,51"
                        stroke="#64A8F0" strokeWidth="1.5" fill="none" strokeLinecap="round"
                      />
                      <path
                        d="M0,5 C20,6 40,10 75,20 C110,30 150,42 210,50 L240,51 L240,52 L0,52 Z"
                        fill="url(#mini-grad)"
                      />
                    </svg>
                  </div>

                  {/* AI message */}
                  <div className="bg-gray-800/60 rounded-lg px-2.5 py-2 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#64A8F0] flex-shrink-0 flex items-center justify-center">
                      <span className="text-[7px] font-bold text-white">AI</span>
                    </div>
                    <div className="text-[8px] text-gray-300 font-mono leading-relaxed">
                      Pay $50 extra/mo → save $890 in interest &amp; finish 6 months early
                    </div>
                  </div>
                </div>
              </div>

              {/* Stand */}
              <div className="w-14 h-4 bg-[#374151] mx-auto" />
              <div className="w-28 h-2.5 bg-[#374151] mx-auto rounded-b-md" />
            </div>
          </div>
        </div>

      </section>

      {/* ─── SECTION 2: COMPETITOR QUADRANT CHART ────────────────────── */}
      <div
        ref={chartSection.ref}
        className={`transition-all duration-700 ${chartSection.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      >
        <section className="py-14 bg-gray-200">
          <div className="max-w-5xl mx-auto px-8">

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-block bg-[#64A8F0]/10 border border-[#64A8F0]/20 text-[#64A8F0] text-[clamp(0.75rem,1.5vw,1.125rem)] font-mono px-3 py-1.5 rounded-full mb-4 uppercase tracking-[0.2em]">
                Competitive Landscape
              </div>
              <h2 className="text-[clamp(3rem,6vw,4.5rem)] font-black tracking-tight text-black">
                Where LoanLens Stands
              </h2>
            </div>

            {/* Chart card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Quadrant background tints */}
              <div className="relative">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
                  <div className="bg-gray-50/60 border-b border-r border-gray-100" />
                  <div className="bg-blue-50/30 border-b border-gray-100" />
                  <div className="bg-gray-50/60 border-r border-gray-100" />
                  <div className="bg-gray-50/60" />
                </div>

                <div className="relative flex justify-center py-8 px-4">
                  <svg
                    width="520"
                    height="520"
                    viewBox="-115 -115 230 230"
                    className="max-w-full"
                  >
                    {/* Grid lines */}
                    {[-80, -60, -40, -20, 20, 40, 60, 80].map((v) => (
                      <g key={v}>
                        <line x1={v} y1="-100" x2={v} y2="100" stroke="#f3f4f6" strokeWidth="0.8" />
                        <line x1="-100" y1={v} x2="100" y2={v} stroke="#f3f4f6" strokeWidth="0.8" />
                      </g>
                    ))}

                    {/* Main axes */}
                    <line x1="-100" y1="0" x2="100" y2="0" stroke="#d1d5db" strokeWidth="1.2" />
                    <line x1="0" y1="-100" x2="0" y2="100" stroke="#d1d5db" strokeWidth="1.2" />

                    {/* Arrowheads */}
                    <polygon points="101,0 95,-3.5 95,3.5" fill="#d1d5db" />
                    <polygon points="-101,0 -95,-3.5 -95,3.5" fill="#d1d5db" />
                    <polygon points="0,-101 -3.5,-95 3.5,-95" fill="#d1d5db" />
                    <polygon points="0,101 -3.5,95 3.5,95" fill="#d1d5db" />

                    {/* Axis labels */}
                    <text x="105" y="3" fontSize="5" fill="#9ca3af" fontFamily="monospace" fontWeight="bold">High AI</text>
                    <text x="-113" y="3" fontSize="5" fill="#9ca3af" fontFamily="monospace" fontWeight="bold">Low AI</text>
                    <text x="-20" y="-104" fontSize="5" fill="#9ca3af" fontFamily="monospace" fontWeight="bold">Advanced</text>
                    <text x="-10" y="111" fontSize="5" fill="#9ca3af" fontFamily="monospace" fontWeight="bold">Basic</text>

                    {/* Quadrant labels */}
                    <text x="8" y="-82" fontSize="6" fill="#d1d5db" fontFamily="monospace" fontStyle="italic">Intelligent &amp; Advanced</text>
                    <text x="-108" y="-82" fontSize="6" fill="#d1d5db" fontFamily="monospace" fontStyle="italic">Limited AI</text>
                    <text x="8" y="89" fontSize="6" fill="#d1d5db" fontFamily="monospace" fontStyle="italic">AI, Basic Features</text>
                    <text x="-108" y="89" fontSize="6" fill="#d1d5db" fontFamily="monospace" fontStyle="italic">Legacy Tools</text>

                    {/* ── Competitor A ── */}
                    <circle cx="-52" cy="22" r="7" fill="#94a3b8" opacity="0.85" />
                    <text x="-52" y="36" fontSize="6" fill="#94a3b8" textAnchor="middle" fontFamily="monospace">Competitor A</text>

                    {/* ── Competitor B ── */}
                    <circle cx="-60" cy="-38" r="7" fill="#94a3b8" opacity="0.85" />
                    <text x="-60" y="-46" fontSize="6" fill="#94a3b8" textAnchor="middle" fontFamily="monospace">Competitor B</text>

                    {/* ── LoanLens ── */}
                    {/* Outer pulse ring */}
                    <circle cx="62" cy="-62" r="16" fill="#64A8F0" opacity="0.12" />
                    <circle cx="62" cy="-62" r="11" fill="#64A8F0" />
                    <text
                      x="62" y="-76"
                      fontSize="7"
                      fill="#64A8F0"
                      textAnchor="middle"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      LoanLens ★
                    </text>
                  </svg>
                </div>
              </div>

              {/* Legend bar */}
              <div className="flex justify-center gap-8 py-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-[#94a3b8]" />
                  Competitor
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#64A8F0] font-bold">
                  <div className="w-3 h-3 rounded-full bg-[#64A8F0]" />
                  LoanLens
                </div>
                <div className="text-xs font-mono text-gray-300">
                  X axis: AI Capability &nbsp;·&nbsp; Y axis: Feature Depth
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ─── SECTION 3: WEALTH PROJECTION + NEWS ────────────────────── */}
      <div
        ref={bottomSection.ref}
        className={`transition-all duration-700 delay-100 ${bottomSection.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      >
        <section className="py-28 bg-white">
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-16">

            {/* ── Left: Wealth Projection ── */}
            <div className="flex flex-col gap-6">
              <div>
                <div className="inline-block bg-[#64A8F0]/10 border border-[#64A8F0]/20 text-[#64A8F0] text-[11px] font-mono px-3 py-1.5 rounded-full mb-4 uppercase tracking-[0.2em]">
                  Wealth Projection
                </div>
                <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-black tracking-tight leading-tight">
                  Your Path to
                  <br />
                  <span className="text-[#64A8F0]">Financial Freedom</span>
                </h2>
                <p className="text-gray-400 mt-3 text-sm leading-relaxed max-w-sm">
                  Once your debt is cleared, redirect every payment into wealth. See
                  what your financial future looks like, in real numbers.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">
                    Projected Net Worth
                  </span>
                  <span className="text-[11px] font-mono text-[#64A8F0] bg-blue-50 px-2.5 py-0.5 rounded-full border border-[#64A8F0]/20">
                    +410% over 8 yrs
                  </span>
                </div>

                <svg viewBox="0 0 300 120" className="w-full">
                  <defs>
                    <linearGradient id="wealth-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#64A8F0" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#64A8F0" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[30, 60, 90].map((y) => (
                    <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#f3f4f6" strokeWidth="1" />
                  ))}
                  {(() => {
                    const coords = wealthPoints.map((y, i) => ({ x: Math.round(i * (300 / 8)), y }));
                    const pts = coords.map((p) => `${p.x},${p.y}`).join(" ");
                    const area = `${pts} 300,115 0,115`;
                    return (
                      <>
                        <polygon points={area} fill="url(#wealth-grad)" />
                        <polyline points={pts} fill="none" stroke="#64A8F0" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                        {coords.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#64A8F0" strokeWidth="1.5" />
                        ))}
                      </>
                    );
                  })()}
                  {["Now", "1yr", "2yr", "3yr", "4yr", "5yr", "6yr", "7yr", "8yr"].map(
                    (l, i) => (
                      <text
                        key={l}
                        x={Math.round(i * (300 / 8))}
                        y="118"
                        fontSize="7"
                        fill="#9ca3af"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {l}
                      </text>
                    )
                  )}
                </svg>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Debt Free By", value: "2027" },
                    { label: "Savings @ 5yr", value: "$42K" },
                    { label: "Net Worth @ 8yr", value: "$94K" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-white rounded-xl p-3 border border-gray-100 text-center"
                    >
                      <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wide">
                        {s.label}
                      </div>
                      <div className="text-[1.1rem] font-black font-mono text-[#64A8F0] mt-0.5">
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: News Articles ── */}
            <div className="flex flex-col gap-6">
              <div>
                <div className="inline-block bg-gray-100 border border-gray-200 text-gray-500 text-[11px] font-mono px-3 py-1.5 rounded-full mb-4 uppercase tracking-[0.2em]">
                  In the News
                </div>
                <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-black tracking-tight leading-tight">
                  Why Debt Strategy
                  <br />
                  <span className="text-[#64A8F0]">Matters Now</span>
                </h2>
                <p className="text-gray-400 mt-3 text-sm leading-relaxed max-w-sm">
                  The debt crisis is accelerating. Tools like LoanLens are more relevant
                  than ever.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  {
                    tag: "Student Loans",
                    title: "Federal student loan debt hits record $1.77T as forgiveness stalls",
                    desc: "With relief programs caught in legal limbo, borrowers are turning to AI tools to model their own payoff strategies independently.",
                    date: "Mar 2025",
                  },
                  {
                    tag: "Credit Cards",
                    title: "Credit card rates near 22%, the highest in 40 years",
                    desc: "Consumers carrying balances are paying more in interest than ever, making strategic paydown plans essential for financial health.",
                    date: "Feb 2025",
                  },
                  {
                    tag: "Personal Finance",
                    title: "Gen Z leads surge in AI-powered financial planning tools",
                    desc: "A new wave of financially aware young adults is driving demand for personalized, data-driven debt management platforms.",
                    date: "Jan 2025",
                  },
                ].map((article, i) => (
                  <div
                    key={i}
                    className="group flex gap-4 p-4 bg-gray-50 hover:bg-blue-50/50 rounded-xl border border-gray-100 hover:border-[#64A8F0]/30 transition-all duration-200 cursor-pointer"
                  >
                    {/* Placeholder image thumbnail */}
                    <div className="w-[72px] h-[72px] rounded-lg bg-[#64A8F0]/15 flex-shrink-0 flex items-center justify-center">
                      <div className="w-7 h-7 rounded bg-gradient-to-br from-[#64A8F0]/50 to-[#4a94df]/50" />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#64A8F0] bg-blue-50 px-2 py-0.5 rounded-full border border-[#64A8F0]/20">
                          {article.tag}
                        </span>
                        <span className="text-[10px] text-gray-300 font-mono">
                          {article.date}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold leading-snug text-black group-hover:text-[#64A8F0] transition-colors duration-200 line-clamp-2">
                        {article.title}
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                        {article.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ─── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="bg-black text-gray-500 py-10 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-white font-black text-lg tracking-tight">LoanLens</span>
          <span className="text-sm font-mono text-gray-600">
            Built for people who are done guessing.
          </span>
          <a
            href="mailto:LoanLensSHU@gmail.com"
            className="text-sm font-mono hover:text-[#64A8F0] transition-colors"
          >
            LoanLensSHU@gmail.com
          </a>
        </div>
      </footer>
    </main>
  );
}
