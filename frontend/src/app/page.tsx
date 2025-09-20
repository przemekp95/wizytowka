// app/page.tsx — SERVER COMPONENT (brak 'use client')
import '@/styles/custom.scss';
import Image from 'next/image';

// Header może pozostać client componentem, server strona może go normalnie użyć
import Header from '@/app/_components/Header';

// Użyj serwerowej wersji formularza (statyczny HTML + widoczna hCaptcha)
import ContactForm from '@/app/_components/ContactForm';

export const dynamic = 'force-static';
// ISR: odśwież dane z API co 5 minut
export const revalidate = 300;

type PortfolioItem = {
  _id: string;
  title: string;
  slug: string;
  href: string;
  desc: string;
  tags: string[];
  img: string;
  isLogo?: boolean;
  newTech?: boolean;
  repoUrl?: string | null; // <— NOWE
};

async function fetchPortfolio(): Promise<PortfolioItem[]> {
  // Jeśli masz osobny origin dla backendu w dev/prod, ustaw:
  // NEXT_PUBLIC_API_BASE_URL=http://localhost:4000 (przykład)
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  try {
    const res = await fetch(`${base}/api/portfolio`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { ok: boolean; items: PortfolioItem[] };
    return data?.items ?? [];
  } catch {
    return [];
  }
}

export default async function OnePager() {
  const items = await fetchPortfolio();

  return (
    <>
      {/* NAV */}
      <Header />

      <main className="pt-14 bg-white text-slate-900">
        {/* HERO (bez Framer Motion; CSS-only animacje) */}
        <section
          id="home"
          className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white"
        >
          <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-2xl bg-indigo-200/60 blur-xl" />
          <div className="absolute -top-8 -right-8 h-28 w-28 rounded-2xl bg-fuchsia-200/60 blur-xl" />
          <div className="mx-auto max-w-6xl px-4 py-24 md:py-32 grid md:grid-cols-2 gap-10 items-center">
            <div className="relative">
              {/* WAŻNE: wrapper musi być relative dla Image fill */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  src="/images/PP-2-JPG-01.webp"
                  alt="Przemysław Pietrzak"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight fade-up">
                Next.js &amp; PHP Web Developer
              </h1>
              <p className="mt-5 max-w-prose text-lg text-slate-600 fade-up-delayed">
                Buduję nowoczesne aplikacje webowe (Next.js, Laravel, Node) i projektuję rozwiązania
                oparte na SQL, NoSQL oraz API (REST, GraphQL). Łączę wiedzę prawniczą z technologią.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3 fade-up-delayed2">
                <a
                  href="#portfolio"
                  className="btn btn-ghost border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  Zobacz projekty
                </a>
                <a
                  href="#contact"
                  className="btn btn-ghost border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  Skontaktuj się
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* PORTFOLIO — teraz z API */}
        <section id="portfolio" className="py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center">
              Portfolio
            </h2>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
              {items.length === 0 && (
                <p className="col-span-full text-center text-slate-500">
                  Brak pozycji do wyświetlenia.
                </p>
              )}

              {items.map((p) => {
                const imgClasses = p.isLogo ? 'object-contain bg-white p-6' : 'object-cover';
                return (
                  <article key={p._id} className="card group flex flex-col h-full text-center">
                    <div className="relative overflow-hidden rounded-xl h-64 sm:h-72 lg:h-80">
                      <Image
                        src={p.img}
                        alt={p.title}
                        fill
                        className={`${imgClasses} transition-transform duration-500 group-hover:scale-[1.02]`}
                        sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                      />
                      {p.newTech && <span className="badge">Nowa technologia</span>}
                    </div>
                    <h3 className="mt-4 text-lg font-bold">
                      <a
                        href={p.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link underline-offset-4 hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-sm"
                      >
                        {p.title}
                      </a>
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">{p.desc}</p>

                    {/* === REPOZYTORIUM (opcjonalnie) === */}
                    {p.repoUrl?.trim() && (
                      <div className="mt-4">
                        <div className="text-xs uppercase tracking-wide text-slate-500">
                          Repozytorium
                        </div>
                        <a
                          href={p.repoUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium underline underline-offset-4 hover:no-underline break-all"
                          aria-label={`Repozytorium ${p.title}`}
                        >
                          {p.repoUrl}
                        </a>
                      </div>
                    )}
                    {/* === /REPOZYTORIUM === */}

                    <div className="mt-4">
                      <div className="font-semibold text-slate-800">Technologie</div>
                      <div className="mt-2 flex flex-wrap justify-center gap-2">
                        {p.tags?.map((t) => (
                          <span key={t} className="chip">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 grid gap-10 lg:grid-cols-5 lg:items-center">
            <div className="lg:col-span-2 flex justify-center">
              <Image
                src="/portfolio/ai-offline.jpg"
                alt="Przemysław Pietrzak"
                width={240}
                height={240}
                className="rounded-full shadow-lg object-cover"
                priority
              />
            </div>
            <div className="lg:col-span-3">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">O mnie</h2>
              <p className="mt-3 text-slate-700 leading-relaxed text-justify">
                Jestem developerem łączącym prawo i technologię. Buduję nowoczesne aplikacje webowe
                w Next.js, Laravel i Symfony, projektuję backendy w Node/NestJS z użyciem Prisma
                oraz baz danych SQL (MySQL, PostgreSQL) i NoSQL (MongoDB). Tworzę REST API i GraphQL
                API, wdrażam projekty w architekturze CI/CD (Docker, GitHub Actions, Passenger na
                Cyber_Folks), a także rozwijam środowiska oparte na Kubernetes i integruję je z
                usługami chmurowymi jak Render czy Vercel. Stosuję testy automatyczne (Jest, React
                Testing Library, Cypress, PHPUnit) w projektach frontendowych i backendowych.
              </p>

              <div className="mt-8">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Stack technologiczny
                </h3>
                <ul className="mt-4 space-y-3">
                  <li className="bullet">
                    <strong>Frontend:</strong> Next.js / React / Tailwind / JavaScript, TypeScript
                  </li>
                  <li className="bullet">
                    <strong>Backend:</strong> Laravel / Symfony / PHP, Node / NestJS (Typescript)
                  </li>
                  <li className="bullet">
                    <strong>Bazy danych:</strong> Prisma / SQL (MySQL, PostgreSQL), MongoDB / NoSQL
                  </li>
                  <li className="bullet">
                    <strong>DevOps:</strong> Docker / GitHub Actions / Kubernetes / Passenger
                    (Cyber_Folks) / Render / Vercel
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT (server section – statyczny HTML, hCaptcha widoczna) */}
        <section id="contact" className="py-24 bg-gradient-to-b from-white to-slate-50">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="section-title text-center text-4xl md:text-5xl font-extrabold tracking-tight">
              Kontakt
            </h2>
            <p className="mt-2 text-center text-slate-600">
              Napisz wiadomość – odpowiem możliwie szybko.
            </p>
            <div className="mt-10 flex justify-center">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER (rok zrenderuje się przy buildzie) */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Przemysław Pietrzak</p>
          <div className="flex items-center gap-4">
            <a className="link" href="https://github.com/przemekp95">
              GitHub
            </a>
            <a className="link" href="https://www.linkedin.com/in/przemyslaw-pietrzak/">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
