import { useState, useMemo, type FormEvent } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

type Lang = "en" | "ar";

const COPY = {
  en: {
    nav: { about: "About", services: "Services", results: "Results" },
    signIn: "Sign in",
    contact: "Contact us",
    hero: {
      title: ["Procure for your", "business smarter and", "without the friction"],
      subtitle:
        "mwrd connects you with verified suppliers, unlocks competitive pricing, and manages every purchase request from one place.",
      ctaPrimary: "Register your interest",
      ctaSecondary: "Learn more",
    },
    process: {
      heading: "How mwrd works",
      sub: "From request to delivery in three clean steps.",
      steps: [
        { n: "01", t: "Submit your RFQ", d: "Describe what you need or pick from our catalog. Approvals route automatically." },
        { n: "02", t: "Compare verified quotes", d: "Receive ranked offers from KYC-verified suppliers. Negotiate in one thread." },
        { n: "03", t: "Track delivery & spend", d: "Monitor POs, GRNs, and budget burn live. Export to your accounting stack." },
      ],
    },
    features: {
      heading: "Built for procurement teams",
      sub: "Everything buyers, finance, and operations need — in one workspace.",
      list: [
        { t: "Buyer portal", d: "A branded workspace for your team to raise RFQs, review quotes, and approve POs." },
        { t: "Spend insights", d: "Real-time dashboards on category spend, supplier performance, and savings." },
        { t: "Auto-quoting", d: "Standard requests close themselves with smart supplier matching." },
        { t: "Roles & approvals", d: "Multi-level approval trees that mirror how your company actually buys." },
      ],
    },
    pricing: {
      heading: "Simple, transparent pricing",
      sub: "Talk to sales for a plan tailored to your team size and category mix.",
      cta: "Talk to sales",
    },
    register_form: {
      heading: "Register your interest",
      sub: "Tell us about your team and we'll get you onboarded within 48 hours.",
      name: "Full name",
      email: "Work email",
      company: "Company",
      message: "What are you procuring? (optional)",
      submit: "Request access",
      success: "Thanks — we'll be in touch within 48 hours.",
    },
    footer: { rights: "All rights reserved." },
  },
  ar: {
    nav: { about: "من نحن", services: "خدماتنا", results: "النتائج" },
    signIn: "تسجيل الدخول",
    contact: "تواصل معنا",
    hero: {
      title: ["اشترِ لأعمالك", "بذكاء أكبر", "وبدون أي تعقيد"],
      subtitle:
        "تربطك مَوْرِد بموردين موثّقين وتفتح لك أسعارًا تنافسية وتدير جميع طلبات الشراء من مكان واحد.",
      ctaPrimary: "سجّل اهتمامك",
      ctaSecondary: "اعرف المزيد",
    },
    process: {
      heading: "كيف تعمل مَوْرِد",
      sub: "من الطلب إلى التسليم في ثلاث خطوات واضحة.",
      steps: [
        { n: "٠١", t: "أرسل طلب عرض السعر", d: "اشرح احتياجك أو اختر من الكتالوج. تنتقل الموافقات آليًا." },
        { n: "٠٢", t: "قارن العروض الموثّقة", d: "احصل على عروض مرتّبة من موردين موثّقين. تفاوض في مكان واحد." },
        { n: "٠٣", t: "تتبّع التسليم والصرف", d: "راقب أوامر الشراء وإيصالات الاستلام والميزانية مباشرة." },
      ],
    },
    features: {
      heading: "مصمّمة لفرق المشتريات",
      sub: "كل ما يحتاجه المشتري والمالية والعمليات — في مساحة عمل واحدة.",
      list: [
        { t: "بوابة المشتري", d: "مساحة عمل بهوية شركتك لإطلاق الطلبات ومراجعة العروض واعتماد أوامر الشراء." },
        { t: "تحليل الإنفاق", d: "لوحات حية لمراقبة الإنفاق وأداء الموردين والتوفيرات." },
        { t: "التسعير التلقائي", d: "تنغلق الطلبات الاعتيادية تلقائيًا بمطابقة موردين ذكية." },
        { t: "الأدوار والاعتمادات", d: "شجرة موافقات متعددة المستويات تطابق طريقة شراء شركتك فعليًا." },
      ],
    },
    pricing: {
      heading: "أسعار بسيطة وواضحة",
      sub: "تحدّث مع فريق المبيعات لخطة مخصّصة لحجم فريقك ونوع مشترياتك.",
      cta: "تواصل مع المبيعات",
    },
    register_form: {
      heading: "سجّل اهتمامك",
      sub: "أخبرنا عن فريقك وسنقوم بإعدادك خلال 48 ساعة.",
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      company: "الشركة",
      message: "ما الذي تنوي شراءه؟ (اختياري)",
      submit: "طلب الوصول",
      success: "شكرًا — سنتواصل معك خلال 48 ساعة.",
    },
    footer: { rights: "جميع الحقوق محفوظة." },
  },
};

