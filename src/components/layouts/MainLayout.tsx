import type { ReactNode } from "react";
import { Navbar } from "@/components/streaming/Navbar";
import { Footer } from "@/components/streaming/Footer";

export function MainLayout({ children, flush = false }: { children: ReactNode; flush?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className={flush ? "flex-1" : "mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6"}>
        {children}
      </div>
      <Footer />
    </div>
  );
}
