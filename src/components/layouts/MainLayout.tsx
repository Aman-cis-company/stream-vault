import type { ReactNode } from "react";
import { Navbar } from "@/components/streaming/Navbar";
import { Footer } from "@/components/streaming/Footer";

export function MainLayout({ children, flush = false }: { children: ReactNode; flush?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className={flush ? "flex-1" : "mx-auto w-full flex-1 px-8 py-8 sm:px-12"}>
        {children}
      </div>
      <Footer />
    </div>
  );
}
