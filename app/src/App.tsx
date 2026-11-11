import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import OnlineDesign from "./pages/OnlineDesign";
import Quotation from "./pages/Quotation";
import Portfolio from "./pages/Portfolio";
import Clients from "./pages/Clients";
import FAQ from "./pages/FAQ";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import Contact from "./pages/Contact";
import Track from "./pages/Track";
import LegalPage from "./pages/LegalPage";
import NotFound from "./pages/NotFound";
import { trackPageView, initAnalytics } from "./lib/analytics";
import { useSettings } from "./hooks/useSettings";

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

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AnalyticsBootstrap />
      <Layout>
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
      </Layout>
    </Router>
  );
}

export default App;
