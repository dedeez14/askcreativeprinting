import { useState, useRef } from "react";
import {
  Phone, Mail, MapPin, MessageCircle, Send, Check, Clock,
} from "lucide-react";
import { toast } from "sonner";
import SEOHead from "../components/SEOHead";
import { useContactSubmission } from "../hooks/useContactSubmission";
import { useFormTracking } from "../hooks/useFormTracking";
import { useSettings } from "../hooks/useSettings";

const FALLBACK_SALES_TEAM = [
  { name: "Mrs. Dayang", phone: "60102174774" },
  { name: "Mrs. Khalisah", phone: "60143584774" },
  { name: "Mrs. Michelle", phone: "60162164774" },
  { name: "Ms. Suhaznie", phone: "60146024474" },
  { name: "Ms. Fara", phone: "60102174750" },
];

const FALLBACK_SUBJECTS = [
  "Quotation Request",
  "Order Enquiry",
  "Design Support",
  "General Question",
  "Feedback",
  "Others",
];

const FALLBACK_HOURS = [
  { day: "Monday – Friday", hours: "8:30 AM – 5:30 PM" },
  { day: "Saturday",         hours: "9:00 AM – 1:00 PM" },
  { day: "Sunday",           hours: "Closed" },
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const formOpenedAt = useRef(Math.floor(Date.now() / 1000));
  const mutation = useContactSubmission();
  const track = useFormTracking("contact");
  const { data: settings } = useSettings();
  const salesTeam = (settings?.sales_team && settings.sales_team.length > 0) ? settings.sales_team : FALLBACK_SALES_TEAM;
  const officePhone = settings?.contact_phone || "088 205 423";
  const officeEmail = settings?.contact_email || "sales@askcreativeprinting.com";
  const officeAddress = settings?.contact_address || "ASK Creative, No A6-1, Ground Floor, Block A, Kepayan Perdana, 88200 Kota Kinabalu, Sabah, Malaysia";
  const subjects = (settings?.contact_subjects && settings.contact_subjects.length > 0) ? settings.contact_subjects : FALLBACK_SUBJECTS;
  const operatingHours = (settings?.operating_hours && settings.operating_hours.length > 0) ? settings.operating_hours : FALLBACK_HOURS;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      subject: String(fd.get("subject") || "").trim() || null,
      message: String(fd.get("message") || "").trim(),
      website: String(fd.get("website") || ""), // honeypot
      _t: formOpenedAt.current,
    };
    mutation.mutate(payload, {
      onSuccess: () => {
        track.markSubmitted();
        setSubmitted(true);
        toast.success("Pesan terkirim. Tim sales akan menghubungi Anda.");
      },
      onError: (err: any) => {
        if (err?.status === 429) toast.error("Terlalu banyak permintaan, coba lagi sebentar.");
        else if (err?.status === 422) toast.error(err?.message ?? "Periksa kembali isian Anda.");
        else toast.error("Server bermasalah, coba lagi.");
      },
    });
  };

  return (
    <>
      <SEOHead
        title="Contact Us | ASK Creative Printing Kota Kinabalu, Sabah"
        description="Reach out to ASK Creative for quotations, enquiries or to discuss your custom printing project in Kota Kinabalu, Sabah. WhatsApp, phone, email or visit our office."
        keywords="contact ASK Creative, printing company Kota Kinabalu, WhatsApp printing, custom printing contact"
        canonical="/contact"
      />

      {/* Page Hero */}
      <section className="bg-[#0d1f16] pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-4">
            Contact Us
          </h1>
          <p className="text-white/50 text-lg font-body max-w-[560px] mx-auto">
            Reach out to our team for quotations, enquiries or to discuss your project.
          </p>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              {!submitted ? (
                <div className="bg-white border border-forest-900/15 rounded-lg p-8">
                  <form onSubmit={handleSubmit} onChange={track.start} className="space-y-5">
                    {/* honeypot — bots fill this; real users never see it */}
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      style={{ position: "absolute", left: "-9999px" }}
                      aria-hidden="true"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <input
                        type="text"
                        name="name"
                        placeholder="Name *"
                        required
                        className="w-full px-4 py-3 rounded-md border border-forest-900/15 text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500"
                      />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email *"
                        required
                        className="w-full px-4 py-3 rounded-md border border-forest-900/15 text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone *"
                      required
                      className="w-full px-4 py-3 rounded-md border border-forest-900/15 text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500"
                    />
                    <select
                      name="subject"
                      className="w-full px-4 py-3 rounded-md border border-forest-900/15 text-forest-900 text-sm font-body focus:outline-none focus:border-teal-500 bg-white"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <textarea
                      rows={5}
                      name="message"
                      placeholder="Your Message *"
                      required
                      className="w-full px-4 py-3 rounded-md border border-forest-900/15 text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500 resize-none"
                    />
                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="w-full bg-[#d7ff00] text-[#0d1f16] px-5 py-3.5 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {mutation.isPending ? "Sending..." : "Send Message"}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-display text-2xl text-forest-900 uppercase mb-3">
                    Message Sent
                  </h3>
                  <p className="text-forest-900/70 text-base font-body">
                    Thank you! We will get back to you soon.
                  </p>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2">
              <div className="bg-off-white rounded-lg p-8">
                {/* Office */}
                <div className="mb-8">
                  <h3 className="text-forest-900 text-lg font-body font-medium mb-4">Office</h3>
                  <div className="space-y-3">
                    <a href={`tel:${officePhone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-forest-900/70 text-sm font-body hover:text-teal-600 transition-colors">
                      <Phone className="w-4 h-4 shrink-0" />
                      {officePhone}
                    </a>
                    <a href={`mailto:${officeEmail}`} className="flex items-center gap-3 text-forest-900/70 text-sm font-body hover:text-teal-600 transition-colors">
                      <Mail className="w-4 h-4 shrink-0" />
                      {officeEmail}
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="mb-8">
                  <h3 className="text-forest-900 text-lg font-body font-medium mb-4">WhatsApp Sales Team</h3>
                  <div className="flex flex-col gap-2">
                    {salesTeam.map((member) => (
                      <a
                        key={member.phone}
                        href={`https://wa.me/${member.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-white border border-forest-900/15 hover:border-[#d7ff00] rounded-md px-4 py-3 transition-all hover:-translate-y-0.5"
                      >
                        <MessageCircle className="w-4 h-4 text-[#25D366]" />
                        <div>
                          <span className="text-forest-900 text-sm font-body">{member.name}</span>
                          <span className="text-forest-900/50 text-xs font-body ml-2">+{member.phone}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Address */}
                <div className="mb-8">
                  <h3 className="text-forest-900 text-lg font-body font-medium mb-4">Address</h3>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-forest-900/50 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-forest-900/70 text-sm font-body leading-relaxed">
                        {officeAddress}
                      </p>
                      <a
                        href="https://maps.google.com/?q=Kepayan+Perdana+Kota+Kinabalu"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 text-sm font-body hover:underline mt-2 inline-block"
                      >
                        Get Directions
                      </a>
                    </div>
                  </div>
                </div>

                {/* Hours */}
                <div>
                  <h3 className="text-forest-900 text-lg font-body font-medium mb-4">Operating Hours</h3>
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-forest-900/50 shrink-0 mt-0.5" />
                    <div className="text-forest-900/70 text-sm font-body space-y-1">
                      {operatingHours.map((h, i) => (
                        <p key={i}>{h.day}: {h.hours}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Social */}
                <div className="mt-8 pt-6 border-t border-forest-900/10">
                  <h3 className="text-forest-900 text-sm font-body font-medium mb-3">Follow Us</h3>
                  <div className="space-y-2 text-sm font-body">
                    <p className="text-forest-900/60">
                      Instagram: <span className="text-forest-900">@askcreativeprinting</span>
                    </p>
                    <p className="text-forest-900/60">
                      Facebook: <span className="text-forest-900">ASK Creative Printing Services</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="h-[400px] w-full bg-off-white">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3968.3!2d116.0735!3d5.9804!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNcKwNTgnNDkuNCJFIDExNsKwMDQnMjQuNiJF!5e0!3m2!1sen!2smy!4v1"
          width="100%"
          height="100%"
          style={{ border: 0, filter: "grayscale(20%)" }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="ASK Creative Location Map"
        />
      </section>
    </>
  );
}
