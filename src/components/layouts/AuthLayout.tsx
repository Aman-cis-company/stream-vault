import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import heroBackdrop from "@/assets/hero-backdrop.jpg";
import streamVaultLogo from "@/assets/streamvault-logo.png";

function LogoMark({ size = 36 }: { size?: number }) {
  const h = size;
  const w = Math.round(size * 4);
  return (
    <img
      src={streamVaultLogo}
      alt="StreamVault"
      width={w}
      height={h}
      className="object-contain"
      style={{ maxHeight: h, mixBlendMode: 'screen' }}
    />
  );
}

const STATS = [
  { value: "2.4M+", label: "Subscribers" },
  { value: "50K+", label: "Titles" },
  { value: "4K HDR", label: "Quality" },
];

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_480px]">
      {/* ── Cinematic left panel ── */}
      <div className="relative hidden lg:flex flex-col overflow-hidden">
        {/* Background image */}
        <img
          src={heroBackdrop}
          alt=""
          className="absolute inset-0 size-full object-cover scale-105"
          style={{ filter: "brightness(0.45)" }}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />

        {/* Subtle primary color wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          {/* Logo */}
          <Link to="/" className="flex items-center group w-fit">
            <div className="transition-transform duration-200 group-hover:scale-105">
              <LogoMark size={40} />
            </div>
          </Link>

          {/* Hero quote + stats */}
          <div className="max-w-md space-y-8">
            {/* Stats row */}
            <div className="flex items-center gap-6">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-extrabold text-white tracking-tight">{s.value}</p>
                  <p className="text-xs text-white/50 font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Quote */}
            <div>
              <blockquote className="text-2xl font-bold leading-tight text-white">
                "Cinema is a mirror by which we often see{" "}
                <span className="text-gradient">ourselves.</span>"
              </blockquote>
              <div className="mt-5 flex items-center gap-3">
                <img
                  src="https://i.pravatar.cc/48?img=12"
                  alt="Arjun Mehta"
                  className="size-11 rounded-full ring-2 ring-primary/40 object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-white">Arjun Mehta</p>
                  <p className="text-xs text-white/50">Cinephile member since 2023</p>
                </div>
              </div>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {["4K Ultra HD", "Dolby Atmos", "Offline Mode", "Cancel Anytime"].map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm"
                >
                  <span className="size-1 rounded-full bg-primary" />
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex flex-col min-h-screen bg-transparent lg:border-l lg:border-border dark:lg:border-white/6">
        {/* Top bar (mobile logo) */}
        <div className="flex items-center justify-between px-6 pt-6 lg:hidden">
          <Link to="/" className="flex items-center group">
            <LogoMark size={32} />
          </Link>
        </div>

        {/* Centered form */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-[380px]">
            {/* Form header */}
            <div className="mb-8">
              <h1 className="text-[26px] font-extrabold tracking-tight text-foreground">{title}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            </div>

            {/* Form content */}
            <div className="space-y-1">
              {children}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-[11px] text-muted-foreground/45">
            © {new Date().getFullYear()} StreamVault · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
