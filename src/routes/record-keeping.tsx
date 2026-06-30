import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Film, Shield, Phone, Mail, MapPin, AlertCircle } from "lucide-react";

interface CustodianInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
}

export default function RecordKeepingPage() {
  const [custodian, setCustodian] = useState<CustodianInfo | null>(null);

  useEffect(() => {
    api.get("/compliance/custodian")
      .then(({ data }) => setCustodian(data.data.custodian))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5 font-bold w-fit">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow-sm">
            <Film className="size-5" />
          </span>
          <span className="text-xl tracking-tight">Stream<span className="text-primary">Vault</span></span>
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 space-y-10">
        {/* Title */}
        <div className="flex items-start gap-4">
          <span className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">18 U.S.C. § 2257 Record-Keeping Requirements Compliance Statement</h1>
            <p className="mt-1 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>

        {/* Notice box */}
        <div className="flex gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <AlertCircle className="size-5 shrink-0 mt-0.5 text-yellow-500" />
          <p className="text-sm text-muted-foreground">
            StreamVault is committed to complying with all applicable laws and regulations, including 18 U.S.C. § 2257 and 28 C.F.R. Part 75 regarding the maintenance of records for content depicting sexually explicit conduct.
          </p>
        </div>

        {/* Sections */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold border-b border-border pb-2">1. Applicability</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            StreamVault operates as a primary and secondary producer of visual depictions of actual sexually explicit conduct within the meaning of 18 U.S.C. § 2257. All performers depicted in any content hosted on this platform were 18 years of age or older at the time of the creation of such depictions. Records required by 18 U.S.C. § 2257 and 28 C.F.R. Part 75 are kept by the Custodian of Records identified below.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold border-b border-border pb-2">2. Custodian of Records</h2>
          <p className="text-sm text-muted-foreground mb-4">
            All records required pursuant to 18 U.S.C. § 2257 and 28 C.F.R. Part 75 are kept by the following Custodian of Records, available for inspection at the address listed during regular business hours (Monday–Friday, 9:00 AM – 5:00 PM IST):
          </p>
          {custodian ? (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="size-4 shrink-0 mt-0.5 text-primary" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Custodian of Records</p>
                  <p className="font-semibold">{custodian.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="size-4 shrink-0 mt-0.5 text-primary" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Address</p>
                  <p className="text-sm">{custodian.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="size-4 shrink-0 mt-0.5 text-primary" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
                  <a href={`mailto:${custodian.email}`} className="text-sm text-primary hover:underline">{custodian.email}</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="size-4 shrink-0 mt-0.5 text-primary" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</p>
                  <p className="text-sm">{custodian.phone}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 animate-pulse h-40" />
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold border-b border-border pb-2">3. Records Maintained</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            StreamVault maintains the following records for each performer depicted in sexually explicit content on this platform:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
            <li>Legal name and date of birth of each performer</li>
            <li>Any names (including maiden names, aliases, or stage names) used by each performer</li>
            <li>Copies of the identification document reviewed to verify age (government-issued photo ID)</li>
            <li>The title and description of each work in which the performer appears</li>
            <li>The name, title, and business address of the producer(s) of the content</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold border-b border-border pb-2">4. Third-Party Content</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For content produced by third parties and hosted or distributed by StreamVault, StreamVault acts as a secondary producer. The primary producer of each such work maintains the required records per 18 U.S.C. § 2257 and 28 C.F.R. Part 75. StreamVault requires all content providers to certify compliance with all applicable age-verification and record-keeping laws prior to any content being made available on the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold border-b border-border pb-2">5. Inspection</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Records are available for inspection pursuant to 18 U.S.C. § 2257(c) and 28 C.F.R. § 75.5 during regular business hours. Requests for inspection must be submitted in writing to the Custodian of Records at the address listed above with a minimum of 72 hours advance notice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold border-b border-border pb-2">6. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Questions regarding this compliance statement or the records maintained by StreamVault should be directed to the Custodian of Records using the contact information provided above.
          </p>
        </section>

        <div className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            This statement is provided for compliance purposes pursuant to 18 U.S.C. § 2257 and 28 C.F.R. Part 75.{" "}
            <Link to="/" className="text-primary hover:underline">Return to StreamVault</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
