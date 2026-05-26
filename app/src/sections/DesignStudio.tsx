import { useState, useRef, useCallback } from 'react';
import { Upload, Type, Minus, Plus, Send, Shirt, MessageSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useQuoteRequest } from '@/hooks/useQuoteRequest';

const quoteSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().min(6, 'Nomor telepon minimal 6 karakter'),
  notes: z.string().optional(),
  website: z.string().optional(),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

// Product templates with SVG paths
const PRODUCTS = [
  {
    id: 'tshirt',
    name: 'T-Shirt',
    icon: Shirt,
    basePrice: 25,
    path: 'M80,40 L120,40 L140,70 L130,80 L130,280 L70,280 L70,80 L60,70 Z',
    viewBox: '0 0 200 320',
    logoArea: { x: 70, y: 80, w: 60, h: 80 },
  },
  {
    id: 'jersey',
    name: 'Sports Jersey',
    icon: Shirt,
    basePrice: 45,
    path: 'M75,35 L125,35 L150,65 L135,80 L135,285 L65,285 L65,80 L50,65 Z',
    viewBox: '0 0 200 320',
    logoArea: { x: 65, y: 85, w: 70, h: 90 },
  },
  {
    id: 'cap',
    name: 'Baseball Cap',
    icon: Shirt,
    basePrice: 20,
    path: 'M60,90 Q60,50 100,50 Q140,50 140,90 L140,100 Q140,110 130,110 L70,110 Q60,110 60,100 Z M140,95 L170,105 L165,115 L140,108 Z',
    viewBox: '0 0 230 160',
    logoArea: { x: 80, y: 55, w: 40, h: 40 },
  },
  {
    id: 'corporate',
    name: 'Corporate Shirt',
    icon: Shirt,
    basePrice: 35,
    path: 'M75,40 L90,40 L100,55 L110,40 L125,40 L150,75 L135,90 L135,280 L65,280 L65,90 L50,75 Z',
    viewBox: '0 0 200 320',
    logoArea: { x: 75, y: 100, w: 50, h: 60 },
  },
];

