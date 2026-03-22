import type { NextRequest } from "next/server";

const RESEND_URL = "https://api.resend.com/emails";

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Server misconfiguration: RESEND_API_KEY is not set." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email } = body as { email?: unknown };

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json(
      { error: "A valid email address is required." },
      { status: 400 }
    );
  }

  const html = `
    <div style="font-family: monospace; max-width: 520px; margin: 0 auto; padding: 32px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px;">
      <div style="font-size: 22px; font-weight: 900; color: #64A8F0; margin-bottom: 8px;">LoanLens</div>
      <div style="font-size: 18px; font-weight: 800; color: #111; margin-bottom: 16px;">You're all set for reminders 🎉</div>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        This is a confirmation that email notifications are enabled for your LoanLens account.
        You'll receive reminders about upcoming payment deadlines, milestones, and important
        dates based on your loan details.
      </p>
      <div style="background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 11px; color: #64A8F0; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 6px;">What to expect</div>
        <ul style="color: #374151; font-size: 13px; line-height: 1.8; padding-left: 18px; margin: 0;">
          <li>Grace period &amp; payment due date alerts</li>
          <li>Balance milestone celebrations</li>
          <li>IDR recertification reminders</li>
          <li>Payoff day countdown</li>
        </ul>
      </div>
      <p style="color: #9ca3af; font-size: 12px;">
        The LoanLens Team · LoanLensSHU@gmail.com
      </p>
    </div>
  `;

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "LoanLens <onboarding@resend.dev>",
        to: [email],
        subject: "LoanLens: Email Notifications Enabled",
        html,
      }),
    });

    const data = await res.json() as { id?: string; statusCode?: number; message?: string };

    if (!res.ok) {
      const msg = data.message ?? `Resend API returned ${res.status}`;
      return Response.json({ error: msg }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send email.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
