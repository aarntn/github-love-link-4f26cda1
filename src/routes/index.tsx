import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, ShieldCheck, Sparkles, Check, Copy, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const WA_NUMBER = "+1 415 523 8886";
const WA_NUMBER_DIGITS = "14155238886";
const JOIN_CODE = "join dollar-leather";
const WA_LINK = `https://wa.me/${WA_NUMBER_DIGITS}?text=${encodeURIComponent(JOIN_CODE)}`;

const TEAL = "#0D9E75";
const WHATSAPP = "#25D366";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Klinika — Dapatkan Bantuan Kesihatan Sekarang" },
      {
        name: "description",
        content:
          "Klinika ialah pembantu triaj perubatan AI untuk komuniti Kuala Lumpur. Ceritakan simptom anda di WhatsApp — kami pandukan anda ke klinik yang sesuai.",
      },
      { property: "og:title", content: "Klinika — Triaj Kesihatan AI di WhatsApp" },
      {
        property: "og:description",
        content:
          "Percuma, tanpa IC, dalam BM / English / Tamil / Bangla. Jagaan untuk semua, tanpa soal siasat.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <Header />
      <main className="pb-32 md:pb-12">
        <Hero />
        <HowItWorks />
        <WhatsappCTA />
        <AnonymousCallout />
      </main>
      <Footer />
      <MobileStickyCTA />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-border/40">
      <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <LogoMark />
          <span className="text-lg">Klinika</span>
        </Link>
        <Link
          to="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Clinician Dashboard →
        </Link>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold"
      style={{ backgroundColor: TEAL }}
      aria-hidden
    >
      +
    </span>
  );
}

