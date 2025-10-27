import { NextRequest } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidEmail(v: unknown) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000; // 10 min
const MAX_HITS = 5;

function rateLimit(ip: string) {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || now > cur.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true as const };
  }
  if (cur.count >= MAX_HITS) {
    return { ok: false as const, retryAfter: Math.ceil((cur.resetAt - now) / 1000) };
  }
  cur.count += 1;
  return { ok: true as const };
}

async function parseBody(req: NextRequest) {
  const ct = (req.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    return await req.json();
  }
  const fd = await req.formData();
  return Object.fromEntries(fd.entries());
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, message, website } = await parseBody(req);

    if (typeof website === "string" && website.trim() !== "") {
      return Response.json({ ok: true }, { status: 200 });
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return Response.json({ ok: false, error: "Podaj imię i nazwisko" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return Response.json({ ok: false, error: "Nieprawidłowy e-mail" }, { status: 400 });
    }
    if (typeof message !== "string" || message.trim().length < 5) {
      return Response.json({ ok: false, error: "Wiadomość jest za krótka" }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const rl = rateLimit(String(ip));
    if (!rl.ok) {
      return Response.json(
        { ok: false, error: "Za dużo prób. Spróbuj ponownie później." },
        {
          status: 429,
          headers: rl.retryAfter ? { "Retry-After": String(rl.retryAfter) } : undefined,
        }
      );
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 465);
    const secure = String(process.env.SMTP_SECURE ?? "true") === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || user || "";
    const to = process.env.SMTP_TO || user || "";

    if (!host || !from || !to) {
      return Response.json(
        { ok: false, error: "Brak konfiguracji SMTP (HOST/FROM/TO)" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
    });

    const plain = [
      `Imię i nazwisko: ${String(name).trim()}`,
      `E-mail: ${String(email).trim()}`,
      `IP: ${ip}`,
      `---`,
      String(message).trim(),
    ].join("\n");

    await transporter.sendMail({
      from,
      to,
      replyTo: String(email),
      subject: `Wiadomość ze strony – ${String(name).trim()}`,
      text: plain,
    });

    return Response.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Błąd serwera";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
