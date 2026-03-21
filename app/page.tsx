"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function Home() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(134, 239, 172, ${p.alpha})`;
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(134, 239, 172, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <main className="relative min-h-screen bg-[#090f0c] overflow-hidden flex flex-col">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-green-500/5 blur-[120px] pointer-events-none z-0" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-10 py-7">
        <span className="text-green-400 font-mono text-xl font-bold tracking-widest">LOANLENS</span>
        <button
          onClick={() => router.push("/onboarding")}
          className="text-sm font-mono text-green-300 border border-green-800 hover:border-green-400 hover:text-green-100 px-5 py-2 rounded transition-all duration-200"
        >
          Get Started →
        </button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-6 gap-8 mt-[-60px]">
        <div className="inline-flex items-center gap-2 border border-green-900 bg-green-950/40 text-green-400 text-xs font-mono px-4 py-1.5 rounded-full tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          AI-POWERED DEBT STRATEGY
        </div>

        <h1
          className="text-6xl md:text-8xl font-black text-white leading-none tracking-tight"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          See Through
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-emerald-400 to-teal-400">
            Your Debt.
          </span>
        </h1>

        <p className="text-gray-400 text-lg max-w-xl leading-relaxed font-light">
          LoanLens turns your loan and credit card balances into a clear, personalized payoff plan —
          powered by AI that actually understands your situation.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <button
            onClick={() => router.push("/onboarding")}
            className="bg-green-400 hover:bg-green-300 text-black font-bold font-mono px-8 py-4 rounded text-sm tracking-widest transition-all duration-200 shadow-lg shadow-green-900/40"
          >
            BUILD MY PLAN →
          </button>
          <button className="border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 font-mono px-8 py-4 rounded text-sm tracking-widest transition-all duration-200">
            SEE HOW IT WORKS
          </button>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-12 mt-10 border-t border-gray-800 pt-10 w-full max-w-2xl">
          {[
            { value: "$1.7T", label: "Student Loan Debt in the US" },
            { value: "43M", label: "Americans with Student Loans" },
            { value: "20yr", label: "Average Repayment Timeline" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <span className="text-green-400 font-mono text-3xl font-bold">{stat.value}</span>
              <span className="text-gray-500 text-xs tracking-wide">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features row */}
      <section className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-800 border-t border-gray-800 mt-16">
        {[
          { icon: "📊", title: "Payoff Dashboard", desc: "Visualize exactly when you'll be debt-free with interactive charts." },
          { icon: "🤖", title: "AI Advisor", desc: "Chat with an AI that knows your numbers and suggests real strategies." },
          { icon: "🎯", title: "What-If Simulator", desc: "See how paying $50 more per month changes everything." },
        ].map((f) => (
          <div key={f.title} className="bg-[#090f0c] px-10 py-10 flex flex-col gap-3 hover:bg-[#0d1610] transition-colors">
            <span className="text-3xl">{f.icon}</span>
            <h3 className="text-white font-bold font-mono tracking-wide">{f.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}