import { useState, useEffect, useRef } from 'react';
import { Phone, Mail, MapPin, Send, MessageSquare, Facebook, Instagram, Globe } from 'lucide-react';

export default function Contact() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const els = entry.target.querySelectorAll('.fade-up');
            els.forEach((el, i) => {
              (el as HTMLElement).style.transitionDelay = `${i * 100}ms`;
              el.classList.add('animate-in');
            });
          }
        });
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 4000);
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative w-full"
      style={{ background: '#062d2e' }}
    >
      {/* Contact Section */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12" style={{ paddingTop: 120, paddingBottom: 120 }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left - Contact Info */}
          <div>
            <p className="font-mono text-xs tracking-[2px] text-brand-gold-500 uppercase mb-4 fade-up opacity-0 translate-y-5 transition-all duration-700">
              GET IN TOUCH
            </p>
            <h2
              className="font-display font-medium text-white mb-8 fade-up opacity-0 translate-y-5 transition-all duration-700"
              style={{ fontSize: 'clamp(32px, 3.5vw, 48px)', lineHeight: 1.1 }}
            >
              Contact Us
            </h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4 fade-up opacity-0 translate-y-5 transition-all duration-700">
                <div className="w-10 h-10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <Phone size={16} className="text-brand-gold-500" />
                </div>
                <div>
                  <p className="font-mono text-xs tracking-[1px] text-white/50 uppercase mb-1">Phone</p>
                  <p className="font-body text-white/80">088-205423</p>
                  <p className="font-body text-white/60 text-sm">016-216 4774 / 010-217 4774</p>
                </div>
              </div>

              <div className="flex items-start gap-4 fade-up opacity-0 translate-y-5 transition-all duration-700">
                <div className="w-10 h-10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <Mail size={16} className="text-brand-gold-500" />
                </div>
                <div>
                  <p className="font-mono text-xs tracking-[1px] text-white/50 uppercase mb-1">Email</p>
                  <p className="font-body text-white/80">sales@askcreativeprinting.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4 fade-up opacity-0 translate-y-5 transition-all duration-700">
                <div className="w-10 h-10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-brand-gold-500" />
                </div>
                <div>
                  <p className="font-mono text-xs tracking-[1px] text-white/50 uppercase mb-1">Address</p>
                  <p className="font-body text-white/80">
                    ASK Creative, No A6-1, Ground Floor,<br />
                    Block A, Kepayan Perdana,<br />
                    88200 Kota Kinabalu, Sabah, Malaysia
                  </p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-10 fade-up opacity-0 translate-y-5 transition-all duration-700">
              {[
                { icon: Facebook, label: 'Facebook' },
                { icon: Instagram, label: 'Instagram' },
                { icon: Globe, label: 'Website' },
              ].map((social) => (
                <button
                  key={social.label}
                  className="w-10 h-10 border border-white/15 flex items-center justify-center hover:border-brand-gold-500 hover:bg-brand-gold-500/10 transition-all"
                  title={social.label}
                >
                  <social.icon size={16} className="text-white/60" />
                </button>
              ))}
            </div>
          </div>

          {/* Right - Contact Form */}
          <div className="fade-up opacity-0 translate-y-5 transition-all duration-700">
            <div className="bg-brand-teal-800 p-8 border border-white/15">
              {formSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-brand-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare size={28} className="text-brand-gold-500" />
                  </div>
                  <h3 className="font-display text-xl text-white mb-2">Message Sent!</h3>
                  <p className="font-body text-sm text-white/60">
                    We&apos;ll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="font-mono text-xs tracking-[1px] text-white/50 uppercase block mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-transparent border border-white/20 py-3 px-4 font-body text-sm text-white placeholder:text-white/30 focus:border-brand-gold-500 focus:outline-none transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs tracking-[1px] text-white/50 uppercase block mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full bg-transparent border border-white/20 py-3 px-4 font-body text-sm text-white placeholder:text-white/30 focus:border-brand-gold-500 focus:outline-none transition-colors"
                      placeholder="you@company.com"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs tracking-[1px] text-white/50 uppercase block mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full bg-transparent border border-white/20 py-3 px-4 font-body text-sm text-white placeholder:text-white/30 focus:border-brand-gold-500 focus:outline-none transition-colors"
                      placeholder="+60 12-345 6789"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs tracking-[1px] text-white/50 uppercase block mb-2">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      required
                      className="w-full bg-transparent border border-white/20 py-3 px-4 font-body text-sm text-white placeholder:text-white/30 focus:border-brand-gold-500 focus:outline-none transition-colors resize-none"
                      placeholder="Tell us about your project..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-brand-gold-500 hover:bg-brand-gold-400 text-[#062d2e] font-mono text-xs tracking-[1.5px] py-4 rounded-pill transition-colors flex items-center justify-center gap-2"
                  >
                    <Send size={14} />
                    SEND MESSAGE
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/15">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg text-white">ASK</span>
            <span className="font-display font-medium text-xs tracking-[0.2em] text-brand-gold-500 uppercase">
              Creative
            </span>
          </div>
          <p className="font-mono text-xs text-white/40">
            &copy; {new Date().getFullYear()} ASK Creative Printing Services. All rights reserved.
          </p>
          <p className="font-mono text-xs text-white/40">
            www.askcreativeprinting.com
          </p>
        </div>
      </footer>

      <style>{`
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </section>
  );
}
