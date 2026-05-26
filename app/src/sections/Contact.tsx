import { useEffect, useRef } from 'react';
import { Phone, Mail, MapPin, Send, MessageSquare, Facebook, Instagram, Globe, Youtube, Linkedin, Twitter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/useSettings';
import { useContactSubmission } from '@/hooks/useContactSubmission';

const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(5, 'Pesan minimal 5 karakter'),
  website: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const SOCIAL_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
};

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const openTime = useRef(Math.floor(Date.now() / 1000));
  const { data: settings } = useSettings();
  const mutation = useContactSubmission();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { website: '' },
  });

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

  const onSubmit = async (values: FormValues) => {
    try {
      await mutation.mutateAsync({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        subject: values.subject || undefined,
        message: values.message,
        website: values.website ?? '',
        _t: openTime.current,
      });
      toast.success('Pesan terkirim, tim sales akan menghubungi Anda.');
      reset();
      openTime.current = Math.floor(Date.now() / 1000);
    } catch (err: unknown) {
      const e = err as { status?: number; code?: string; message?: string; fields?: Record<string, string[]> };
      if (e?.status === 422 && e.fields) {
        Object.entries(e.fields).forEach(([field, msgs]) => {
          if (field in schema.shape) {
            setError(field as keyof FormValues, { type: 'server', message: msgs[0] });
          }
        });
        toast.error('Mohon periksa kembali isian Anda.');
      } else if (e?.status === 429) {
        toast.error('Terlalu banyak permintaan, coba lagi sebentar.');
      } else {
        toast.error('Gagal mengirim, coba lagi.');
      }
    }
  };

  const phone = settings?.contact_phone || '088-205423';
  const email = settings?.contact_email || 'sales@askcreativeprinting.com';
  const address = settings?.contact_address || 'ASK Creative, No A6-1, Ground Floor, Block A, Kepayan Perdana, 88200 Kota Kinabalu, Sabah, Malaysia';
  const social = settings?.social || {};
  const siteName = settings?.site_name || 'ASK Creative';

  const socialLinks = Object.entries(social)
    .filter(([, url]) => !!url)
    .map(([key, url]) => ({
      key,
      url: url as string,
      Icon: SOCIAL_ICONS[key] || Globe,
      label: key.charAt(0).toUpperCase() + key.slice(1),
    }));

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative w-full"
      style={{ background: '#062d2e' }}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12" style={{ paddingTop: 120, paddingBottom: 120 }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
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
                  <p className="font-body text-white/80 whitespace-pre-line">{phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 fade-up opacity-0 translate-y-5 transition-all duration-700">
                <div className="w-10 h-10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <Mail size={16} className="text-brand-gold-500" />
                </div>
                <div>
                  <p className="font-mono text-xs tracking-[1px] text-white/50 uppercase mb-1">Email</p>
                  <a href={`mailto:${email}`} className="font-body text-white/80 hover:text-brand-gold-400 transition-colors">
                    {email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 fade-up opacity-0 translate-y-5 transition-all duration-700">
                <div className="w-10 h-10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-brand-gold-500" />
                </div>
                <div>
                  <p className="font-mono text-xs tracking-[1px] text-white/50 uppercase mb-1">Address</p>
                  <p className="font-body text-white/80 whitespace-pre-line">{address}</p>
                </div>
              </div>
            </div>

            {socialLinks.length > 0 && (
              <div className="flex gap-3 mt-10 fade-up opacity-0 translate-y-5 transition-all duration-700">
                {socialLinks.map(({ key, url, Icon, label }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 border border-white/15 flex items-center justify-center hover:border-brand-gold-500 hover:bg-brand-gold-500/10 transition-all"
                    title={label}
                  >
                    <Icon size={16} className="text-white/60" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="fade-up opacity-0 translate-y-5 transition-all duration-700">
            <div className="bg-brand-teal-800 p-8 border border-white/15">
              {mutation.isSuccess ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-brand-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare size={28} className="text-brand-gold-500" />
                  </div>
                  <h3 className="font-display text-xl text-white mb-2">Message Sent!</h3>
                  <p className="font-body text-sm text-white/60">
                    We&apos;ll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => mutation.reset()}
                    className="mt-6 font-mono text-xs tracking-[1.5px] text-brand-gold-500 hover:text-brand-gold-400 underline"
                  >
                    SEND ANOTHER
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
                    {...register('website')}
                    aria-hidden="true"
                  />

                  <div>
                    <label className="font-mono text-xs tracking-[1px] text-white/50 uppercase block mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className="w-full bg-transparent border border-white/20 py-3 px-4 font-body text-sm text-white placeholder:text-white/30 focus:border-brand-gold-500 focus:outline-none transition-colors"
                      placeholder="Your full name"
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1 font-mono">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="font-mono text-xs tracking-[1px] text-white/50 uppercase block mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full bg-transparent border border-white/20 py-3 px-4 font-body text-sm text-white placeholder:text-white/30 focus:border-brand-gold-500 focus:outline-none transition-colors"
                      placeholder="you@company.com"
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1 font-mono">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="font-mono text-xs tracking-[1px] text-white/50 uppercase block mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="w-full bg-transparent border border-white/20 py-3 px-4 font-body text-sm text-white placeholder:text-white/30 focus:border-brand-gold-500 focus:outline-none transition-colors"
                      placeholder="+60 12-345 6789"
                    />
                    {errors.phone && <p className="text-red-400 text-xs mt-1 font-mono">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <label className="font-mono text-xs tracking-[1px] text-white/50 uppercase block mb-2">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      {...register('message')}
                      className="w-full bg-transparent border border-white/20 py-3 px-4 font-body text-sm text-white placeholder:text-white/30 focus:border-brand-gold-500 focus:outline-none transition-colors resize-none"
                      placeholder="Tell us about your project..."
                    />
                    {errors.message && <p className="text-red-400 text-xs mt-1 font-mono">{errors.message.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || mutation.isPending}
                    className="w-full bg-brand-gold-500 hover:bg-brand-gold-400 disabled:opacity-60 disabled:cursor-not-allowed text-[#062d2e] font-mono text-xs tracking-[1.5px] py-4 rounded-pill transition-colors flex items-center justify-center gap-2"
                  >
                    <Send size={14} />
                    {isSubmitting || mutation.isPending ? 'SENDING...' : 'SEND MESSAGE'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/15">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg text-white">{siteName}</span>
          </div>
          <p className="font-mono text-xs text-white/40">
            &copy; {new Date().getFullYear()} {siteName} Printing Services. All rights reserved.
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
