"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

// Types

type LoanData = {
  name: string | null;
  debt_type: string;
  balance: number;
  interest_rate: number;
  monthly_payment: number;
  monthly_income: number | null;
};

type ChatMessage = { role: "user" | "assistant"; content: string };
type Tab = "command" | "visualizations" | "budget" | "reminders";
type LoanStore = Record<string, LoanData | null>;

// Demo data

const DEMO: LoanData = {
  name: "Alex",
  debt_type: "federal_student_loan",
  balance: 24500,
  interest_rate: 6.5,
  monthly_payment: 350,
  monthly_income: 2800,
};

// Helpers

function calcAmortization(balance: number, annualRate: number, payment: number) {
  const r = annualRate / 100 / 12;
  const minPayment = balance * r;
  if (payment <= minPayment) {
    // Payment doesn't cover interest — loan can never be paid off
    return { months: 0, totalInterest: 0, schedule: [], impossible: true };
  }

  let remaining = balance;
  let totalInterest = 0;
  const schedule: { month: number; balance: number; interest: number; principal: number }[] = [];

  for (let m = 1; remaining > 0.01 && m <= 600; m++) {
    const interest = remaining * r;
    const principal = payment - interest;
    if (principal <= 0) break;
    totalInterest += interest;
    remaining = Math.max(0, remaining - principal);
    schedule.push({
      month: m,
      balance: Math.round(remaining),
      interest: Math.round(interest),
      principal: Math.round(principal),
    });
  }
  return { months: schedule.length, totalInterest: Math.round(totalInterest), schedule, impossible: false };
}

function debtLabel(type: string) {
  const m: Record<string, string> = {
    federal_student_loan: "Federal Student Loan",
    private_student_loan: "Private Student Loan",
    credit_card: "Credit Card (Demo)",
    personal_loan: "Personal Loan",
  };
  return m[type] ?? type;
}

function futureDate(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function fmt(n: number) {
  return n.toLocaleString();
}

// Subcomponents

function StatCard({
  label,
  value,
  sub,
  color = "text-black",
}: {
  label: string;
  value: string;
  sub: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`text-2xl font-black font-mono ${color}`}>{value}</span>
      <span className="text-[11px] text-gray-300 font-mono">{sub}</span>
    </div>
  );
}

const DEBT_TYPES = [
  { value: "federal_student_loan", label: "Federal Student Loan" },
  { value: "private_student_loan", label: "Private Student Loan" },
  { value: "credit_card", label: "Credit Card (Demo)" },
  { value: "personal_loan", label: "Personal Loan" },
];

// Hardcoded demo data shown when Credit Card (Demo) is selected
const CREDIT_CARD_DEMO: LoanData = {
  name: null,
  debt_type: "credit_card",
  balance: 2340,
  interest_rate: 24.99,
  monthly_payment: 85,
  monthly_income: 1400,
};

// Main Dashboard

