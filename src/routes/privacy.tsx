import { MainLayout } from "@/components/layouts/MainLayout";
import { Link } from "react-router-dom";
import {
  Shield,
  Eye,
  Lock,
  Database,
  RefreshCw,
  Mail,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  const sections = [
    { id: "collection", title: "1. Information We Collect", icon: Database },
    { id: "usage", title: "2. How We Use Information", icon: Eye },
    { id: "sharing", title: "3. Sharing Your Information", icon: Lock },
    { id: "security", title: "4. Data Security & Storage", icon: Shield },
    { id: "rights", title: "5. Your Rights & Choices", icon: RefreshCw },
  ];

  return (
    <MainLayout>
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="size-3.5" />
          Back to Browse
        </Link>

        {/* Glow Accent */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 h-[300px] w-[600px] rounded-full bg-primary/10 blur-[100px]" />

        {/* Header */}
        <div className="relative mb-12 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary mb-4 shadow-[0_0_15px_rgba(192,57,43,0.15)]">
            <Shield className="size-3" /> Legal & Trust
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last Updated: June 23, 2026 • Version 2.1
          </p>
        </div>

        {/* Layout */}
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Sidebar Index */}
          <aside className="lg:col-span-1 space-y-2 h-fit lg:sticky lg:top-24">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-3">
              Table of Contents
            </p>
            {sections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all border border-transparent hover:border-border/30"
              >
                <sec.icon className="size-4 shrink-0 text-muted-foreground/75 group-hover:text-primary transition-colors" />
                <span>{sec.title}</span>
              </a>
            ))}
          </aside>

          {/* Policy Text */}
          <main className="lg:col-span-3 space-y-10">
            {/* Intro Card */}
            <div className="rounded-2xl border border-border bg-card/45 p-6 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <p className="text-sm leading-relaxed text-foreground/85">
                At <strong>StreamVault</strong>, we prioritize the protection of
                your personal details and streaming preferences. This Privacy
                Policy details how we compile, store, protect, and process your
                data when you interact with our streaming platform, APIs,
                dashboard, and customer services.
              </p>
            </div>

            {/* Sections */}
            <section id="collection" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Database className="size-4" />
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  1. Information We Collect
                </h2>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  To deliver a tailored 4K streaming experience, we collect
                  specific data items:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-foreground/80">
                  <li>
                    <strong className="text-foreground">Account Details:</strong>{" "}
                    First name, last name, email address, password hash, and
                    phone number compiled during signup.
                  </li>
                  <li>
                    <strong className="text-foreground">Payment Records:</strong>{" "}
                    Transaction reference hashes, Stripe customer/subscription
                    IDs, currency, and card types. We do NOT store complete
                    credit card details on our databases.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Usage & Watch History:
                    </strong>{" "}
                    Completed video minutes, resolution quality preferences,
                    subtitles settings, parental locks configuration, and
                    content ratings filters.
                  </li>
                  <li>
                    <strong className="text-foreground">Device Information:</strong>{" "}
                    Browser type, operating system version, screen resolution,
                    IP address, and geographic region.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section id="usage" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Eye className="size-4" />
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  2. How We Use Information
                </h2>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  Your information is utilized to run, maintain, and optimize
                  StreamVault:
                </p>
                <div className="grid gap-3 sm:grid-cols-2 mt-2">
                  {[
                    "Activating billing profiles & processing recurring charges.",
                    "Resuming video playbacks directly where you left off.",
                    "Validating age-restricted movies via secure audit logging.",
                    "Alerting you on new shows, custom genres, and plans update.",
                    "Fulfilling referral commissions for affiliate partners.",
                    "Preventing multi-screen concurrent streaming violations.",
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2.5 rounded-xl border border-border bg-card/25 p-3 text-xs text-foreground/80"
                    >
                      <CheckCircle2 className="size-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="sharing" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Lock className="size-4" />
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  3. Sharing Your Information
                </h2>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  We do not sell, rent, or trade your personal details with
                  third-party networks. Information is only shared under secure
                  channels for transaction processing and infrastructure
                  delivery:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-foreground/80">
                  <li>
                    <strong className="text-foreground">Stripe:</strong> Payment
                    intent tokenization, card validations, and billing records
                    fulfillment.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Email Service Providers:
                    </strong>{" "}
                    Delivering password-recovery hashes, transactional receipts,
                    and customer support conversations.
                  </li>
                  <li>
                    <strong className="text-foreground">Legal Obligations:</strong>{" "}
                    Compliance checks, statutory audits, or responding to lawful
                    government inquiries.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section id="security" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="size-4" />
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  4. Data Security & Storage
                </h2>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  We maintain premium physical, operational, and digital
                  security measures. All connection tokens and password records
                  are hashed with strong cryptography (e.g., bcrypt hashes, JWT
                  validation). Session tokens are stored securely in local
                  browser structures.
                </p>
                <p>
                  If you choose to cancel your subscription plan, your details
                  will be retained for up to 90 days for reactivation
                  convenience before permanent redaction.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="rights" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <RefreshCw className="size-4" />
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  5. Your Rights & Choices
                </h2>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  As a valued subscriber, you maintain full authority over your
                  data details:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-foreground/80">
                  <li>
                    You can modify your name, email, and security settings from
                    the profile panel.
                  </li>
                  <li>
                    You can toggle parental locks or adjust maximum ratings
                    preferences.
                  </li>
                  <li>
                    You can opt-out of updates notifications or promotion
                    newsletters.
                  </li>
                  <li>
                    You can initiate data deletion queries by contacting
                    support.
                  </li>
                </ul>
              </div>
            </section>

            {/* Bottom Contact Section */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
              <Mail className="size-6 text-primary mx-auto mb-3" />
              <h3 className="font-bold text-foreground text-base">
                Questions about Privacy?
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Contact our data security desk for any audit queries or
                compliance questions.
              </p>
              <Button size="sm" className="mt-4 font-semibold" asChild>
                <a href="mailto:privacy@streamvault.com">Email Data Officer</a>
              </Button>
            </div>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
