import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <section className="bg-[#0d1f16] min-h-[80vh] flex items-center justify-center">
      <div className="text-center px-5">
        <h1 className="font-display text-8xl md:text-[140px] text-[#d7ff00] leading-none mb-4">404</h1>
        <h2 className="font-display text-2xl md:text-3xl text-white uppercase mb-4">
          Page Not Found
        </h2>
        <p className="text-white/50 text-base font-body max-w-[400px] mx-auto mb-8">
          The page you are looking for does not exist. It might have been moved or deleted.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </section>
  );
}