export default function Dashboard() {
  const router = useRouter();

  const [loan, setLoan] = useState<LoanData>(DEMO);
  const [debtType, setDebtType] = useState(DEMO.debt_type);
  const originalLoan = useRef<LoanData>(DEMO);

  // Tracks filled-in data per debt type. null = not yet entered (will trigger modal).
  // Only credit_card is pre-seeded — the user's real type gets seeded in the useEffect below.
  const [loanStore, setLoanStore] = useState<LoanStore>({
    credit_card: CREDIT_CARD_DEMO,
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [modalForm, setModalForm] = useState({ balance: "", interest_rate: "", monthly_payment: "" });
  const [modalErrors, setModalErrors] = useState({ balance: "", interest_rate: "", monthly_payment: "" });
  const [tab, setTab] = useState<Tab>("command");
  const [extra, setExtra] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi! I'm your LoanLens AI advisor. I already know your loan details. Ask me anything about your payoff strategy, repayment options, or what-if scenarios.`,
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Email notifications state
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [notifyError, setNotifyError] = useState("");

  async function sendNotification(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!notifyEmail.trim() || notifyStatus === "loading") return;
    setNotifyStatus("loading");
    setNotifyError("");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: notifyEmail.trim() }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || data.error) {
        setNotifyError(data.error ?? "Failed to send email.");
        setNotifyStatus("error");
      } else {
        setNotifyStatus("sent");
      }
    } catch {
      setNotifyError("Network error. Please try again.");
      setNotifyStatus("error");
    }
  }

  // Fetch real loan data from Supabase using ?id= URL param
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      // No Supabase id — seed the fallback DEMO type so switching back doesn't re-trigger modal
      setLoanStore((prev) => ({ ...prev, [DEMO.debt_type]: DEMO }));
      return;
    }
    import("@/lib/supabase").then(({ supabase }) => {
      supabase
        .from("loans")
        .select("*")
        .eq("id", id)
        .single()
        .then(({ data }) => {
          if (data) {
            const d = data as LoanData;
            setLoan(d);
            originalLoan.current = d;
            setDebtType(d.debt_type);
            setLoanStore((prev) => ({ ...prev, [d.debt_type]: d }));
            setMessages([{
              role: "assistant",
              content: `Hi${d.name ? ` ${d.name}` : ""}! I'm your LoanLens AI advisor. I already know your loan details. Ask me anything about your payoff strategy, repayment options, or what-if scenarios.`,
            }]);
          }
        });
    });
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Derived calculations

  const effectivePmt = loan.monthly_payment + extra;

  const { months, totalInterest, schedule, impossible } = useMemo(
    () => calcAmortization(loan.balance, loan.interest_rate, effectivePmt),
    [loan.balance, loan.interest_rate, effectivePmt]
  );

  // Base scenario only differs when extra > 0; reuse current result otherwise
  const base = useMemo(
    () => extra === 0
      ? { months, totalInterest, schedule, impossible }
      : calcAmortization(loan.balance, loan.interest_rate, loan.monthly_payment),
    [loan.balance, loan.interest_rate, loan.monthly_payment, extra, months, totalInterest, schedule, impossible]
  );

  const chartData = useMemo(() => {
    const step = Math.max(1, Math.floor(schedule.length / 20));
    return schedule
      .filter((_, i) => i % step === 0 || i === schedule.length - 1)
      .map((d) => ({ label: `Mo ${d.month}`, balance: d.balance, interest: d.interest, principal: d.principal }));
  }, [schedule]);

  const income = loan.monthly_income ?? 2800;
  const needs = Math.round(income * 0.5);
  const wants = Math.round(income * 0.2);
  const savings = Math.max(0, income - needs - wants - effectivePmt);

  const strategies = useMemo(() => {
    const baseInterest = calcAmortization(loan.balance, loan.interest_rate, loan.monthly_payment).totalInterest;
    return [
      { label: "Minimum", extra: 0 },
      { label: "+$50 / mo", extra: 50 },
      { label: "+$100 / mo", extra: 100 },
      { label: "+$200 / mo", extra: 200 },
    ].map(({ label, extra: ex }) => {
      const r = calcAmortization(loan.balance, loan.interest_rate, loan.monthly_payment + ex);
      return {
        label,
        payment: loan.monthly_payment + ex,
        months: r.months,
        totalInterest: r.totalInterest,
        saved: r.impossible ? 0 : baseInterest - r.totalInterest,
        payoffDate: r.impossible ? "Never" : futureDate(r.months),
        impossible: r.impossible,
      };
    });
  }, [loan.balance, loan.interest_rate, loan.monthly_payment]);

  // Chat

  async function sendChat(e: React.SyntheticEvent) {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          loans: {
            loan: {
              name: loan.name,
              debtType: debtLabel(loan.debt_type),
              balance: loan.balance,
              interestRateApr: loan.interest_rate,
              monthlyPayment: loan.monthly_payment,
              monthlyIncome: loan.monthly_income,
            },
            dashboard: {
              extraPaymentPerMonth: extra,
              effectiveMonthlyPayment: effectivePmt,
              monthsToPayoff: months,
              totalInterestEstimate: totalInterest,
              projectedPayoffDate: futureDate(months),
            },
          },
        }),
      });
      const data = (await res.json()) as {
        advice?: string;
        error?: string;
        message?: string;
        reply?: string;
      };
      if (!res.ok) {
        const err =
          typeof data.error === "string"
            ? data.error
            : `Something went wrong (${res.status}).`;
        setMessages((prev) => [...prev, { role: "assistant", content: err }]);
        return;
      }
      const reply =
        (typeof data.advice === "string" && data.advice)
          ? data.advice
          : data.message ?? data.reply ?? "Sorry, I couldn’t generate a reply.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  // Render

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-black flex flex-col">

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-xl font-black tracking-tight hover:text-[#64A8F0] transition-colors"
        >
          LoanLens
        </button>
        <div className="flex items-center gap-3">
          {loan.name && (
            <span className="text-sm text-gray-400 font-mono">Hello, {loan.name}</span>
          )}
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] font-mono text-green-600">Live</span>
          </div>
        </div>
      </nav>

      {/* Stats bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard
            label="Outstanding Balance"
            value={`$${fmt(loan.balance)}`}
            sub={debtLabel(loan.debt_type)}
          />
          <StatCard
            label="Interest Rate"
            value={`${loan.interest_rate}%`}
            sub="Annual APR"
            color="text-[#64A8F0]"
          />
          <StatCard
            label="Total Interest Cost"
            value={impossible ? "N/A" : `$${fmt(totalInterest)}`}
            sub={impossible ? "Payment too low" : "at current pace"}
            color={impossible ? "text-red-400" : "text-red-500"}
          />
          <StatCard
            label="Projected Debt Free"
            value={impossible ? "Never" : futureDate(months)}
            sub={impossible ? "Increase monthly payment" : `${months} months away`}
            color={impossible ? "text-red-400" : "text-green-600"}
          />
        </div>
      </div>

      {/* Tab nav */}
      <div className="bg-white border-b border-gray-100 px-6 max-md:px-3">
        <div className="max-w-7xl mx-auto flex max-md:overflow-x-auto max-md:scrollbar-none">
          {(
            [
              ["command", "Command Center"],
              ["visualizations", "Visualizations"],
              ["budget", "Budget & Strategy"],
              ["reminders", "Reminders"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-3.5 text-sm font-mono border-b-2 transition-all duration-150 whitespace-nowrap ${
                tab === key
                  ? "border-[#64A8F0] text-[#64A8F0] font-bold"
                  : "border-transparent text-gray-400 hover:text-black"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden max-md:flex-col">

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6 max-md:p-4">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">

            


            {tab === "command" && (
              <>
                <h2 className="text-2xl font-black">Loan &amp; Aid Command Center</h2>

                {/* Loan details grid */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-bold text-sm">Your Loan</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPendingType(debtType);
                          setModalForm({
                            balance: String(loan.balance),
                            interest_rate: String(loan.interest_rate),
                            monthly_payment: String(loan.monthly_payment),
                          });
                          setModalErrors({ balance: "", interest_rate: "", monthly_payment: "" });
                          setModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-[#64A8F0] transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M8.5 1.5a1.414 1.414 0 0 1 2 2L4 10 1 11l1-3 6.5-6.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Edit
                      </button>
                      <span className="text-xs font-mono text-[#64A8F0] bg-blue-50 px-2.5 py-0.5 rounded-full border border-[#64A8F0]/20">
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-gray-100">
                    {/* Loan Type — selectable dropdown */}
                    <div className="bg-white px-6 py-4">
                      <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">Loan Type</div>
                      <select
                        value={debtType}
                        onChange={(e) => {
                          const val = e.target.value;
                          const stored = loanStore[val];
                          if (stored) {
                            setDebtType(val);
                            setLoan(stored);
                            setExtra(0);
                          } else {
                            // Not filled in yet — open modal
                            setPendingType(val);
                            setModalForm({ balance: "", interest_rate: "", monthly_payment: "" });
                            setModalErrors({ balance: "", interest_rate: "", monthly_payment: "" });
                            setModalOpen(true);
                          }
                        }}
                        className="text-sm font-bold font-mono text-black bg-transparent border-none outline-none cursor-pointer hover:text-[#64A8F0] transition-colors w-full"
                      >
                        {DEBT_TYPES.map((dt) => (
                          <option key={dt.value} value={dt.value}>{dt.label}</option>
                        ))}
                      </select>
                    </div>
                    {[
                      { label: "Current Balance", value: `$${fmt(loan.balance)}` },
                      { label: "Interest Rate", value: `${loan.interest_rate}% APR` },
                      { label: "Monthly Payment", value: `$${loan.monthly_payment}` },
                      {
                        label: "Monthly Income",
                        value: loan.monthly_income ? `$${fmt(loan.monthly_income)}` : "—",
                      },
                    ].map((row) => (
                      <div key={row.label} className="bg-white px-6 py-4">
                        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                          {row.label}
                        </div>
                        <div className="text-sm font-bold mt-1 font-mono">{row.value}</div>
                      </div>
                    ))}
                    <div className="bg-white" />
                  </div>
                </div>

                {/* Monthly obligations */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-sm mb-4">Monthly Obligations Breakdown</h3>
                  {(() => {
                    const monthlyInterest = Math.round(
                      loan.balance * (loan.interest_rate / 100 / 12)
                    );
                    const monthlyPrincipal = loan.monthly_payment - monthlyInterest;
                    return [
                      {
                        label: "Total loan payment",
                        amount: loan.monthly_payment,
                        pct: Math.round((loan.monthly_payment / income) * 100),
                      },
                      {
                        label: "  → Interest portion (est.)",
                        amount: monthlyInterest,
                        pct: null,
                      },
                      {
                        label: "  → Principal portion (est.)",
                        amount: monthlyPrincipal,
                        pct: null,
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                      >
                        <span className="text-sm text-gray-500 font-mono">{row.label}</span>
                        <div className="flex items-center gap-3">
                          {row.pct !== null && (
                            <span className="text-xs font-mono text-gray-500">
                              {row.pct}% of income
                            </span>
                          )}
                          <span className="text-sm font-bold font-mono">${fmt(row.amount)}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Repayment timeline */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-sm mb-6">Repayment Timeline</h3>
                  <div className="relative pl-4">
                    {/* Vertical track */}
                    <div className="absolute left-7 top-4 bottom-4 w-px bg-gray-100" />
                    <div className="flex flex-col gap-6">
                      {[
                        {
                          dot: "bg-[#64A8F0]",
                          date: "Today",
                          label: "Tracking begins",
                          desc: "LoanLens is now monitoring your loan.",
                        },
                        {
                          dot: "bg-yellow-400",
                          date: futureDate(6),
                          label: "Grace period ends",
                          desc: "Federal loans enter repayment. Know your servicer and payment plan.",
                        },
                        {
                          dot: "bg-orange-400",
                          date: futureDate(8),
                          label: "First payment due",
                          desc: `Minimum payment of $${loan.monthly_payment} will be due.`,
                        },
                        {
                          dot: "bg-purple-400",
                          date: futureDate(24),
                          label: "Projected graduation",
                          desc: "Income-driven repayment options may open up here.",
                        },
                        {
                          dot: "bg-[#64A8F0]",
                          date: futureDate(Math.round(months * 0.5)),
                          label: "50% paid off",
                          desc: "Great time to reassess your strategy.",
                        },
                        {
                          dot: "bg-green-500",
                          date: futureDate(months),
                          label: "Debt Free",
                          desc: "Projected payoff date at your current payment pace.",
                        },
                      ].map((ev, i) => (
                        <div key={i} className="flex items-start gap-4">
                          <div
                            className={`w-8 h-8 rounded-full ${ev.dot} flex-shrink-0 flex items-center justify-center z-10`}
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          </div>
                          <div>
                            <div className="text-[11px] font-mono text-gray-400">{ev.date}</div>
                            <div className="font-bold text-sm">{ev.label}</div>
                            <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{ev.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile AI Chat */}
                <div className="md:hidden bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#64A8F0] flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7" />
                        <line x1="16.5" y1="16.5" x2="22" y2="22" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-sm">LoanLens AI</div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[11px] text-gray-400 font-mono">Powered by Claude</span>
                      </div>
                    </div>
                  </div>

                  <div ref={chatScrollRef} className="h-72 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-[#64A8F0] text-white rounded-br-sm font-mono"
                            : "bg-gray-50 text-gray-700 border border-gray-100 rounded-bl-sm"
                        }`}>
                          {msg.role === "user" ? msg.content : (
                            <ReactMarkdown components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              strong: ({ children }) => <strong className="font-bold text-black">{children}</strong>,
                              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-1">{children}</ol>,
                              li: ({ children }) => <li className="text-gray-700">{children}</li>,
                            }}>{msg.content}</ReactMarkdown>
                          )}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                          {[0, 150, 300].map((d) => (
                            <div key={d} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-4 pt-2 pb-1 border-t border-gray-100 flex gap-1.5 overflow-x-auto">
                    {["Pay $100 more/mo?", "What's IDR?", "Avalanche vs snowball?"].map((q) => (
                      <button key={q} onClick={() => setChatInput(q)}
                        className="flex-shrink-0 text-[10px] font-mono text-[#64A8F0] bg-blue-50 border border-[#64A8F0]/20 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors">
                        {q}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={sendChat} className="px-4 py-3 flex gap-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about your loan..."
                      className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono outline-none focus:border-[#64A8F0] focus:ring-2 focus:ring-[#64A8F0]/20 transition-all"
                    />
                    <button type="submit" disabled={!chatInput.trim() || chatLoading}
                      className="bg-[#64A8F0] hover:bg-[#4a94df] disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition-all flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="currentColor" />
                      </svg>
                    </button>
                  </form>
                </div>
              </>
            )}

            


            {tab === "visualizations" && (
              <>
                <h2 className="text-2xl font-black">Visualizations</h2>

                {/* What-if slider */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h3 className="font-bold text-sm">What-If Simulator</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Drag to see how extra payments change your payoff date and total cost
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black font-mono text-[#64A8F0]">
                        +${extra}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">extra / month</div>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={500}
                    step={10}
                    value={extra}
                    onChange={(e) => setExtra(Number(e.target.value))}
                    className="w-full accent-[#64A8F0] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-gray-300 mt-1 mb-4">
                    <span>$0</span>
                    <span>$500</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: "Months Saved",
                        value: impossible ? "N/A" : extra > 0 ? `${base.months - months} mo` : "—",
                        color: impossible ? "text-red-400" : extra > 0 ? "text-green-600" : "text-gray-300",
                      },
                      {
                        label: "Interest Saved",
                        value: impossible
                          ? "N/A"
                          : extra > 0
                            ? `$${fmt(base.totalInterest - totalInterest)}`
                            : "—",
                        color: impossible ? "text-red-400" : extra > 0 ? "text-green-600" : "text-gray-300",
                      },
                      {
                        label: "New Payoff Date",
                        value: impossible ? "Never" : futureDate(months),
                        color: impossible ? "text-red-400" : "text-[#64A8F0]",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"
                      >
                        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wide">
                          {s.label}
                        </div>
                        <div className={`text-lg font-black font-mono mt-0.5 ${s.color}`}>
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Balance over time */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-sm mb-5">Balance Over Time</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#64A8F0" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#64A8F0" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fontFamily: "monospace" }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 10, fontFamily: "monospace" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(v) => [`$${Number(v).toLocaleString()}`, "Balance"]}
                        contentStyle={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#64A8F0"
                        strokeWidth={2}
                        fill="url(#balGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Principal vs Interest stacked */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-sm mb-1">Principal vs. Interest Per Payment</h3>
                  <p className="text-xs text-gray-400 mb-5">
                    Early payments are mostly interest. Watch principal grow over time.
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fontFamily: "monospace" }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 10, fontFamily: "monospace" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace" }} />
                      <Bar
                        dataKey="principal"
                        name="Principal"
                        stackId="a"
                        fill="#64A8F0"
                      />
                      <Bar
                        dataKey="interest"
                        name="Interest"
                        stackId="a"
                        fill="#fca5a5"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Strategy comparison chart */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-sm mb-1">Payment Strategy Comparison</h3>
                  <p className="text-xs text-gray-400 mb-5">
                    Total interest paid across different extra-payment strategies
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={strategies} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f3f4f6"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fontFamily: "monospace" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        dataKey="label"
                        type="category"
                        tick={{ fontSize: 11, fontFamily: "monospace" }}
                        tickLine={false}
                        axisLine={false}
                        width={90}
                      />
                      <Tooltip
                        formatter={(v) => [
                          `$${Number(v).toLocaleString()}`,
                          "Total Interest",
                        ]}
                        contentStyle={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                        }}
                      />
                      <Bar
                        dataKey="totalInterest"
                        name="Total Interest"
                        fill="#64A8F0"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            
 & STRATEGY

            {tab === "budget" && (
              <>
                <h2 className="text-2xl font-black">Budget &amp; Strategy Engine</h2>

                {/* Monthly cash allocation */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-sm mb-1">Monthly Cash Allocation</h3>
                  <p className="text-xs text-gray-400 mb-5">
                    Based on ${fmt(income)} monthly take-home income
                  </p>
                  <div className="flex flex-col gap-4">
                    {[
                      { name: "Needs", value: needs, color: "#1e293b" },
                      { name: "Loan Payment", value: effectivePmt, color: "#64A8F0" },
                      { name: "Wants", value: wants, color: "#94a3b8" },
                      { name: "Savings", value: savings, color: "#22c55e" },
                    ].map((b) => (
                      <div key={b.name}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-mono text-gray-600">{b.name}</span>
                          <span className="font-bold font-mono">${fmt(b.value)}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.round((b.value / income) * 100))}%`,
                              backgroundColor: b.color,
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-gray-300 font-mono mt-0.5">
                          {Math.round((b.value / income) * 100)}% of income
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Needs / Wants / Obligations buckets */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-sm mb-4">Needs · Wants · Obligations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        label: "Needs",
                        borderColor: "border-[#64A8F0]",
                        bg: "bg-blue-50",
                        accent: "text-[#64A8F0]",
                        amount: needs,
                        items: [
                          "Rent / housing",
                          "Groceries",
                          "Utilities",
                          "Transportation",
                          "Healthcare / medication",
                        ],
                      },
                      {
                        label: "Wants",
                        borderColor: "border-gray-200",
                        bg: "bg-gray-50",
                        accent: "text-gray-600",
                        amount: wants,
                        items: [
                          "Dining out",
                          "Entertainment",
                          "Subscriptions",
                          "Shopping",
                          "Travel",
                        ],
                      },
                      {
                        label: "Obligations",
                        borderColor: "border-orange-200",
                        bg: "bg-orange-50",
                        accent: "text-orange-600",
                        amount: effectivePmt,
                        items: [
                          "Loan payments",
                          "Tuition balance",
                          "Books & fees",
                          "Family support",
                          "Insurance",
                        ],
                      },
                    ].map((bucket) => (
                      <div
                        key={bucket.label}
                        className={`rounded-xl border p-4 ${bucket.borderColor} ${bucket.bg}`}
                      >
                        <div
                          className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-1 ${bucket.accent}`}
                        >
                          {bucket.label}
                        </div>
                        <div className={`text-2xl font-black font-mono mb-3 ${bucket.accent}`}>
                          ${fmt(bucket.amount)}
                        </div>
                        <ul className="flex flex-col gap-1.5">
                          {bucket.items.map((item) => (
                            <li
                              key={item}
                              className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5"
                            >
                              <div className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Repayment strategy table */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-sm">Repayment Strategy Comparison</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      See exactly how much each strategy saves you
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm font-mono">
                      <thead>
                        <tr className="bg-gray-50">
                          {[
                            "Strategy",
                            "Monthly Pmt",
                            "Payoff Date",
                            "Total Interest",
                            "Interest Saved",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-6 py-3 text-left text-[10px] uppercase tracking-widest text-gray-400 font-normal"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {strategies.map((s, i) => (
                          <tr
                            key={s.label}
                            className={`border-t border-gray-50 transition-colors ${
                              i === 0 ? "bg-white" : "hover:bg-blue-50/30"
                            }`}
                          >
                            <td className="px-6 py-3.5 font-bold">{s.label}</td>
                            <td className="px-6 py-3.5 text-[#64A8F0]">${s.payment}</td>
                            <td className={`px-6 py-3.5 ${s.impossible ? "text-red-400" : ""}`}>{s.payoffDate}</td>
                            <td className="px-6 py-3.5 text-red-400">{s.impossible ? "N/A" : `$${fmt(s.totalInterest)}`}</td>
                            <td className="px-6 py-3.5 text-green-600 font-bold">
                              {s.impossible ? "—" : s.saved > 0 ? `$${fmt(s.saved)}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            


            {tab === "reminders" && (
              <>
                <h2 className="text-2xl font-black">Reminder Center</h2>

                {/* Email notifications card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#64A8F0]/10 flex items-center justify-center flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64A8F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M2 8l10 6 10-6" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-sm">Enable Email Notifications</div>
                      <div className="text-xs text-gray-400 font-mono">Get reminders delivered to your inbox</div>
                    </div>
                  </div>

                  {notifyStatus === "sent" ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-green-700 text-sm font-mono">
                        Test email sent to <strong>{notifyEmail}</strong>. Check your inbox!
                      </span>
                    </div>
                  ) : (
                    <form onSubmit={sendNotification} className="flex flex-col gap-3">
                      <input
                        type="email"
                        value={notifyEmail}
                        onChange={(e) => { setNotifyEmail(e.target.value); setNotifyStatus("idle"); setNotifyError(""); }}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#64A8F0] focus:ring-2 focus:ring-[#64A8F0]/20 text-sm font-mono outline-none transition-all"
                      />
                      {notifyError && (
                        <p className="text-red-400 text-xs font-mono">{notifyError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={!notifyEmail.trim() || notifyStatus === "loading"}
                        className="w-full bg-[#64A8F0] hover:bg-[#4a94df] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {notifyStatus === "loading" ? (
                          <>
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            SENDING...
                          </>
                        ) : (
                          "Enable notifications"
                        )}
                      </button>
                    </form>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {[
                    {
                      type: "warning",
                      label: "Grace Period Ends",
                      date: futureDate(6),
                      desc: "Federal loans enter repayment. Contact your servicer now to confirm your repayment plan and avoid missed payments.",
                      urgent: true,
                    },
                    {
                      type: "info",
                      label: "First Payment Due",
                      date: futureDate(8),
                      desc: `Your first minimum payment of $${loan.monthly_payment} will be due. Set up autopay for a 0.25% interest rate discount.`,
                      urgent: false,
                    },
                    {
                      type: "info",
                      label: "IDR Application Window",
                      date: futureDate(9),
                      desc: "If you plan to enroll in an income-driven repayment plan, begin your application at StudentAid.gov at least 30 days before your first payment.",
                      urgent: false,
                    },
                    {
                      type: "info",
                      label: "IDR Recertification Deadline",
                      date: futureDate(11),
                      desc: "Income-driven repayment plans require annual recertification. Missing this can cause your payment to spike to the standard amount.",
                      urgent: false,
                    },
                    {
                      type: "success",
                      label: "25% Balance Milestone",
                      date: futureDate(Math.round(months * 0.25)),
                      desc: `Projected date you'll have paid $${fmt(Math.round(loan.balance * 0.25))} off your principal. Great time to review your strategy.`,
                      urgent: false,
                    },
                    {
                      type: "success",
                      label: "50% Balance Milestone",
                      date: futureDate(Math.round(months * 0.5)),
                      desc: "You're halfway there. Consider increasing payments here. The savings compound significantly in the back half.",
                      urgent: false,
                    },
                    {
                      type: "success",
                      label: "Projected Debt Free",
                      date: futureDate(months),
                      desc: "Your projected debt-free date at the current payment pace. Use the What-If Simulator to pull this date earlier.",
                      urgent: false,
                    },
                  ].map((r, i) => (
                    <div
                      key={i}
                      className={`bg-white rounded-xl border p-5 flex items-start gap-4 ${
                        r.urgent ? "border-orange-200" : "border-gray-100"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg ${
                          r.type === "warning"
                            ? "bg-orange-50"
                            : r.type === "success"
                            ? "bg-green-50"
                            : "bg-blue-50"
                        }`}
                      >
                        {r.type === "warning" ? "⚠️" : r.type === "success" ? "✅" : "📅"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                          <span className="font-bold text-sm">{r.label}</span>
                          <span
                            className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${
                              r.urgent
                                ? "bg-orange-50 text-orange-500 border-orange-200"
                                : r.type === "success"
                                ? "bg-green-50 text-green-600 border-green-100"
                                : "bg-blue-50 text-[#64A8F0] border-[#64A8F0]/20"
                            }`}
                          >
                            {r.date}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">{r.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* AI Chat Sidebar */}
        <div className="w-[480px] flex-shrink-0 flex flex-col h-[calc(100vh-9.5rem)] sticky top-[9.5rem] -mt-6 pt-0 pb-3 pl-3 pr-10 bg-[#f7f8fa] max-md:hidden">
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Chat header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#64A8F0] flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="22" y2="22" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-sm">LoanLens AI</div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] text-gray-400 font-mono">
                  Powered by Claude
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#64A8F0] text-white rounded-br-sm font-mono"
                      : "bg-gray-50 text-gray-700 border border-gray-100 rounded-bl-sm"
                  }`}
                >
                  {msg.role === "user" ? msg.content : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-black">{children}</strong>,
                        h2: ({ children }) => <p className="font-bold text-black mt-2 mb-1">{children}</p>,
                        h3: ({ children }) => <p className="font-semibold text-black mt-1.5 mb-0.5">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-1">{children}</ol>,
                        li: ({ children }) => <li className="text-gray-700">{children}</li>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div className="px-4 pt-3 pb-1 border-t border-gray-100 flex gap-1.5 overflow-x-auto">
            {[
              "Pay $100 more/mo?",
              "What's IDR?",
              "Avalanche vs snowball?",
              "What is capitalization?",
            ].map((q) => (
              <button
                key={q}
                onClick={() => setChatInput(q)}
                className="flex-shrink-0 text-[10px] font-mono text-[#64A8F0] bg-blue-50 border border-[#64A8F0]/20 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={sendChat} className="px-4 py-3 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about your loan..."
              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono outline-none focus:border-[#64A8F0] focus:ring-2 focus:ring-[#64A8F0]/20 transition-all"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="bg-[#64A8F0] hover:bg-[#4a94df] disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition-all flex-shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="currentColor" />
              </svg>
            </button>
          </form>
        </div>
        </div>
      </div>
      {/* Loan Setup Modal */}
      {modalOpen && pendingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="font-black text-lg">Set Up Loan</div>
                <div className="text-xs font-mono text-gray-400 mt-0.5">
                  {DEBT_TYPES.find((d) => d.value === pendingType)?.label}
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-500 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Fields */}
            <div className="px-6 py-5 flex flex-col gap-4">
              {([
                { key: "balance", label: "Total Balance", placeholder: "e.g. 18000", prefix: "$" },
                { key: "interest_rate", label: "Annual Interest Rate", placeholder: "e.g. 6.5", suffix: "%" },
                { key: "monthly_payment", label: "Monthly Payment", placeholder: "e.g. 200", prefix: "$" },
              ] as { key: keyof typeof modalForm; label: string; placeholder: string; prefix?: string; suffix?: string }[]).map(({ key, label, placeholder, prefix, suffix }) => (
                <div key={key}>
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1.5">
                    {label}
                  </label>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#64A8F0] focus-within:ring-2 focus-within:ring-[#64A8F0]/20 transition-all">
                    {prefix && (
                      <span className="px-3 text-sm font-mono text-gray-400 bg-gray-50 border-r border-gray-200 py-2.5">
                        {prefix}
                      </span>
                    )}
                    <input
                      type="number"
                      placeholder={placeholder}
                      value={modalForm[key]}
                      onChange={(e) => {
                        setModalForm((f) => ({ ...f, [key]: e.target.value }));
                        setModalErrors((er) => ({ ...er, [key]: "" }));
                      }}
                      className="flex-1 px-3 py-2.5 text-sm font-mono outline-none bg-white"
                    />
                    {suffix && (
                      <span className="px-3 text-sm font-mono text-gray-400 bg-gray-50 border-l border-gray-200 py-2.5">
                        {suffix}
                      </span>
                    )}
                  </div>
                  {modalErrors[key] && (
                    <p className="text-xs text-red-400 font-mono mt-1">{modalErrors[key]}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Validate
                  const errs = { balance: "", interest_rate: "", monthly_payment: "" };
                  if (!modalForm.balance || Number(modalForm.balance) <= 0) errs.balance = "Required";
                  if (!modalForm.interest_rate || Number(modalForm.interest_rate) <= 0) errs.interest_rate = "Required";
                  if (!modalForm.monthly_payment || Number(modalForm.monthly_payment) <= 0) errs.monthly_payment = "Required";
                  if (errs.balance || errs.interest_rate || errs.monthly_payment) {
                    setModalErrors(errs);
                    return;
                  }
                  const newLoan: LoanData = {
                    name: loan.name,
                    debt_type: pendingType,
                    balance: Number(modalForm.balance),
                    interest_rate: Number(modalForm.interest_rate),
                    monthly_payment: Number(modalForm.monthly_payment),
                    monthly_income: loan.monthly_income,
                  };
                  setLoanStore((prev) => ({ ...prev, [pendingType]: newLoan }));
                  setLoan(newLoan);
                  setDebtType(pendingType);
                  setExtra(0);
                  setModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#64A8F0] hover:bg-[#4a94df] text-white text-sm font-bold font-mono transition-colors"
              >
                Load Loan
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
