// app/api/contact/route.ts
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // weryfikacja captcha + e-mail poza Edge jest prostsza

type Body = {
  name?: string | null;
  email?: string | null;
  message?: string | null;
  captchaToken?: string | null;
  website?: string | null; // honeypot (jeśli przesyłasz z frontu)
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    // Honeypot
    if (body.website) {
      return Response.json({ ok: true }, { status: 200 });
    }

    // Walidacje podstawowe
    if (!body.name || !body.email || !body.message) {
      return Response.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    // 1) Weryfikacja hCaptcha
    if (!body.captchaToken) {
      return Response.json({ ok: false, error: "Missing captcha token" }, { status: 400 });
    }

    const secret = process.env.HCAPTCHA_SECRET;
    if (!secret) {
      return Response.json({ ok: false, error: "Server captcha misconfig" }, { status: 500 });
    }

    const verifyRes = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: body.captchaToken,
      }),
      // opcjonalnie: next: { revalidate: 0 }
    });

    const verifyJson = await verifyRes.json() as {
      success: boolean;
      "error-codes"?: string[];
      hostname?: string;
      challenge_ts?: string;
      score?: number;
    };

    if (!verifyJson.success) {
      return Response.json(
        { ok: false, error: `Captcha failed${verifyJson["error-codes"] ? `: ${verifyJson["error-codes"].join(", ")}` : ""}` },
        { status: 400 }
      );
    }

    // 2) …wyślij e-mail (EmailJS / nodemailer / API zewn.)
    // PRZYKŁAD (pseudo):
    // await sendEmail({ name: body.name, email: body.email, message: body.message });

    return Response.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message || "Server error" }, { status: 500 });
  }
}
