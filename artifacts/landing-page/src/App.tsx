import { useState, useMemo, type FormEvent } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

type Lang = "en" | "ar";

const COPY = {
  en: {
    nav: { about: "About", features: "Features", pricing: "Pricing", contact: "Contact" },
    signIn: "Sign in",
    register: "Register",
    hero: {
      eyebrow: "AI-powered B2B procurement",
      title: "Procure smarter, without the friction",
      subtitle:
        "MWRD connects you with verified suppliers, unlocks competitive pricing, and manages every purchase request from one place.",
      ctaPrimary: "Register your interest",
      ctaSecondary: "Sign in to your account",
    },
    trusted: "Trusted by procurement teams across Saudi Arabia",
    process: {
      heading: "How MWRD works",
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
    nav: { about: "من نحن", features: "المزايا", pricing: "الأسعار", contact: "تواصل" },
    signIn: "تسجيل الدخول",
    register: "سجّل الآن",
    hero: {
      eyebrow: "منصة مشتريات B2B مدعومة بالذكاء الاصطناعي",
      title: "اشترِ بذكاء، بدون تعقيد",
      subtitle:
        "تربطك مَوْرِد بموردين موثّقين وتفتح لك أسعارًا تنافسية وتدير جميع طلبات الشراء من مكان واحد.",
      ctaPrimary: "سجّل اهتمامك",
      ctaSecondary: "ادخل إلى حسابك",
    },
    trusted: "موثوقة من قِبل فرق المشتريات في المملكة العربية السعودية",
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

const PARTNER_LOGOS = ["jaras.svg", "qubit.svg", "salesup.svg", "carsvid.svg", "rakiz.png", "hatif.png", "zid.webp"];

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
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[rgb(228,231,236)]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2">
          <img src="logo.png" alt="MWRD" className="h-8 w-auto" />
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[rgb(52,64,84)]">
          <a href="#features" className="hover:text-[rgb(255,109,67)] transition-colors">
            {t.nav.about}
          </a>
          <a href="#features" className="hover:text-[rgb(255,109,67)] transition-colors">
            {t.nav.features}
          </a>
          <a href="#pricing" className="hover:text-[rgb(255,109,67)] transition-colors">
            {t.nav.pricing}
          </a>
          <a href="#register" className="hover:text-[rgb(255,109,67)] transition-colors">
            {t.nav.contact}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center rounded-full border border-[rgb(228,231,236)] p-0.5 bg-white text-xs font-semibold">
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1 rounded-full transition-colors ${
                lang === "en" ? "bg-[rgb(16,24,40)] text-white" : "text-[rgb(102,112,133)] hover:text-[rgb(16,24,40)]"
              }`}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
            <button
              onClick={() => setLang("ar")}
              className={`px-3 py-1 rounded-full transition-colors ${
                lang === "ar" ? "bg-[rgb(16,24,40)] text-white" : "text-[rgb(102,112,133)] hover:text-[rgb(16,24,40)]"
              }`}
              aria-pressed={lang === "ar"}
            >
              ع
            </button>
          </div>

          <a
            href="/"
            className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-[rgb(52,64,84)] hover:text-[rgb(16,24,40)] transition-colors"
          >
            {t.signIn}
          </a>
          <a
            href="#register"
            className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-[rgb(16,24,40)] text-white hover:bg-[rgb(52,64,84)] transition-colors"
          >
            {t.register}
          </a>

          <button
            className="md:hidden p-2 -mr-2"
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
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[rgb(228,231,236)] bg-white px-6 py-4 space-y-3 text-sm font-medium">
          <a href="#features" className="block py-1.5" onClick={() => setMobileOpen(false)}>{t.nav.features}</a>
          <a href="#pricing" className="block py-1.5" onClick={() => setMobileOpen(false)}>{t.nav.pricing}</a>
          <a href="#register" className="block py-1.5" onClick={() => setMobileOpen(false)}>{t.nav.contact}</a>
          <a href="/" className="block py-1.5">{t.signIn}</a>
        </div>
      )}
    </header>
  );
}

function Hero({ t }: { t: typeof COPY.en }) {
  return (
    <section id="top" className="relative overflow-hidden bg-gradient-to-b from-[rgb(255,247,242)] to-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgb(255,228,217)] text-[rgb(193,53,15)] text-xs font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgb(255,109,67)]" />
            {t.hero.eyebrow}
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[rgb(16,24,40)] leading-[1.05]">
            {t.hero.title}
          </h1>
          <p className="mt-5 text-lg text-[rgb(71,84,103)] max-w-xl">{t.hero.subtitle}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href="#register"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[rgb(255,109,67)] text-white font-semibold hover:bg-[rgb(229,87,49)] transition-colors shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
            >
              {t.hero.ctaPrimary}
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-[rgb(52,64,84)] font-semibold border border-[rgb(228,231,236)] hover:bg-[rgb(249,250,251)] transition-colors"
            >
              {t.hero.ctaSecondary}
            </a>
          </div>
        </div>

        <div className="relative">
          <RegisterForm t={t} idSuffix="top" />
        </div>
      </div>
    </section>
  );
}

function PartnerStrip({ t }: { t: typeof COPY.en }) {
  return (
    <section className="py-12 border-y border-[rgb(228,231,236)] bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-xs font-semibold tracking-widest uppercase text-[rgb(102,112,133)] mb-6">
          {t.trusted}
        </p>
        <div className="flex items-center justify-center gap-10 flex-wrap opacity-70 grayscale">
          {PARTNER_LOGOS.map((src) => (
            <img key={src} src={`client-logos/${src}`} alt="" className="h-6 w-auto" />
          ))}
        </div>
      </div>
    </section>
  );
}

function Process({ t }: { t: typeof COPY.en }) {
  return (
    <section className="py-20 lg:py-24 bg-[rgb(252,252,253)]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[rgb(16,24,40)] tracking-tight">{t.process.heading}</h2>
          <p className="mt-3 text-lg text-[rgb(71,84,103)]">{t.process.sub}</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {t.process.steps.map((step) => (
            <div
              key={step.n}
              className="rounded-2xl bg-white border border-[rgb(228,231,236)] p-6 shadow-[0_1px_3px_rgba(16,24,40,0.04)]"
            >
              <div className="w-10 h-10 rounded-lg bg-[rgb(255,228,217)] flex items-center justify-center text-[rgb(193,53,15)] font-bold text-sm">
                {step.n}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[rgb(16,24,40)]">{step.t}</h3>
              <p className="mt-2 text-sm text-[rgb(71,84,103)]">{step.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features({ t }: { t: typeof COPY.en }) {
  return (
    <section id="features" className="py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[rgb(16,24,40)] tracking-tight">{t.features.heading}</h2>
          <p className="mt-3 text-lg text-[rgb(71,84,103)]">{t.features.sub}</p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.features.list.map((f) => (
            <div
              key={f.t}
              className="rounded-2xl border border-[rgb(228,231,236)] p-6 hover:border-[rgb(255,109,67)] hover:shadow-[0_8px_24px_rgba(255,109,67,0.08)] transition-all bg-white"
            >
              <div className="w-9 h-9 rounded-lg bg-[rgb(255,247,242)] flex items-center justify-center mb-4">
                <span className="w-2 h-2 rounded-full bg-[rgb(255,109,67)]" />
              </div>
              <h3 className="text-base font-semibold text-[rgb(16,24,40)]">{f.t}</h3>
              <p className="mt-2 text-sm text-[rgb(71,84,103)]">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing({ t }: { t: typeof COPY.en }) {
  return (
    <section id="pricing" className="py-20 lg:py-24 bg-[rgb(16,24,40)] text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t.pricing.heading}</h2>
        <p className="mt-3 text-lg text-[rgb(208,213,221)] max-w-2xl mx-auto">{t.pricing.sub}</p>
        <a
          href="#register"
          className="inline-flex items-center mt-8 px-6 py-3 rounded-lg bg-[rgb(255,109,67)] text-white font-semibold hover:bg-[rgb(229,87,49)] transition-colors"
        >
          {t.pricing.cta}
        </a>
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
      className="w-full max-w-xl mx-auto rounded-2xl bg-white border border-[rgb(228,231,236)] p-6 lg:p-8 shadow-[0_8px_24px_rgba(16,24,40,0.06)]"
    >
      <h3 className="text-2xl font-bold text-[rgb(16,24,40)]">{t.register_form.heading}</h3>
      <p className="mt-1.5 text-sm text-[rgb(71,84,103)]">{t.register_form.sub}</p>
      <div className="mt-6 grid gap-4">
        <div>
          <label htmlFor={`name-${idSuffix}`} className="block text-sm font-medium text-[rgb(52,64,84)]">
            {t.register_form.name}
          </label>
          <input
            id={`name-${idSuffix}`}
            name="name"
            type="text"
            required
            className="mt-1.5 block w-full rounded-lg border border-[rgb(228,231,236)] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/30 focus:border-[rgb(255,109,67)]"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`email-${idSuffix}`} className="block text-sm font-medium text-[rgb(52,64,84)]">
              {t.register_form.email}
            </label>
            <input
              id={`email-${idSuffix}`}
              name="email"
              type="email"
              required
              className="mt-1.5 block w-full rounded-lg border border-[rgb(228,231,236)] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/30 focus:border-[rgb(255,109,67)]"
            />
          </div>
          <div>
            <label htmlFor={`company-${idSuffix}`} className="block text-sm font-medium text-[rgb(52,64,84)]">
              {t.register_form.company}
            </label>
            <input
              id={`company-${idSuffix}`}
              name="company"
              type="text"
              required
              className="mt-1.5 block w-full rounded-lg border border-[rgb(228,231,236)] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/30 focus:border-[rgb(255,109,67)]"
            />
          </div>
        </div>
        <div>
          <label htmlFor={`message-${idSuffix}`} className="block text-sm font-medium text-[rgb(52,64,84)]">
            {t.register_form.message}
          </label>
          <textarea
            id={`message-${idSuffix}`}
            name="message"
            rows={3}
            className="mt-1.5 block w-full rounded-lg border border-[rgb(228,231,236)] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/30 focus:border-[rgb(255,109,67)]"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex justify-center items-center px-6 py-3 rounded-lg bg-[rgb(255,109,67)] text-white font-semibold hover:bg-[rgb(229,87,49)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "…" : t.register_form.submit}
        </button>
        {done && (
          <p className="text-sm text-[rgb(7,148,85)]">{t.register_form.success}</p>
        )}
      </div>
    </form>
  );
}

function Footer({ t }: { t: typeof COPY.en }) {
  return (
    <footer className="py-10 border-t border-[rgb(228,231,236)] bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="logo.png" alt="MWRD" className="h-7 w-auto" />
        </div>
        <p className="text-xs text-[rgb(102,112,133)]">
          © {new Date().getFullYear()} MWRD. {t.footer.rights}
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
    <div dir={dir} lang={lang} className="min-h-screen bg-white text-[rgb(16,24,40)] antialiased font-[Inter,system-ui,sans-serif]">
      <Header lang={lang} setLang={setLang} t={t} />
      <main>
        <Hero t={t} />
        <PartnerStrip t={t} />
        <Process t={t} />
        <Features t={t} />
        <section id="register" className="py-20 lg:py-24 bg-[rgb(252,252,253)]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
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
