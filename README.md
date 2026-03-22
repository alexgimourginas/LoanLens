# LoanLens

**AI-powered debt payoff strategist built for students.**

LoanLens breaks barriers in underserved student finance — turning confusing loan data into a clear, personalized payoff plan with an AI advisor that actually knows your numbers.

---

## Features

- **Onboarding** — enter your loan details in under 2 minutes, no account required
- **Dashboard** — command center with live stats, payoff timeline, and amortization charts
- **AI Advisor** — chat with an AI that already knows your loan and gives concrete, personalized advice
- **What-If Simulator** — see how extra monthly payments change your payoff date and total interest
- **Budget Engine** — 50/30/20 breakdown based on your income and loan obligations
- **Reminders** — upcoming deadlines and milestones calculated from your loan data
- **Email Notifications** — opt-in reminders delivered to your inbox via Resend
- **Multi-loan support** — switch between debt types in a single session
- **Mobile responsive** — full experience on desktop and mobile

## Tech Stack

- [Next.js](https://nextjs.org) — App Router, API routes
- [Tailwind CSS](https://tailwindcss.com) — styling
- [Supabase](https://supabase.com) — loan data persistence (no auth, UUID-based links)
- [Anthropic Claude](https://anthropic.com) — AI advisor
- [Resend](https://resend.com) — email notifications
- [Recharts](https://recharts.org) — data visualizations

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env.local` file in the root:

```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RESEND_API_KEY=
```

## Contact

LoanLensSHU@gmail.com
