const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are LoanLens, a supportive financial coach focused on debt payoff and loan strategy.
You receive the user's current loan balances and details, plus their question.
Give clear, practical, personalized advice. Prefer concrete steps (e.g. avalanche vs snowball, extra payment impact, refinancing considerations) when relevant.
Do not promise specific investment returns or guarantee outcomes. Remind users that you are not a licensed financial advisor when discussing major decisions.
Keep answers focused and readable; use short sections or bullets when helpful.`;

type AnthropicContentBlock = { type: string; text?: string };

function textFromContent(content: AnthropicContentBlock[]): string {
  const parts: string[] = [];
  for (const block of content) {
    if (block.type === "text" && typeof block.text === "string") {
      parts.push(block.text);
    }
  }
  return parts.join("");
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Server misconfiguration: ANTHROPIC_API_KEY is not set." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Expected a JSON object." }, { status: 400 });
  }

  const { message, loans } = body as {
    message?: unknown;
    loans?: unknown;
  };

  if (typeof message !== "string" || message.trim().length === 0) {
    return Response.json(
      { error: "Field \"message\" is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  const loanContext =
    loans === undefined
      ? "No structured loan data was provided."
      : typeof loans === "string"
        ? loans
        : JSON.stringify(loans, null, 2);

  const userContent = `## User loan context\n${loanContext}\n\n## User message\n${message.trim()}`;

  try {
    const res = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    const data = (await res.json()) as {
      content?: AnthropicContentBlock[];
      error?: { message?: string };
    };

    if (!res.ok) {
      const errMsg =
        data.error?.message ?? `Claude API returned ${res.status}`;
      return Response.json({ error: errMsg }, { status: 502 });
    }

    const content = data.content;
    if (!Array.isArray(content)) {
      return Response.json(
        { error: "Unexpected response shape from Claude API." },
        { status: 502 }
      );
    }

    const advice = textFromContent(content);
    return Response.json({ advice });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Claude API request failed.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
