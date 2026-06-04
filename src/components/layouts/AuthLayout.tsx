import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import heroBackdrop from "@/assets/hero-backdrop.jpg";
import { Film } from "lucide-react";

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
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={heroBackdrop} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2.5 font-bold">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
              <Film className="size-5" />
            </span>
            <span className="text-xl tracking-tight">Stream<span className="text-gradient">Vault</span></span>
          </Link>
          <div className="max-w-md space-y-4">
            <blockquote className="text-2xl font-semibold leading-snug">
              "The best stories deserve the best screen."
            </blockquote>
            <div className="flex items-center gap-3">
              <img src="https://i.pravatar.cc/40?img=12" alt="" className="size-10 rounded-full ring-2 ring-primary/30" />
              <div>
                <p className="text-sm font-medium">Arjun Mehta</p>
                <p className="text-xs text-muted-foreground">Premium subscriber since 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8 bg-background">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2.5 font-bold lg:hidden">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
              <Film className="size-5" />
            </span>
            <span className="text-xl tracking-tight">Stream<span className="text-gradient">Vault</span></span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
