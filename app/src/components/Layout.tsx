import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import StickyCtas from "./StickyCtas";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 md:pt-[72px]">{children}</main>
      <Footer />
      {/* 06 §2 p.3 — sticky WhatsApp AND quotation buttons on mobile. */}
      <StickyCtas />
    </div>
  );
}
