import { MainLayout } from "@/components/layouts/MainLayout";
import { Link } from "react-router-dom";
import {
  Shield,
  Lock,
  FileText,
  Scale,
  Globe,
  AlertTriangle,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  const sections = [
    { id: "acceptance", title: "1. Acceptance of Terms", icon: Scale },
    { id: "eligibility", title: "2. Account & Eligibility", icon: Lock },
    { id: "billing", title: "3. Billing & Cancellations", icon: FileText },
    { id: "usage", title: "4. Streaming License", icon: Globe },
    { id: "limits", title: "5. Limits of Liability", icon: AlertTriangle },
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
            <Shield className="size-3" /> Legal & Terms
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last Updated: June 23, 2026 • Version 3.0
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

          {/* Terms Text */}
          <main className="lg:col-span-3 space-y-10">
            {/* Intro Card */}
            <div className="rounded-2xl border border-border bg-card/45 p-6 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <p className="text-sm leading-relaxed text-foreground/85">
                Welcome to <strong>StreamVault</strong>. These Terms of Service
                ("Terms") govern your access and use of the StreamVault
                subscription platforms, API routers, and visual player modules.
                By establishing an account, you explicitly agree to align with
                these legal parameters.
              </p>
            </div>

            {/* Sections */}
            <section id="acceptance" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Scale className="size-4" />
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  1. Acceptance of Terms
                </h2>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  By accessing our platforms or viewing content, you affirm that
                  you have read, understood, and agreed to be legally bound by
                  these Terms and our Privacy Policy. If you do not agree to any
                  of these guidelines, you must cease using our services
                  immediately.
                </p>
                <p>
                  We reserve the right to alter, modify, or rewrite these Terms
                  at any period. Your continued usage of StreamVault following
                  updates indicates full acceptance of the revised legal terms.
                </p>
              </div>
            </section>

            <section id="eligibility" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Lock className="size-4" />
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  2. Account & Eligibility
                </h2>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>To subscribe or create an account, you must:</p>
                <ul className="list-disc pl-5 space-y-2 text-foreground/80">
                  <li>
                    Be at least 18 years old or the age of legal majority in
                    your territory.
                  </li>
                  <li>
                    Maintain secure password guards and prevent unauthorized
                    account access.
                  </li>
                  <li>
                    Provide accurate, authentic details, specifically during
                    age-restricted content validation audits.
                  </li>
                </ul>
                <p>
                  We reserve the right to ban, suspend, or terminate accounts
                  immediately if any details are found to be fraudulent or in
                  violation of these safety regulations.
                </p>
              </div>
            </section>

            <section id="billing" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  3. Billing & Cancellations
                </h2>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  Our subscription structures, price plans, and bill timings:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-foreground/80">
                  <li>
                    <strong className="text-foreground">Recurring Cycles:</strong>{" "}
                    Membership plans bill automatically at the start of each
                    billing period (monthly or yearly) until cancelled.
                  </li>
                  <li>
                    <strong className="text-foreground">Stripe Checkout:</strong> All
                    transaction collections are secured and processed directly
                    via Stripe. All prices are in Indian Rupees (₹).
                  </li>
                  <li>
                    <strong className="text-foreground">Cancellations:</strong> You
                    can cancel your subscription plan at any period from your
                    user dashboard. Upon cancellation, your access remains
                    active until the end of the current billing cycle. No
                    partial refunds are issued.
                  </li>
                </ul>
              </div>
            </section>

            <section id="usage" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Globe className="size-4" />
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  4. Streaming License & Concurrency
                </h2>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  Subject to plan status, we grant you a limited, non-exclusive,
                  non-transferable, revocable license to access and stream
                  movies and series for personal, non-commercial entertainment.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-foreground/80">
                  <li>
                    <strong className="text-foreground">Screen Limits:</strong>{" "}
                    Concurrent streaming is restricted by your subscription plan
                    (e.g., maximum of 2 screens for Standard, 4 screens for
                    Premium). Sharing login details to bypass screen limits
                    violates these Terms.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Security Protections:
                    </strong>{" "}
                    You agree not to copy, record, download (except via official
                    offline modules), modify, redistribute, or reverse engineer
                    any content or player components.
                  </li>
                </ul>
              </div>
            </section>

            <section id="limits" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <AlertTriangle className="size-4" />
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  5. Limits of Liability
                </h2>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  STREAMVAULT SERVICES AND VIDEO STREAMS ARE DELIVERED "AS IS"
                  AND "AS AVAILABLE" WITHOUT ANY EXPRESS OR IMPLIED WARRANTIES.
                  We do not guarantee uninterrupted, lag-free streaming, or that
                  all titles will remain permanently in our content directory.
                </p>
                <p>
                  In no event shall StreamVault, its directors, employees, or
                  partners be liable for any special, incidental, or
                  consequential damages resulting from your usage or inability
                  to access the platform.
                </p>
              </div>
            </section>

            {/* Bottom Contact Section */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
              <Mail className="size-6 text-primary mx-auto mb-3" />
              <h3 className="font-bold text-foreground text-base">
                Legal Inquiries?
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                For questions regarding intellectual property rights, licenses,
                or compliance topics, please contact our legal desk.
              </p>
              <Button size="sm" className="mt-4 font-semibold" asChild>
                <a href="mailto:legal@streamvault.com">Contact Legal Desk</a>
              </Button>
            </div>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