const COLORS = [
  { name: 'Deep Teal', value: '#0b3d3f' },
  { name: 'Dark Teal', value: '#062d2e' },
  { name: 'Mid Teal', value: '#1a6b6e' },
  { name: 'Light Teal', value: '#2a8a8e' },
  { name: 'Gold', value: '#b8a94e' },
  { name: 'White', value: '#f5f5f5' },
  { name: 'Black', value: '#1a1a1a' },
  { name: 'Navy', value: '#1a2744' },
  { name: 'Maroon', value: '#4a1525' },
  { name: 'Charcoal', value: '#3a3a3a' },
  { name: 'Royal Blue', value: '#1e3a5f' },
  { name: 'Forest Green', value: '#1a3a2a' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

const PRICING_TIERS = [
  { min: 1, max: 10, multiplier: 1.0 },
  { min: 11, max: 50, multiplier: 0.85 },
  { min: 51, max: 100, multiplier: 0.75 },
  { min: 101, max: 500, multiplier: 0.65 },
  { min: 501, max: Infinity, multiplier: 0.55 },
];

function getPricingMultiplier(qty: number) {
  const tier = PRICING_TIERS.find((t) => qty >= t.min && qty <= t.max);
  return tier ? tier.multiplier : 1.0;
}

export default function DesignStudio() {
  const [activeTab, setActiveTab] = useState<'style' | 'colours' | 'graphics'>('style');
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, number>>({ M: 10 });
  const [userImage, setUserImage] = useState<string | null>(null);
  const [userText, setUserText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const openTime = useRef(Math.floor(Date.now() / 1000));
  const quoteMutation = useQuoteRequest();

  const {
    register: registerQuote,
    handleSubmit: handleQuoteSubmitForm,
    reset: resetQuoteForm,
    setError: setQuoteError,
    formState: { errors: quoteErrors, isSubmitting: isQuoteSubmitting },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { website: '' },
  });

  const totalQuantity = Object.values(selectedSizes).reduce((a, b) => a + b, 0);
  const baseTotal = selectedProduct.basePrice * totalQuantity;
  const multiplier = getPricingMultiplier(totalQuantity);
  const estimatedPrice = Math.round(baseTotal * multiplier);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUserImage(ev.target?.result as string);
        setImagePosition({ x: 0, y: 0 });
        setImageScale(1);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setDragStart({ x: clientX - imagePosition.x, y: clientY - imagePosition.y });
    },
    [imagePosition]
  );

  const handleDragMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setImagePosition({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setImageScale((prev) => Math.max(0.3, Math.min(3, prev - e.deltaY * 0.001)));
  }, []);

  const updateSizeQty = (size: string, delta: number) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [size]: Math.max(0, (prev[size] || 0) + delta),
    }));
  };

  const onQuoteSubmit = async (values: QuoteFormValues) => {
    try {
      await quoteMutation.mutateAsync({
        name: values.name,
        email: values.email,
        phone: values.phone,
        product_snapshot: {
          name: selectedProduct.name,
          color: selectedColor,
          sizes: selectedSizes,
          qty: totalQuantity,
          price_estimate: estimatedPrice,
          design_image_url: userImage || undefined,
        },
        notes: values.notes || undefined,
        website: values.website ?? '',
        _t: openTime.current,
      });
      toast.success('Permintaan quote terkirim, tim sales akan menghubungi Anda.');
    } catch (err: unknown) {
      const e = err as { status?: number; code?: string; message?: string; fields?: Record<string, string[]> };
      if (e?.status === 422 && e.fields) {
        Object.entries(e.fields).forEach(([field, msgs]) => {
          if (field in quoteSchema.shape) {
            setQuoteError(field as keyof QuoteFormValues, { type: 'server', message: msgs[0] });
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

  const closeQuoteModal = () => {
    setShowQuoteForm(false);
    if (quoteMutation.isSuccess) {
      quoteMutation.reset();
      resetQuoteForm();
      openTime.current = Math.floor(Date.now() / 1000);
    }
  };

  // Get logo area for current product
  const la = selectedProduct.logoArea;
  const centerX = la.x + la.w / 2;
  const centerY = la.y + la.h / 2;

  return (
    <section
      id="studio"
      className="relative w-full"
      style={{ background: '#f4f6f7', minHeight: '100vh' }}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12" style={{ paddingTop: 120, paddingBottom: 120 }}>
        {/* Header */}
        <div className="mb-10">
          <p className="font-mono text-xs tracking-[2px] text-brand-teal-600 uppercase mb-4">
            CUSTOMIZE YOUR APPAREL
          </p>
          <h2
            className="font-display font-medium text-brand-teal-800"
            style={{ fontSize: 'clamp(32px, 3.5vw, 48px)', lineHeight: 1.1 }}
          >
            Design Studio
          </h2>
          <p className="font-body text-base text-[#1a1a1a]/70 mt-3 max-w-lg">
            Configure your custom apparel and request a quotation instantly.
            Select your product, choose colours, add your logo or text.
          </p>
        </div>

        {/* Main Interface */}
        <div className="flex flex-col lg:flex-row gap-6" style={{ minHeight: 600 }}>
          {/* Preview Panel */}
          <div
            className="flex-1 bg-white border border-brand-teal-800/15 flex items-center justify-center relative overflow-hidden select-none"
            style={{ minHeight: 500 }}
          >
            <svg
              ref={svgRef}
              viewBox={selectedProduct.viewBox}
              className="w-full h-full max-w-[400px] max-h-[500px]"
              style={{ cursor: userImage ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
              onMouseDown={userImage ? handleDragStart : undefined}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={userImage ? handleDragStart : undefined}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onWheel={userImage ? handleWheel : undefined}
            >
              <defs>
                <mask id="product-mask">
                  <rect x="0" y="0" width="1000" height="1000" fill="black" />
                  <path d={selectedProduct.path} fill="white" />
                </mask>
              </defs>

              {/* Shadow */}
              <path
                d={selectedProduct.path}
                fill="none"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="2"
                transform="translate(3, 3)"
              />

              {/* Masked group */}
              <g mask="url(#product-mask)">
                {/* Base color */}
                <rect x="0" y="0" width="1000" height="1000" fill={selectedColor} />

                {/* Subtle fabric texture pattern */}
                <pattern id="fabric" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="0.5" fill="rgba(255,255,255,0.05)" />
                </pattern>
                <rect x="0" y="0" width="1000" height="1000" fill="url(#fabric)" />

                {/* User uploaded logo */}
                {userImage && (
                  <image
                    href={userImage}
                    x={centerX - (la.w * imageScale) / 2 + imagePosition.x * 0.3}
                    y={centerY - (la.h * imageScale) / 2 + imagePosition.y * 0.3}
                    width={la.w * imageScale}
                    height={la.h * imageScale}
                    preserveAspectRatio="xMidYMid meet"
                    opacity={0.95}
                  />
                )}

                {/* User text */}
                {userText && (
                  <text
                    x={centerX}
                    y={centerY + la.h * 0.65}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={selectedProduct.id === 'cap' ? '10' : '14'}
                    fontFamily="'Space Grotesk', sans-serif"
                    fontWeight="500"
                    style={{ pointerEvents: 'none' }}
                  >
                    {userText}
                  </text>
                )}
              </g>

              {/* Outline stroke */}
              <path
                d={selectedProduct.path}
                fill="none"
                stroke="rgba(0,0,0,0.15)"
                strokeWidth="1.5"
              />
            </svg>

            {/* Helper text */}
            {userImage && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-brand-teal-800/90 text-white text-xs font-mono px-4 py-2 rounded-pill">
                Drag to position &bull; Scroll to zoom
              </div>
            )}
          </div>

          {/* Controls Panel */}
          <div className="w-full lg:w-[420px] bg-brand-teal-800 text-white flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-white/15">
              {(['style', 'colours', 'graphics'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 font-mono text-xs tracking-[1.5px] uppercase transition-colors ${
                    activeTab === tab
                      ? 'text-brand-gold-500 border-b-2 border-brand-gold-500'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* STYLE TAB */}
              {activeTab === 'style' && (
                <div className="space-y-6">
                  <div>
                    <label className="font-mono text-xs tracking-[1.5px] text-white/50 uppercase block mb-3">
                      Product Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {PRODUCTS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedProduct(p)}
                          className={`p-4 border text-left transition-all ${
                            selectedProduct.id === p.id
                              ? 'border-brand-gold-500 bg-brand-gold-500/10'
                              : 'border-white/15 hover:border-white/30'
                          }`}
                        >
                          <p className="font-display text-sm text-white">{p.name}</p>
                          <p className="font-mono text-xs text-white/50 mt-1">
                            RM{p.basePrice}/pc
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-mono text-xs tracking-[1.5px] text-white/50 uppercase block mb-3">
                      Size Breakdown
                    </label>
                    <div className="space-y-2">
                      {SIZES.map((size) => (
                        <div key={size} className="flex items-center justify-between py-2 border-b border-white/10">
                          <span className="font-display text-sm text-white/80 w-12">{size}</span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateSizeQty(size, -1)}
                              className="w-8 h-8 flex items-center justify-center border border-white/20 hover:border-brand-gold-500 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-mono text-sm w-8 text-center">
                              {selectedSizes[size] || 0}
                            </span>
                            <button
                              onClick={() => updateSizeQty(size, 1)}
                              className="w-8 h-8 flex items-center justify-center border border-white/20 hover:border-brand-gold-500 transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* COLOURS TAB */}
              {activeTab === 'colours' && (
                <div>
                  <label className="font-mono text-xs tracking-[1.5px] text-white/50 uppercase block mb-3">
                    Base Colour
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setSelectedColor(c.value)}
                        className={`aspect-square rounded-sm border-2 transition-all ${
                          selectedColor === c.value
                            ? 'border-brand-gold-500 scale-110'
                            : 'border-transparent hover:border-white/30'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <p className="font-mono text-xs text-white/40 mt-3">{COLORS.find(c => c.value === selectedColor)?.name}</p>

                  <div className="mt-8">
                    <label className="font-mono text-xs tracking-[1.5px] text-white/50 uppercase block mb-3">
                      Text Colour
                    </label>
                    <div className="flex gap-3 flex-wrap">
                      {['#ffffff', '#000000', '#b8a94e', '#1a6b6e', '#ff4444', '#4444ff'].map(
                        (c) => (
                          <button
                            key={c}
                            onClick={() => setTextColor(c)}
                            className={`w-10 h-10 rounded-full border-2 transition-all ${
                              textColor === c
                                ? 'border-brand-gold-500 scale-110'
                                : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* GRAPHICS TAB */}
              {activeTab === 'graphics' && (
                <div className="space-y-6">
                  <div>
                    <label className="font-mono text-xs tracking-[1.5px] text-white/50 uppercase block mb-3">
                      Your Logo / Graphic
                    </label>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-6 border-2 border-dashed border-white/20 hover:border-brand-gold-500 flex flex-col items-center gap-2 transition-colors"
                    >
                      <Upload size={24} className="text-white/50" />
                      <span className="font-mono text-xs text-white/60">
                        {userImage ? 'Change Logo' : 'Upload Logo'}
                      </span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {userImage && (
                      <button
                        onClick={() => {
                          setUserImage(null);
                          setImagePosition({ x: 0, y: 0 });
                          setImageScale(1);
                        }}
                        className="font-mono text-xs text-red-400 hover:text-red-300 mt-2"
                      >
                        Remove logo
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="font-mono text-xs tracking-[1.5px] text-white/50 uppercase block mb-3">
                      Add Text
                    </label>
                    <div className="flex items-center gap-3">
                      <Type size={18} className="text-white/50" />
                      <input
                        type="text"
                        value={userText}
                        onChange={(e) => setUserText(e.target.value)}
                        placeholder="YOUR TEXT HERE"
                        maxLength={20}
                        className="flex-1 bg-transparent border-b border-white/20 py-2 font-display text-sm text-white placeholder:text-white/30 focus:border-brand-gold-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {userImage && (
                    <div>
                      <label className="font-mono text-xs tracking-[1.5px] text-white/50 uppercase block mb-2">
                        Logo Scale: {Math.round(imageScale * 100)}%
                      </label>
                      <input
                        type="range"
                        min="30"
                        max="300"
                        value={imageScale * 100}
                        onChange={(e) => setImageScale(Number(e.target.value) / 100)}
                        className="w-full accent-brand-gold-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="border-t border-white/15 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-[1px] text-white/50 uppercase">
                  Total Qty
                </span>
                <span className="font-display text-lg text-white">{totalQuantity} pcs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-[1px] text-white/50 uppercase">
                  Est. Price (RM)
                </span>
                <span className="font-display text-2xl text-brand-gold-500">
                  RM{estimatedPrice.toLocaleString()}
                </span>
              </div>
              {totalQuantity >= 11 && (
                <p className="font-mono text-xs text-brand-gold-400/70">
                  Bulk discount applied: {Math.round((1 - multiplier) * 100)}% off
                </p>
              )}
              <button
                onClick={() => setShowQuoteForm(true)}
                className="w-full bg-brand-gold-500 hover:bg-brand-gold-400 text-[#062d2e] font-mono text-xs tracking-[1.5px] py-4 rounded-pill transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <Send size={14} />
                REQUEST QUOTATION
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Form Modal */}
      {showQuoteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-teal-800 w-full max-w-md p-8 border border-white/15 relative">
            <button
              onClick={closeQuoteModal}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <Minus size={20} className="rotate-45" />
            </button>

            {quoteMutation.isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-brand-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={28} className="text-brand-gold-500" />
                </div>
                <h3 className="font-display text-xl text-white mb-2">Quote Requested!</h3>
                <p className="font-body text-sm text-white/60">
                  Our sales team will contact you shortly.
                </p>
                <button
                  onClick={closeQuoteModal}
                  className="mt-6 font-mono text-xs tracking-[1.5px] text-brand-gold-500 hover:text-brand-gold-400 underline"
                >
                  CLOSE
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-xl text-white mb-1">Request Quotation</h3>
                <p className="font-body text-sm text-white/50 mb-6">
                  {selectedProduct.name} &bull; {totalQuantity} pcs &bull; Est. RM{estimatedPrice}
                </p>

                <form onSubmit={handleQuoteSubmitForm(onQuoteSubmit)} className="space-y-4" noValidate>
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
                    {...registerQuote('website')}
                    aria-hidden="true"
                  />

                  <div>
                    <label className="font-mono text-xs tracking-[1px] text-white/50 uppercase block mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      {...registerQuote('name')}
                      className="w-full bg-transparent border border-white/20 py-3 px-4 font-body text-sm text-white placeholder:text-white/30 focus:border-brand-gold-500 focus:outline-none transition-colors"
                      placeholder="Your name"
                    />
                    {quoteErrors.name && <p className="text-red-400 text-xs mt-1 font-mono">{quoteErrors.name.message}</p>}
                  </div>
                  <div>
                    <label className="font-mono text-xs tracking-[1px] text-white/50 uppercase block mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      {...registerQuote('email')}
                      className="w-full bg-transparent border border-white/20 py-3 px-4 font-body text-sm text-white placeholder:text-white/30 focus:border-brand-gold-500 focus:outline-none transition-colors"
                      placeholder="you@company.com"
                    />
                    {quoteErrors.email && <p className="text-red-400 text-xs mt-1 font-mono">{quoteErrors.email.message}</p>}
                  </div>
                  <div>
                    <label className="font-mono text-xs tracking-[1px] text-white/50 uppercase block mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      {...registerQuote('phone')}
                      className="w-full bg-transparent border border-white/20 py-3 px-4 font-body text-sm text-white placeholder:text-white/30 focus:border-brand-gold-500 focus:outline-none transition-colors"
                      placeholder="+60 12-345 6789"
                    />
                    {quoteErrors.phone && <p className="text-red-400 text-xs mt-1 font-mono">{quoteErrors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="font-mono text-xs tracking-[1px] text-white/50 uppercase block mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      rows={3}
                      {...registerQuote('notes')}
                      className="w-full bg-transparent border border-white/20 py-3 px-4 font-body text-sm text-white placeholder:text-white/30 focus:border-brand-gold-500 focus:outline-none transition-colors resize-none"
                      placeholder="Any special requirements..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isQuoteSubmitting || quoteMutation.isPending || totalQuantity === 0}
                    className="w-full bg-brand-gold-500 hover:bg-brand-gold-400 disabled:opacity-60 disabled:cursor-not-allowed text-[#062d2e] font-mono text-xs tracking-[1.5px] py-4 rounded-pill transition-colors flex items-center justify-center gap-2"
                  >
                    <Send size={14} />
                    {isQuoteSubmitting || quoteMutation.isPending ? 'SENDING...' : 'SEND QUOTE REQUEST'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
