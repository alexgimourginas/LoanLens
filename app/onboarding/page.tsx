"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const DEBT_TYPES = [
  { value: "federal_student_loan", label: "Federal Student Loan" },
  { value: "private_student_loan", label: "Private Student Loan" },
  { value: "credit_card", label: "Credit Card" },
  { value: "personal_loan", label: "Personal Loan" },
];

type FormData = {
  name: string;
  debt_type: string;
  balance: string;
  interest_rate: string;
  monthly_payment: string;
  monthly_income: string;
};

const EMPTY: FormData = {
  name: "",
  debt_type: "",
  balance: "",
  interest_rate: "",
  monthly_payment: "",
  monthly_income: "",
};

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  function set(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validateStep1() {
    const e: Partial<FormData> = {};
    if (!form.debt_type) e.debt_type = "Please select a debt type.";
    if (!form.balance || isNaN(Number(form.balance)) || Number(form.balance) <= 0)
      e.balance = "Enter a valid balance.";
    if (
      !form.interest_rate ||
      isNaN(Number(form.interest_rate)) ||
      Number(form.interest_rate) <= 0
    )
      e.interest_rate = "Enter a valid interest rate.";
    if (
      !form.monthly_payment ||
      isNaN(Number(form.monthly_payment)) ||
      Number(form.monthly_payment) <= 0
    )
      e.monthly_payment = "Enter a valid monthly payment.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (validateStep1()) setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setServerError("");

    const { data, error } = await supabase
      .from("loans")
      .insert({
        name: form.name || null,
        debt_type: form.debt_type,
        balance: Number(form.balance),
        interest_rate: Number(form.interest_rate),
        monthly_payment: Number(form.monthly_payment),
        monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
      })
      .select("id")
      .single();

    if (error || !data) {
      setServerError("Something went wrong saving your data. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push(`/dashboard?id=${data.id}`);
  }

  const debtTypeLabel =
    DEBT_TYPES.find((d) => d.value === form.debt_type)?.label ?? "";

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <button
          onClick={() => router.push("/")}
          className="text-xl font-black tracking-tight text-black hover:text-[#64A8F0] transition-colors"
        >
          LoanLens
        </button>
        <span className="text-xs font-mono text-gray-300 uppercase tracking-widest">
          Step {step} of 2
        </span>
      </nav>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-1 bg-[#64A8F0] transition-all duration-500"
          style={{ width: step === 1 ? "50%" : "100%" }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg">

          {/* ── STEP 1: Debt details ── */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8">
                <div className="inline-block bg-[#64A8F0]/10 border border-[#64A8F0]/20 text-[#64A8F0] text-[11px] font-mono px-3 py-1.5 rounded-full mb-4 uppercase tracking-[0.2em]">
                  Your Debt Info
                </div>
                <h1 className="text-3xl font-black tracking-tight text-black">
                  Tell us about your debt
                </h1>
                <p className="text-gray-400 mt-2 text-sm">
                  We use this to calculate your payoff timeline and build your plan.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                {/* Debt type */}
                <div>
                  <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
                    Debt Type <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DEBT_TYPES.map((dt) => (
                      <button
                        key={dt.value}
                        type="button"
                        onClick={() => set("debt_type", dt.value)}
                        className={`px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all duration-150 ${
                          form.debt_type === dt.value
                            ? "border-[#64A8F0] bg-blue-50 text-[#64A8F0]"
                            : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-black"
                        }`}
                      >
                        {dt.label}
                      </button>
                    ))}
                  </div>
                  {errors.debt_type && (
                    <p className="text-red-400 text-xs mt-1.5 font-mono">{errors.debt_type}</p>
                  )}
                </div>

                {/* Balance */}
                <div>
                  <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
                    Total Balance ($) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">$</span>
                    <input
                      type="number"
                      value={form.balance}
                      onChange={(e) => set("balance", e.target.value)}
                      placeholder="24,500"
                      className={`w-full pl-8 pr-4 py-3.5 rounded-xl border text-sm font-mono bg-white text-black placeholder:text-gray-300 outline-none transition-all duration-150 focus:ring-2 focus:ring-[#64A8F0]/30 ${
                        errors.balance ? "border-red-300" : "border-gray-200 focus:border-[#64A8F0]"
                      }`}
                    />
                  </div>
                  {errors.balance && (
                    <p className="text-red-400 text-xs mt-1.5 font-mono">{errors.balance}</p>
                  )}
                </div>

                {/* Interest rate + Monthly payment side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
                      Interest Rate (%) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={form.interest_rate}
                        onChange={(e) => set("interest_rate", e.target.value)}
                        placeholder="6.5"
                        className={`w-full pl-4 pr-8 py-3.5 rounded-xl border text-sm font-mono bg-white text-black placeholder:text-gray-300 outline-none transition-all duration-150 focus:ring-2 focus:ring-[#64A8F0]/30 ${
                          errors.interest_rate ? "border-red-300" : "border-gray-200 focus:border-[#64A8F0]"
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">%</span>
                    </div>
                    {errors.interest_rate && (
                      <p className="text-red-400 text-xs mt-1.5 font-mono">{errors.interest_rate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
                      Min. Monthly Pmt <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">$</span>
                      <input
                        type="number"
                        value={form.monthly_payment}
                        onChange={(e) => set("monthly_payment", e.target.value)}
                        placeholder="350"
                        className={`w-full pl-7 pr-4 py-3.5 rounded-xl border text-sm font-mono bg-white text-black placeholder:text-gray-300 outline-none transition-all duration-150 focus:ring-2 focus:ring-[#64A8F0]/30 ${
                          errors.monthly_payment ? "border-red-300" : "border-gray-200 focus:border-[#64A8F0]"
                        }`}
                      />
                    </div>
                    {errors.monthly_payment && (
                      <p className="text-red-400 text-xs mt-1.5 font-mono">{errors.monthly_payment}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full bg-[#64A8F0] hover:bg-[#4a94df] text-white font-bold py-4 rounded-xl text-sm tracking-wide transition-all duration-200 shadow-lg shadow-blue-100 hover:shadow-blue-200 hover:-translate-y-0.5 mt-2"
                >
                  CONTINUE →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Optional info + confirm ── */}
          {step === 2 && (
            <form
              onSubmit={handleSubmit}
              className="animate-in fade-in slide-in-from-right-4 duration-300"
            >
              <div className="mb-8">
                <div className="inline-block bg-[#64A8F0]/10 border border-[#64A8F0]/20 text-[#64A8F0] text-[11px] font-mono px-3 py-1.5 rounded-full mb-4 uppercase tracking-[0.2em]">
                  Almost There
                </div>
                <h1 className="text-3xl font-black tracking-tight text-black">
                  A couple more details
                </h1>
                <p className="text-gray-400 mt-2 text-sm">
                  These are optional but help the AI give you better advice.
                </p>
              </div>

              {/* Summary of step 1 */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 flex flex-col gap-1.5">
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">Your debt summary</div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-mono">Type</span>
                  <span className="font-bold font-mono text-black">{debtTypeLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-mono">Balance</span>
                  <span className="font-bold font-mono text-black">${Number(form.balance).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-mono">Rate</span>
                  <span className="font-bold font-mono text-black">{form.interest_rate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-mono">Monthly Payment</span>
                  <span className="font-bold font-mono text-black">${Number(form.monthly_payment).toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] font-mono text-[#64A8F0] hover:underline text-left mt-1"
                >
                  ← Edit
                </button>
              </div>

              <div className="flex flex-col gap-5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
                    Your Name <span className="text-gray-300">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Alex"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#64A8F0] text-sm font-mono bg-white text-black placeholder:text-gray-300 outline-none transition-all duration-150 focus:ring-2 focus:ring-[#64A8F0]/30"
                  />
                  <p className="text-gray-300 text-[11px] font-mono mt-1.5">
                    Used to personalize your AI advisor
                  </p>
                </div>

                {/* Monthly income */}
                <div>
                  <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
                    Monthly Take-Home Income ($) <span className="text-gray-300">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">$</span>
                    <input
                      type="number"
                      value={form.monthly_income}
                      onChange={(e) => set("monthly_income", e.target.value)}
                      placeholder="4,200"
                      className="w-full pl-8 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#64A8F0] text-sm font-mono bg-white text-black placeholder:text-gray-300 outline-none transition-all duration-150 focus:ring-2 focus:ring-[#64A8F0]/30"
                    />
                  </div>
                  <p className="text-gray-300 text-[11px] font-mono mt-1.5">
                    Helps calculate what extra payments you can realistically afford
                  </p>
                </div>

                {serverError && (
                  <div className="bg-red-50 border border-red-200 text-red-500 text-sm font-mono px-4 py-3 rounded-xl">
                    {serverError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#64A8F0] hover:bg-[#4a94df] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-sm tracking-wide transition-all duration-200 shadow-lg shadow-blue-100 hover:shadow-blue-200 hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-3"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      BUILDING YOUR PLAN...
                    </>
                  ) : (
                    "BUILD MY PLAN →"
                  )}
                </button>

                <p className="text-center text-[11px] font-mono text-gray-300">
                  No account required. Your plan is accessible via a private link.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