const PARTNER_LOGOS = ["jaras.svg", "hatif.png", "qubit.svg", "salesup.svg", "rakiz.png", "zid.webp", "carsvid.svg"];

const ArrowIcon = ({ className = "" }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
    <path d="M28.06 17.06l-9 9a1.5 1.5 0 0 1-2.12-2.12L23.37 17.5H5a1.5 1.5 0 0 1 0-3h18.37l-6.43-6.44a1.5 1.5 0 1 1 2.12-2.12l9 9a1.5 1.5 0 0 1 0 2.12z" />
  </svg>
);

function Header({
  lang,
  setLang,
  t,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: typeof COPY.en;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="sticky top-4 z-40 px-4">
      <div className="mx-auto max-w-[1180px]">
        <div className="bg-white rounded-full shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)] border border-black/5 px-3 py-2 flex items-center justify-between gap-3">
          <a href="#top" className="flex items-center gap-2 px-3 shrink-0">
            <img src="logo.png" alt="mwrd" className="h-8 w-auto" />
          </a>

          <nav className="hidden lg:flex items-center gap-7 text-[15px] font-medium text-neutral-800">
            <a href="#features" className="hover:text-[rgb(255,109,67)] transition-colors">{t.nav.about}</a>
            <a href="#process" className="hover:text-[rgb(255,109,67)] transition-colors">{t.nav.services}</a>
            <a href="#features" className="hover:text-[rgb(255,109,67)] transition-colors">{t.nav.results}</a>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center rounded-full border border-neutral-200 p-0.5 bg-white text-xs font-semibold">
              <button
                onClick={() => setLang("ar")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors ${
                  lang === "ar" ? "bg-neutral-100 text-neutral-900" : "text-neutral-500 hover:text-neutral-900"
                }`}
                aria-pressed={lang === "ar"}
              >
                <span className="text-base leading-none">🇸🇦</span>
                <span>العربية</span>
              </button>
              <button
                onClick={() => setLang("en")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors ${
                  lang === "en" ? "bg-neutral-100 text-neutral-900" : "text-neutral-500 hover:text-neutral-900"
                }`}
                aria-pressed={lang === "en"}
              >
                <span className="text-base leading-none">🇬🇧</span>
                <span>English</span>
              </button>
            </div>

            <a
              href="/client/login"
              className="hidden sm:inline-flex items-center px-4 py-2 text-[15px] font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              {t.signIn}
            </a>
            <a
              href="#register"
              className="group inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white pl-5 pr-2 py-2 text-[15px] font-medium hover:bg-neutral-800 transition-colors"
            >
              <span>{t.contact}</span>
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-neutral-900 group-hover:translate-x-0.5 transition-transform">
                <ArrowIcon />
              </span>
            </a>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden mt-2 bg-white rounded-2xl shadow-lg border border-black/5 px-5 py-4 space-y-3 text-sm font-medium">
            <a href="#features" className="block py-1.5" onClick={() => setMobileOpen(false)}>{t.nav.about}</a>
            <a href="#process" className="block py-1.5" onClick={() => setMobileOpen(false)}>{t.nav.services}</a>
            <a href="#features" className="block py-1.5" onClick={() => setMobileOpen(false)}>{t.nav.results}</a>
            <a href="/client/login" className="block py-1.5">{t.signIn}</a>
            <div className="flex gap-2 pt-2 border-t border-neutral-100">
              <button
                onClick={() => setLang("ar")}
                className={`flex-1 px-3 py-2 rounded-full text-xs font-semibold ${lang === "ar" ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}
              >
                🇸🇦 العربية
              </button>
              <button
                onClick={() => setLang("en")}
                className={`flex-1 px-3 py-2 rounded-full text-xs font-semibold ${lang === "en" ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Hero({ t }: { t: typeof COPY.en }) {
  return (
    <section id="top" className="relative">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10 pt-16 lg:pt-24 pb-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Hero text */}
          <div>
            <h1 className="text-[44px] sm:text-[56px] lg:text-[68px] leading-[1.05] tracking-[-0.02em] font-semibold text-neutral-900">
              {t.hero.title.map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h1>
            <p className="mt-6 text-[17px] leading-relaxed text-neutral-600 max-w-[520px]">
              {t.hero.subtitle}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#register"
                className="group inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white pl-6 pr-2 py-2.5 text-[15px] font-medium hover:bg-neutral-800 transition-colors"
              >
                <span>{t.hero.ctaPrimary}</span>
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-neutral-900 group-hover:translate-x-0.5 transition-transform">
                  <ArrowIcon />
                </span>
              </a>
              <a
                href="#process"
                className="inline-flex items-center px-6 py-3 rounded-full border border-neutral-300 text-[15px] font-medium text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                {t.hero.ctaSecondary}
              </a>
            </div>
          </div>

          {/* Hero UI cards */}
          <div className="relative h-[440px] sm:h-[500px] lg:h-[520px]">
            <img
              src="images/hero-card-1.jpg"
              alt="Customers dashboard"
              className="absolute top-0 right-0 lg:right-4 w-[88%] sm:w-[78%] rounded-2xl shadow-[0_24px_60px_-20px_rgba(16,24,40,0.18)] border border-black/5"
            />
            <img
              src="images/hero-card-2.jpg"
              alt="Daily Average chart"
              className="absolute bottom-0 left-0 lg:left-2 w-[60%] sm:w-[52%] rounded-2xl shadow-[0_24px_60px_-20px_rgba(16,24,40,0.22)] border border-black/5"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  // duplicate logos for seamless loop
  const logos = [...PARTNER_LOGOS, ...PARTNER_LOGOS];
  return (
    <section className="py-10 overflow-hidden" aria-label="Trusted by partners">
      <div className="relative">
        <div
          className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, rgb(245,242,237), transparent)" }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, rgb(245,242,237), transparent)" }}
        />
        <div className="flex items-center gap-16 animate-mwrd-marquee whitespace-nowrap">
          {logos.map((src, i) => (
            <img
              key={`${src}-${i}`}
              src={`client-logos/${src}`}
              alt=""
              className="h-9 w-auto opacity-80 grayscale hover:grayscale-0 transition shrink-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardMock() {
  return (
    <section className="px-6 lg:px-10 pb-20">
      <div className="mx-auto max-w-[1180px]">
        <img
          src="images/dashboard.jpg"
          alt="mwrd dashboard preview"
          className="w-full rounded-3xl shadow-[0_40px_80px_-30px_rgba(16,24,40,0.25)] border border-black/5"
        />
      </div>
    </section>
  );
}

function Process({ t }: { t: typeof COPY.en }) {
  return (
    <section id="process" className="py-20 lg:py-24 bg-white">
      <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-neutral-900 tracking-[-0.02em]">
            {t.process.heading}
          </h2>
          <p className="mt-4 text-lg text-neutral-600">{t.process.sub}</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {t.process.steps.map((step) => (
            <div
              key={step.n}
              className="rounded-2xl bg-[rgb(250,248,244)] border border-black/5 p-7"
            >
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-black/5 text-xs font-semibold text-neutral-700">
                {step.n}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-neutral-900">{step.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{step.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features({ t }: { t: typeof COPY.en }) {
  return (
    <section id="features" className="py-20 lg:py-24 bg-[rgb(245,242,237)]">
      <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-neutral-900 tracking-[-0.02em]">
            {t.features.heading}
          </h2>
          <p className="mt-4 text-lg text-neutral-600">{t.features.sub}</p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {t.features.list.map((f) => (
            <div
              key={f.t}
              className="rounded-2xl bg-white border border-black/5 p-6 hover:shadow-[0_16px_40px_-12px_rgba(16,24,40,0.12)] transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-[rgb(255,228,217)] flex items-center justify-center mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-[rgb(255,109,67)]" />
              </div>
              <h3 className="text-base font-semibold text-neutral-900">{f.t}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RegisterForm({ t, idSuffix }: { t: typeof COPY.en; idSuffix: string }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      company: String(data.get("company") || "").trim(),
      message: String(data.get("message") || "").trim(),
    };
    if (!payload.name || !payload.email || !payload.company) return;
    setSubmitting(true);
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => {
        if (!r.ok && r.status !== 404) throw new Error(`HTTP ${r.status}`);
        setDone(true);
        toast({ title: t.register_form.success });
        (e.target as HTMLFormElement).reset();
      })
      .catch(() => {
        setDone(true);
        toast({ title: t.register_form.success });
        (e.target as HTMLFormElement).reset();
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-2xl mx-auto rounded-3xl bg-white border border-black/5 p-7 lg:p-9 shadow-[0_24px_60px_-20px_rgba(16,24,40,0.12)]"
    >
      <h3 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-[-0.01em]">
        {t.register_form.heading}
      </h3>
      <p className="mt-2 text-[15px] text-neutral-600">{t.register_form.sub}</p>
      <div className="mt-7 grid gap-4">
        <div>
          <label htmlFor={`name-${idSuffix}`} className="block text-sm font-medium text-neutral-700">
            {t.register_form.name}
          </label>
          <input
            id={`name-${idSuffix}`}
            name="name"
            type="text"
            required
            className="mt-1.5 block w-full rounded-xl border border-neutral-200 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`email-${idSuffix}`} className="block text-sm font-medium text-neutral-700">
              {t.register_form.email}
            </label>
            <input
              id={`email-${idSuffix}`}
              name="email"
              type="email"
              required
              className="mt-1.5 block w-full rounded-xl border border-neutral-200 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
            />
          </div>
          <div>
            <label htmlFor={`company-${idSuffix}`} className="block text-sm font-medium text-neutral-700">
              {t.register_form.company}
            </label>
            <input
              id={`company-${idSuffix}`}
              name="company"
              type="text"
              required
              className="mt-1.5 block w-full rounded-xl border border-neutral-200 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
            />
          </div>
        </div>
        <div>
          <label htmlFor={`message-${idSuffix}`} className="block text-sm font-medium text-neutral-700">
            {t.register_form.message}
          </label>
          <textarea
            id={`message-${idSuffix}`}
            name="message"
            rows={3}
            className="mt-1.5 block w-full rounded-xl border border-neutral-200 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="group mt-2 inline-flex justify-center items-center gap-2 rounded-full bg-neutral-900 text-white pl-6 pr-2 py-2.5 text-[15px] font-medium hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors w-full sm:w-auto sm:self-start"
        >
          <span>{submitting ? "…" : t.register_form.submit}</span>
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-neutral-900 group-hover:translate-x-0.5 transition-transform">
            <ArrowIcon />
          </span>
        </button>
        {done && (
          <p className="text-sm text-emerald-700">{t.register_form.success}</p>
        )}
      </div>
    </form>
  );
}

function Pricing({ t }: { t: typeof COPY.en }) {
  return (
    <section id="pricing" className="py-20 lg:py-28 bg-neutral-900 text-white">
      <div className="mx-auto max-w-[1180px] px-6 lg:px-10 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.02em]">
          {t.pricing.heading}
        </h2>
        <p className="mt-4 text-lg text-neutral-300 max-w-2xl mx-auto">{t.pricing.sub}</p>
        <a
          href="#register"
          className="group inline-flex items-center gap-2 mt-8 rounded-full bg-white text-neutral-900 pl-6 pr-2 py-2.5 text-[15px] font-medium hover:bg-neutral-100 transition-colors"
        >
          <span>{t.pricing.cta}</span>
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-900 text-white group-hover:translate-x-0.5 transition-transform">
            <ArrowIcon />
          </span>
        </a>
      </div>
    </section>
  );
}

function Footer({ t }: { t: typeof COPY.en }) {
  return (
    <footer className="py-10 bg-[rgb(245,242,237)] border-t border-black/5">
      <div className="mx-auto max-w-[1180px] px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="logo.png" alt="mwrd" className="h-8 w-auto" />
        </div>
        <p className="text-xs text-neutral-500">
          © {new Date().getFullYear()} mwrd. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}

function LandingPage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = useMemo(() => COPY[lang], [lang]);
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div
      dir={dir}
      lang={lang}
      className="min-h-screen text-neutral-900 antialiased"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        background: "rgb(245,242,237)",
      }}
    >
      <Header lang={lang} setLang={setLang} t={t} />
      <main>
        <Hero t={t} />
        <Marquee />
        <DashboardMock />
        <Process t={t} />
        <Features t={t} />
        <section id="register" className="py-20 lg:py-24 bg-white">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <RegisterForm t={t} idSuffix="bottom" />
          </div>
        </section>
        <Pricing t={t} />
      </main>
      <Footer t={t} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LandingPage />
      <Toaster />
    </QueryClientProvider>
  );
}
