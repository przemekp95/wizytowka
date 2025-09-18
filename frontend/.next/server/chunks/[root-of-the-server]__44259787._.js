module.exports = [
"[project]/frontend/.next-internal/server/app/api/contact/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/frontend/src/app/api/contact/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// app/api/contact/route.ts
__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic,
    "revalidate",
    ()=>revalidate,
    "runtime",
    ()=>runtime
]);
const runtime = 'nodejs';
const dynamic = 'force-dynamic';
const revalidate = 0;
// ── helpers ───────────────────────────────────────────────────────────────────
function isValidEmail(v) {
    return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
// prosty in-memory rate-limit
const hits = new Map();
const WINDOW_MS = 10 * 60 * 1000; // 10 min
const MAX_HITS = 5;
function rateLimit(ip) {
    const now = Date.now();
    const cur = hits.get(ip);
    if (!cur || now > cur.resetAt) {
        hits.set(ip, {
            count: 1,
            resetAt: now + WINDOW_MS
        });
        return {
            ok: true
        };
    }
    if (cur.count >= MAX_HITS) {
        return {
            ok: false,
            retryAfter: Math.ceil((cur.resetAt - now) / 1000)
        };
    }
    cur.count += 1;
    return {
        ok: true
    };
}
async function parseBody(req) {
    const ct = (req.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/json')) return req.json();
    const fd = await req.formData();
    return Object.fromEntries(fd.entries());
}
async function POST(req) {
    // 1) parse + walidacje + honeypot + rate-limit (po stronie frontu)
    const body = await parseBody(req);
    const { name, email, message, website } = body;
    if (typeof website === 'string' && website.trim() !== '') {
        return Response.json({
            ok: true
        }, {
            status: 200
        });
    }
    if (typeof name !== 'string' || name.trim().length < 2) {
        return Response.json({
            ok: false,
            error: 'Podaj imię i nazwisko'
        }, {
            status: 400
        });
    }
    if (!isValidEmail(email)) {
        return Response.json({
            ok: false,
            error: 'Nieprawidłowy e-mail'
        }, {
            status: 400
        });
    }
    if (typeof message !== 'string' || message.trim().length < 5) {
        return Response.json({
            ok: false,
            error: 'Wiadomość jest za krótka'
        }, {
            status: 400
        });
    }
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || 'unknown';
    const rl = rateLimit(String(ip));
    if (!rl.ok) {
        return Response.json({
            ok: false,
            error: 'Za dużo prób. Spróbuj ponownie później.'
        }, {
            status: 429,
            headers: rl.retryAfter ? {
                'Retry-After': String(rl.retryAfter)
            } : undefined
        });
    }
    // 2) proxy do Nesta
    const backend = (("TURBOPACK compile-time value", "http://localhost:4000/api") || '').replace(/\/$/, '');
    const res = await fetch(`${backend}/contact`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        // tylko to, co potrzebne NEST DTO
        body: JSON.stringify({
            name: String(name).trim(),
            email: String(email).trim(),
            message: String(message).trim(),
            // możesz dodać ip, jeśli chcesz w Nescie logować
            ip
        })
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {
        ok: res.ok
    };
    return new Response(JSON.stringify(json), {
        status: res.status,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
async function GET() {
    return Response.json({
        ok: false,
        error: 'Method Not Allowed'
    }, {
        status: 405
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__44259787._.js.map