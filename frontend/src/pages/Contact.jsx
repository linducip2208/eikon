import React, { useState } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { Mail, Phone, MapPin, Send, Loader2, Globe } from "lucide-react";
import toast from "react-hot-toast";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Semua field wajib diisi.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Mengirim pesan Anda...");
    try {
      const res = await request.post(API_ENDPOINTS.CONTACTS.SUBMIT, {
        name,
        email,
        message,
      });

      if (res.success) {
        toast.success(res.message || "Pesan Anda berhasil dikirim!", { id: toastId });
        setName("");
        setEmail("");
        setMessage("");
      }
    } catch (error) {
      toast.dismiss(toastId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Title */}
      <div className="space-y-2 border-b border-stone-100 pb-6 text-center md:text-left">
        <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-stone-400">Hubungi Kami</span>
        <h1 className="font-serif text-3xl md:text-5xl font-light text-stone-900 uppercase tracking-widest">Kontak Kami</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Left Side: Brand info */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-light text-stone-900">Contact Us</h2>
            <p className="text-sm font-light text-stone-500 leading-relaxed">
              We are delighted to assist you with product inquiries, order requests, and customer support. Our team is committed to providing a seamless and personalized experience for every Eliteikon customer.
            </p>
          </div>

          <div className="space-y-4 text-sm font-light text-stone-600">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-stone-450 mt-0.5 flex-shrink-0" />
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-0.5">Address</span>
                <span>Bekasi City, West Java, Indonesia</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Phone className="h-5 w-5 text-stone-450 mt-0.5 flex-shrink-0" />
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-0.5">WhatsApp</span>
                <a
                  href="https://wa.me/6287865407492"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-stone-900 transition-colors"
                >
                  +62 878 6540 7492
                </a>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-stone-450 mt-0.5 flex-shrink-0" />
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-0.5">Email</span>
                <a
                  href="mailto:ekonindonesiajaya@gmail.com"
                  className="hover:text-stone-900 transition-colors"
                >
                  ekonindonesiajaya@gmail.com
                </a>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Globe className="h-5 w-5 text-stone-450 mt-0.5 flex-shrink-0" />
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-0.5">Website</span>
                <a
                  href="https://www.eliteikon.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-stone-900 transition-colors"
                >
                  www.eliteikon.com
                </a>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <svg className="h-5 w-5 text-stone-450 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-0.5">Instagram</span>
                <a
                  href="https://www.instagram.com/eliteikon_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-stone-900 transition-colors"
                >
                  @eliteikon_
                </a>
              </div>
            </div>
          </div>

          <div className="h-[1px] w-full bg-stone-100" />

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Business Hours</h3>
            <p className="text-xs text-stone-600 font-light">Monday – Friday &bull; 09:00 AM – 05:00 PM (WIB)</p>
            <p className="text-xs text-stone-600 font-light">Saturday &bull; 09:00 AM – 03:00 PM (WIB)</p>
            <p className="text-xs text-stone-600 font-light">Sunday &amp; Public Holidays &bull; Closed</p>
          </div>

          <p className="text-xs font-light text-stone-500 leading-relaxed">
            We strive to respond to all inquiries within 24 business hours. Thank you for your patience and for choosing Eliteikon. We look forward to being part of your journey and helping you discover pieces that embody elegance, confidence, and timeless beauty.
          </p>
        </div>

        {/* Right Side: Contact Form */}
        <div className="lg:col-span-7 bg-white border border-stone-100 p-8 shadow-xs">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Nama Lengkap</label>
              <input
                type="text"
                required
                className="w-full bg-stone-50/50 border border-stone-200 px-3 py-3 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                placeholder="cth. Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Alamat Email</label>
              <input
                type="email"
                required
                className="w-full bg-stone-50/50 border border-stone-200 px-3 py-3 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                placeholder="cth. budi@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Pesan Anda</label>
              <textarea
                required
                rows="5"
                className="w-full bg-stone-50/50 border border-stone-200 px-3 py-3 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400 resize-none"
                placeholder="Tuliskan pertanyaan atau tanggapan Anda di sini..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-stone-900 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-850 active:bg-black disabled:opacity-50 transition-all duration-200"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{loading ? "Mengirim..." : "Kirim Pesan"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
