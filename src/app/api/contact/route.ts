import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    // konfiguracja transportu SMTP (Zoho)
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.eu",
      port: 465,
      secure: true, // SSL/TLS
      auth: {
        user: process.env.ZOHO_USER, // np. contact@pplegalsolutions.pl
        pass: process.env.ZOHO_PASS, // hasło aplikacyjne / IMAP/SMTP
      },
    });

    await transporter.sendMail({
      from: `"Formularz kontaktowy" <${process.env.ZOHO_USER}>`,
      to: "p.pietrzak@sluzbaniepodleglej.pl", // odbiorca
      subject: `Nowa wiadomość od ${name}`,
      text: `Email: ${email}\n\nWiadomość:\n${message}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Mail error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
