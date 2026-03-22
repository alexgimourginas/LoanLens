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
  const { ref: bottomRef, visible: bottomVisible } = useReveal(0.1);

  // Wealth projection data (y = remaining debt, inverted for visual)
  const wealthPoints = [110, 108, 103, 94, 82, 66, 46, 22, 4];

  return (
    <main className="bg-white text-black overflow-x-hidden">

      {/* --STICKY NAV-- */}
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

      {/* Hero */}
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

          {/* Left: Copy */}
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
                className="bg-[#64A8F0] hover:bg-[#4a94df] text-white font-bold px-16 py-4 rounded-xl text-base tracking-wide transition-all duration-200 shadow-lg shadow-[#64A8F0]/25 hover:shadow-[#64A8F0]/40 hover:-translate-y-0.5"
              >
                BUILD MY PLAN →
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

          {/* Right: Monitor */}
          <div className="flex-1 flex justify-center items-center relative">
            {/* Soft glow behind */}
            <div className="absolute w-[350px] h-[350px] rounded-full bg-[#64A8F0]/8 blur-3xl" />

            <div className="relative drop-shadow-2xl max-md:scale-[0.52] max-md:origin-top max-md:-mb-52">
              {/* Screen */}
              <div className="w-[614px] h-[414px] bg-[#070d09] rounded-2xl border-[12px] border-[#374151] overflow-hidden relative">
                {/* Browser bar */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-800/90 border-b border-gray-700/60">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  <div className="flex-1 bg-gray-700/50 rounded-md text-[10px] text-gray-400 px-2.5 py-0.5 ml-2 font-mono">
                    loanlens.vercel.app/dashboard
                  </div>
                </div>

                {/* Dashboard screenshot */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/monitor.png"
                  alt="LoanLens dashboard"
                  className="absolute inset-0 top-9 w-full h-[calc(100%-2.25rem)] object-cover object-left-top"
                />
              </div>

              {/* Stand */}
              <div className="w-14 h-4 bg-[#374151] mx-auto" />
              <div className="w-28 h-2.5 bg-[#374151] mx-auto rounded-b-md" />

              {/* Frame overlay */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/frame.png"
                alt=""
                className="absolute -bottom-20 -right-16 w-56 pointer-events-none"
              />
            </div>
          </div>
        </div>

      </section>

      {/* Wealth + News */}
      <div
        ref={bottomRef}
        className={`transition-all duration-700 delay-100 ${bottomVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      >
        <section className="py-28 bg-white">
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-16">

            {/* Left: Wealth */}
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

            {/* Right: News */}
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
                    tag: "CFPB",
                    title: "The Significant Impact of Student Debt on Communities of Color",
                    desc: "Over 90% of African-American and 72% of Latino students leave college with student loan debt, facing compounding barriers rooted in systemic financial inequality.",
                    date: "Sep 2016",
                    href: "https://www.consumerfinance.gov/about-us/blog/significant-impact-student-debt-communities-color/",
                    img: "/cfpb.jpg",
                  },
                  {
                    tag: "Pew Research",
                    title: "The Student Loan Default Divide: Racial Inequities Play a Role",
                    desc: "Black and Hispanic borrowers are significantly more likely to struggle with repayment than White peers, facing higher default risk tied to degree completion gaps.",
                    date: "Dec 2024",
                    href: "https://www.pew.org/en/research-and-analysis/reports/2024/12/the-student-loan-default-divide-racial-inequities-play-a-role",
                    img: "https://www.pew.org/-/media/post-launch-images/2024/12/gettyimages5379304081jpgmaster/16x9_m.jpg",
                  },
                  {
                    tag: "PBS NewsHour",
                    title: "If you have a money resolution for 2026, start here, experts say",
                    desc: "Experts recommend tackling high-interest debt first, leveraging employer retirement matches, and using structured budgeting tools to build lasting financial health.",
                    date: "Jan 2026",
                    href: "https://www.pbs.org/newshour/economy/expert-tips-for-paying-down-debt-saving-for-retirement-and-other-financial-goals",
                    img: "/pbs.jpg",
                  },
                ].map((article, i) => (
                  <a
                    key={i}
                    href={article.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-4 p-4 bg-gray-50 hover:bg-blue-50/50 rounded-xl border border-gray-100 hover:border-[#64A8F0]/30 transition-all duration-200"
                  >
                    <img
                      src={article.img}
                      alt={article.title}
                      className="w-[72px] h-[72px] rounded-lg object-cover flex-shrink-0"
                    />
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
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
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