function Hero() {
  return (
    <section className="px-5 md:px-8 pt-12 md:pt-20 pb-10 md:pb-16">
      <div className="max-w-3xl mx-auto text-center">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-6"
          style={{ backgroundColor: "rgba(13,158,117,0.10)", color: TEAL }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Triaj kesihatan AI di WhatsApp
        </span>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
          Dapatkan Bantuan
          <br />
          Kesihatan Sekarang.
        </h1>
        <p className="mt-5 md:mt-6 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Klinika ialah pembantu triaj perubatan AI untuk komuniti Kuala Lumpur. Ceritakan
          simptom anda — kami akan pandukan anda ke klinik yang sesuai, tanpa soal siasat.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 text-sm text-foreground/80">
          <TrustLine>Tiada IC diperlukan — mod anonymous tersedia</TrustLine>
          <TrustLine>Tersedia dalam Bahasa Malaysia, English, Tamil &amp; Bangla</TrustLine>
          <TrustLine>Percuma sepenuhnya</TrustLine>
        </div>

        <div className="mt-10 flex flex-col items-center">
          <WhatsappButton size="lg" />
          <p className="mt-4 text-xs text-muted-foreground">
            Atau scroll bawah untuk arahan manual ↓
          </p>
        </div>
      </div>
    </section>
  );
}

function TrustLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full shrink-0"
        style={{ backgroundColor: "rgba(13,158,117,0.12)", color: TEAL }}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      <span>{children}</span>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      emoji: "💬",
      title: "Ceritakan simptom anda",
      body: "Taip dalam bahasa apa sekalipun — BM, English, Tamil, atau Bangla.",
    },
    {
      emoji: "🤖",
      title: "AI analisis & triage",
      body: "Klinika semak red flag dan hotspot denggi secara automatik.",
    },
    {
      emoji: "🏥",
      title: "Dapat rujukan klinik",
      body: "Kami cadangkan klinik terbaik yang dekat dengan anda.",
    },
  ];

  return (
    <section className="px-5 md:px-8 py-16 md:py-20 border-t border-border/40 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Macam mana ia berfungsi
          </h2>
          <p className="mt-2 text-muted-foreground">Tiga langkah mudah — siap dalam 2 minit.</p>
        </div>

        <ol className="grid gap-5 md:grid-cols-3 md:gap-6">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-2xl border bg-card p-6 md:p-7 transition-shadow hover:shadow-sm"
            >
              <span
                className="absolute -top-3 left-6 text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: TEAL }}
              >
                Langkah {i + 1}
              </span>
              <div className="text-4xl mb-3" aria-hidden>
                {s.emoji}
              </div>
              <h3 className="font-semibold text-lg leading-snug">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function WhatsappCTA() {
  return (
    <section className="px-5 md:px-8 py-16 md:py-24">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Sedia untuk mula?</h2>
        <p className="mt-3 text-muted-foreground">
          Tekan butang di bawah untuk buka WhatsApp dengan mesej pengaktifan siap diisi.
        </p>

        <div className="mt-8 flex justify-center">
          <WhatsappButton size="lg" />
        </div>

        <div className="mt-12 rounded-2xl border bg-card p-6 md:p-8 text-left">
          <p className="text-sm font-medium text-foreground mb-4">
            Atau WhatsApp secara manual:
          </p>
          <ol className="space-y-4 text-sm">
            <li className="flex gap-3">
              <Step n={1} />
              <div>
                <div className="text-foreground">
                  Simpan / buka nombor ini di WhatsApp:
                </div>
                <div className="mt-1.5 inline-flex items-center gap-2 font-mono text-sm bg-muted px-3 py-1.5 rounded-md">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {WA_NUMBER}
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <Step n={2} />
              <div>
                <div className="text-foreground">Hantar mesej ini untuk aktifkan bot:</div>
                <div className="mt-1.5">
                  <CopyableCode value={JOIN_CODE} />
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <Step n={3} />
              <div className="text-foreground pt-0.5">
                Tunggu balasan, kemudian ceritakan simptom anda.
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span
      className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
      style={{ backgroundColor: "rgba(13,158,117,0.12)", color: TEAL }}
    >
      {n}
    </span>
  );
}

function CopyableCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 font-mono text-sm bg-foreground/5 hover:bg-foreground/10 transition-colors px-3 py-1.5 rounded-md border border-border"
      title="Klik untuk salin"
    >
      <span>{value}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5" style={{ color: TEAL }} />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

function AnonymousCallout() {
  return (
    <section className="px-5 md:px-8 pb-16 md:pb-24">
      <div
        className="max-w-3xl mx-auto rounded-3xl p-8 md:p-12 text-center md:text-left md:flex md:items-start md:gap-8"
        style={{ backgroundColor: "rgba(13,158,117,0.08)" }}
      >
        <div className="text-5xl md:text-6xl mb-3 md:mb-0 shrink-0" aria-hidden>
          🛡️
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Tiada Dokumen? Tiada Masalah.
          </h2>
          <p className="mt-3 text-foreground/80 leading-relaxed">
            Mod <strong>anonymous</strong> kami tidak simpan nama, IC, atau maklumat peribadi
            anda. Sesuai untuk pekerja migran, pelarian, dan sesiapa yang memerlukan jagaan
            tanpa risiko.
          </p>
          <div
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: TEAL }}
          >
            <ShieldCheck className="h-4 w-4" />
            Privasi dijamin sepenuhnya
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 px-5 md:px-8 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <div>
              <div className="font-semibold leading-tight">Klinika</div>
              <div className="text-xs text-muted-foreground">
                Jagaan untuk semua, tanpa soal siasat.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/dashboard" className="hover:text-foreground transition-colors">
              Clinician Dashboard
            </Link>
            <span aria-hidden>·</span>
            <span>Built for Vibeathon 2025</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-2xl">
          Klinika tidak menggantikan nasihat perubatan profesional. Dalam kecemasan, hubungi{" "}
          <strong className="text-foreground">999</strong>.
        </p>
      </div>
    </footer>
  );
}

function WhatsappButton({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <a
      href={WA_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2.5 rounded-full font-semibold text-white shadow-lg shadow-black/5 transition-transform hover:scale-[1.02] active:scale-[0.99]",
        size === "lg" ? "px-7 py-4 text-base md:text-lg" : "px-5 py-3 text-sm",
      )}
      style={{ backgroundColor: WHATSAPP }}
    >
      <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
      Mula Chat di WhatsApp
    </a>
  );
}

function MobileStickyCTA() {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 bg-gradient-to-t from-white via-white to-white/0">
      <a
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 font-semibold text-white shadow-lg"
        style={{ backgroundColor: WHATSAPP }}
      >
        <MessageCircle className="h-5 w-5" />
        Mula Chat di WhatsApp
      </a>
    </div>
  );
}
