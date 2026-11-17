import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { ROUTER_BASENAME } from "./lib/paths";
import { useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import { trackPageView, initAnalytics } from "./lib/analytics";
import { useSettings } from "./hooks/useSettings";

// Only the home page ships in the first bundle; every other page is its own chunk, fetched when
// it is visited. The design studio and its editor (fonts, patterns, PNG export) are the largest.
const OnlineDesign = lazy(() => import("./pages/OnlineDesign"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Quotation = lazy(() => import("./pages/Quotation"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Clients = lazy(() => import("./pages/Clients"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const Track = lazy(() => import("./pages/Track"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Holds the page height while a page chunk loads, so the footer does not jump up and back.
const pageFallback = <div className="min-h-[60vh] bg-white" aria-busy="true" />;

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    // Fire a SPA page-view for GA4 + Meta Pixel (no-op until a tag is loaded).
    trackPageView(pathname);
  }, [pathname]);
  return null;
}

// Loads analytics tags using the admin-entered IDs from Landing → Settings
// (settings.analytics.*). Idempotent per tag; env vars act as a dev fallback.
function AnalyticsBootstrap() {
  const { data: settings } = useSettings();
  useEffect(() => {
    initAnalytics(settings?.analytics?.ga_measurement_id, settings?.analytics?.meta_pixel_id);
  }, [settings]);
  return null;
}

/** The routed site without a router, so the build-time prerender can wrap it in a StaticRouter. */
export function AppShell() {
  return (
    <>
      <ScrollToTop />
      <AnalyticsBootstrap />
      <Layout>
        <Suspense fallback={pageFallback}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about-us" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:slug" element={<ServiceDetail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/online-design" element={<OnlineDesign />} />
            <Route path="/quotation" element={<Quotation />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/track" element={<Track />} />
            {/* Legal pages — the three URLs Meta requires for the WhatsApp Business app. */}
            <Route path="/privacy-policy" element={<LegalPage pageKey="privacy-policy" />} />
            <Route path="/terms-of-service" element={<LegalPage pageKey="terms-of-service" />} />
            <Route path="/data-deletion" element={<LegalPage pageKey="data-deletion" />} />
            <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
            <Route path="/terms" element={<Navigate to="/terms-of-service" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}

function App() {
  return (
    <Router basename={ROUTER_BASENAME}>
      <AppShell />
    </Router>
  );
}

export default App;
